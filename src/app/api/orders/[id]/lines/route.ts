import { requireLive } from '@/lib/auth';
import { batch, first } from '@/lib/db';
import { naira, today } from '@/lib/q';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireLive(); if ('res' in g) return g.res;
  const { id } = await params; const b = (await req.json() as any);
  const o = await first<any>('live', 'SELECT * FROM orders WHERE id=?', [id]);
  if (!o) return Response.json({ error: 'Order not found' }, { status: 404 });
  const qty = Math.floor(Number(b.qty)), price = Math.floor(Number(b.unit_price));
  if (!String(b.item || '').trim() || !(qty > 0) || !(price >= 0)) return Response.json({ error: 'Item, quantity and price are needed' }, { status: 400 });
  const confirmed = o.stage !== 'Draft';
  if (confirmed && !String(b.reason || '').trim()) return Response.json({ error: 'Say why the order is changing' }, { status: 400 });
  const n = (await first<any>('live', 'SELECT COALESCE(MAX(line_no),0)+1 n FROM order_lines WHERE order_id=?', [id]))!.n;
  const stmts: any[] = [['INSERT INTO order_lines(order_id,line_no,item,detail,qty,unit_price,sizes) VALUES(?,?,?,?,?,?,?)', [id, n, String(b.item).trim(), b.detail || null, qty, price, b.sizes || null]]];
  if (confirmed) stmts.push(['INSERT INTO order_changes(order_id,date,by,change,amount,reason) VALUES(?,?,?,?,?,?)', [id, today(), g.ctx.user?.name, `Added ${b.item} × ${qty}`, qty * price, b.reason]]);
  stmts.push(['UPDATE orders SET updated=? WHERE id=?', [new Date().toISOString(), id]]);
  await batch('live', stmts);
  const nl = await first<any>('live', 'SELECT id FROM order_lines WHERE order_id=? AND line_no=?', [id, n]);
  return Response.json({ ok: true, id: nl?.id });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireLive(); if ('res' in g) return g.res;
  const { id } = await params; const b = (await req.json() as any);
  const o = await first<any>('live', 'SELECT * FROM orders WHERE id=?', [id]);
  const l = await first<any>('live', 'SELECT * FROM order_lines WHERE id=? AND order_id=?', [b.line_id, id]);
  if (!o || !l) return Response.json({ error: 'Line not found' }, { status: 404 });
  const qty = Math.floor(Number(b.qty)), price = Math.floor(Number(b.unit_price));
  if (!(qty >= 0) || !(price >= 0)) return Response.json({ error: 'Quantity and price must be numbers' }, { status: 400 });
  const confirmed = o.stage !== 'Draft';
  if (confirmed && !String(b.reason || '').trim()) return Response.json({ error: 'Say why the order is changing' }, { status: 400 });
  if (qty === l.qty && price === l.unit_price && b.item === undefined && b.detail === undefined && b.sizes === undefined) return Response.json({ ok: true });
  const parts: string[] = [];
  if (qty !== l.qty) parts.push(`${l.item} ${l.qty} → ${qty}`);
  if (price !== l.unit_price) parts.push(`${l.item} price ${naira(l.unit_price)} → ${naira(price)}`);
  const item = b.item !== undefined ? String(b.item).trim() || l.item : l.item;
  const detail = b.detail !== undefined ? (String(b.detail).trim() || null) : l.detail;
  const sizes = b.sizes !== undefined ? (String(b.sizes).trim() || null) : l.sizes;
  const stmts: any[] = [qty === 0 ? ['DELETE FROM order_lines WHERE id=?', [l.id]] : ['UPDATE order_lines SET qty=?, unit_price=?, item=?, detail=?, sizes=? WHERE id=?', [qty, price, item, detail, sizes, l.id]]];
  if (confirmed) stmts.push(['INSERT INTO order_changes(order_id,date,by,change,amount,reason) VALUES(?,?,?,?,?,?)', [id, today(), g.ctx.user?.name, qty === 0 ? `Removed ${l.item}` : parts.join(', ') || `Edited ${l.item}`, qty * price - l.qty * l.unit_price, b.reason]]);
  stmts.push(['UPDATE orders SET updated=? WHERE id=?', [new Date().toISOString(), id]]);
  await batch('live', stmts);
  return Response.json({ ok: true });
}
