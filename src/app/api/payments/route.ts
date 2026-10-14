import { requireLive } from '@/lib/auth';
import { batch } from '@/lib/db';
import { orders, today } from '@/lib/q';
/** Records a payment for one customer. Either an explicit split across orders, or the oldest due first. */
export async function POST(req: Request) {
  const g = await requireLive(); if ('res' in g) return g.res;
  const b = (await req.json() as any);
  if (!b.customer_id) return Response.json({ error: 'Customer is needed' }, { status: 400 });
  const open = (await orders('live', 'WHERE o.customer_id=?', [b.customer_id])).filter(o => o.balance > 0 && o.stage !== 'Draft');
  let split: { id: string; amount: number }[] = [];
  if (Array.isArray(b.allocations)) {
    for (const a of b.allocations) {
      const amt = Math.floor(Number(a.amount)); if (!(amt > 0)) continue;
      const o = open.find(x => x.id === a.order_id);
      if (!o) return Response.json({ error: 'An order in the split is not owing anything' }, { status: 400 });
      if (amt > o.balance) return Response.json({ error: `${o.name} only owes ₦${o.balance.toLocaleString('en-NG')}` }, { status: 400 });
      split.push({ id: o.id, amount: amt });
    }
    if (!split.length) return Response.json({ error: 'Enter an amount against at least one order' }, { status: 400 });
  } else {
    let left = Math.floor(Number(b.amount));
    if (!(left > 0)) return Response.json({ error: 'Enter an amount' }, { status: 400 });
    if (left > open.reduce((s, o) => s + o.balance, 0)) return Response.json({ error: 'That is more than the customer owes' }, { status: 400 });
    for (const o of open) { if (left <= 0) break; const a = Math.min(left, o.balance); split.push({ id: o.id, amount: a }); left -= a; }
  }
  const stmts: any[] = split.map(s => ['INSERT INTO payments(order_id,date,method,amount,ref,note,by) VALUES(?,?,?,?,?,?,?)', [s.id, b.date || today(), b.method || 'Transfer', s.amount, b.ref || null, b.note || null, g.ctx.user?.name || null]]);
  for (const s of split) stmts.push(['UPDATE orders SET updated=? WHERE id=?', [new Date().toISOString(), s.id]]);
  await batch('live', stmts);
  return Response.json({ ok: true });
}
