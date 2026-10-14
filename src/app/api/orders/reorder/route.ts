import { requireLive } from '@/lib/auth';
import { all, batch, first } from '@/lib/db';
import { nid, priceFor } from '@/lib/q';
/** Start a draft from a past order. Quantities come from the picker, prices are today's prices. */
export async function POST(req: Request) {
  const g = await requireLive(); if ('res' in g) return g.res;
  const b = (await req.json() as any);
  const from = await first<any>('live', 'SELECT * FROM orders WHERE id=?', [b.from]);
  if (!from) return Response.json({ error: 'Order not found' }, { status: 404 });
  if (!Array.isArray(b.lines)) return Response.json({ error: 'Choose at least one line to copy' }, { status: 400 });
  const picks: { line_id: number; qty: number }[] = [];
  for (const entry of b.lines) {
    const line_id = Number(entry?.line_id), qty = Number(entry?.qty);
    if (!Number.isSafeInteger(line_id) || !Number.isSafeInteger(qty) || qty < 0 || qty > 1000000) return Response.json({ error: 'Line quantities must be whole numbers up to 1,000,000' }, { status: 400 });
    if (qty > 0) picks.push({ line_id, qty });
  }
  if (!picks.length) return Response.json({ error: 'Tick at least one line' }, { status: 400 });
  const old = await all<any>('live', 'SELECT * FROM order_lines WHERE order_id=?', [from.id]);
  if (picks.some(p => !old.some(l => l.id === p.line_id))) return Response.json({ error: 'A selected line does not belong to that order' }, { status: 400 });
  const id = nid('o');
  const stmts: any[] = [["INSERT INTO orders(id,customer_id,name,due,stage,discount) VALUES(?,?,?,?, 'Draft', 0)", [id, from.customer_id, String(b.name || `Reorder of ${from.name}`).trim(), b.due || null]]];
  let n = 1;
  for (const p of picks) {
    const l = old.find(x => x.id === p.line_id)!;
    const price = (await priceFor('live', from.customer_id, l.item)) ?? l.unit_price;
    stmts.push(['INSERT INTO order_lines(order_id,line_no,item,detail,qty,unit_price,decor_price,design) VALUES(?,?,?,?,?,?,?,?)', [id, n++, l.item, l.detail, Math.floor(Number(p.qty)), price, l.decor_price || 0, l.design]]);
  }
  await batch('live', stmts);
  return Response.json({ ok: true, id });
}
