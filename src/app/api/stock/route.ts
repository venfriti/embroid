import { requireLive } from '@/lib/auth';
import { all, batch } from '@/lib/db';
import { today } from '@/lib/q';
export async function POST(req: Request) {
  const g = await requireLive(); if ('res' in g) return g.res;
  const b = (await req.json() as any);
  const lines = (b.lines || []).filter((l: any) => l.item_id && Number(l.qty) > 0);
  if (!lines.length) return Response.json({ error: 'Add at least one item with a quantity' }, { status: 400 });
  const items = await all<any>('live', 'SELECT * FROM stock_items');
  const date = b.date || today(), ref = ([b.supplier, b.invoice && `inv ${b.invoice}`].filter(Boolean).join(' · ') || 'Delivery') + (b.note ? ` — ${String(b.note).slice(0, 200)}` : '');
  const running: Record<string, number> = {}; const stmts: any[] = [];
  for (const l of lines) {
    const it = items.find(i => i.id === l.item_id); if (!it) return Response.json({ error: 'Unknown item' }, { status: 400 });
    const after = (running[it.id] ?? it.on_hand) + Number(l.qty); running[it.id] = after;
    stmts.push(['UPDATE stock_items SET on_hand=?, cost=COALESCE(NULLIF(?,0),cost), supplier=COALESCE(?,supplier) WHERE id=?', [after, Number(l.unit_cost) || 0, b.supplier || null, it.id]],
      ['INSERT INTO stock_movements(item_id,date,kind,reference,change,on_hand_after) VALUES(?,?,?,?,?,?)', [it.id, date, 'Delivered', ref, Number(l.qty), after]]);
  }
  await batch('live', stmts);
  return Response.json({ ok: true });
}
