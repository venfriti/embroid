import { requireLive } from '@/lib/auth';
import { all, batch } from '@/lib/db';
import { today } from '@/lib/q';
export async function POST(req: Request) {
  const g = await requireLive(); if ('res' in g) return g.res;
  const b = (await req.json() as any);
  const lines = (Array.isArray(b.lines) ? b.lines : []).filter((l: any) => l.item_id && Number(l.qty) > 0);
  if (!lines.length) return Response.json({ error: 'Add at least one item with a quantity' }, { status: 400 });
  const items = await all<any>('live', 'SELECT * FROM stock_items');
  const date = b.date || today(), ref = ([b.supplier, b.invoice && `inv ${b.invoice}`].filter(Boolean).join(' · ') || 'Delivery') + (b.note ? ` — ${String(b.note).slice(0, 200)}` : '');
  const stmts: any[] = [];
  for (const l of lines) {
    const it = items.find(i => i.id === l.item_id); if (!it) return Response.json({ error: 'Unknown item' }, { status: 400 });
    const qty = Number(l.qty), cost = Number(l.unit_cost) || 0;
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(cost) || cost < 0) return Response.json({ error: 'Quantity and cost must be valid positive numbers' }, { status: 400 });
    stmts.push(['UPDATE stock_items SET on_hand=on_hand+?, cost=COALESCE(NULLIF(?,0),cost), supplier=COALESCE(?,supplier) WHERE id=?', [qty, cost, b.supplier || null, it.id]],
      ['INSERT INTO stock_movements(item_id,date,kind,reference,change,on_hand_after) SELECT ?,?,?,?,?,on_hand FROM stock_items WHERE id=?', [it.id, date, 'Delivered', ref, qty, it.id]]);
  }
  await batch('live', stmts);
  return Response.json({ ok: true });
}
