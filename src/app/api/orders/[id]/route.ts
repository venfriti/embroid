import { requireLive } from '@/lib/auth';
import { batch, first, run } from '@/lib/db';
import { STAGES, today } from '@/lib/q';
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireLive(); if ('res' in g) return g.res;
  const { id } = await params; const b = (await req.json() as any);
  const o = await first<any>('live', 'SELECT * FROM orders WHERE id=?', [id]);
  if (!o) return Response.json({ error: 'Order not found' }, { status: 404 });
  if (b.stage) {
    if (!STAGES.includes(b.stage)) return Response.json({ error: 'Unknown stage' }, { status: 400 });
    const stmts: any[] = [];
    if (o.stage === 'Draft' && b.stage !== 'Draft') {
      const hasLines = (await first<any>('live', 'SELECT COUNT(*) c FROM order_lines WHERE order_id=?', [id]))!.c;
      if (!hasLines) return Response.json({ error: 'Add at least one line before confirming' }, { status: 400 });
      const n = (await first<any>('live', 'SELECT COUNT(*) c FROM orders WHERE invoice_no IS NOT NULL'))!.c + 1;
      stmts.push(['UPDATE orders SET invoice_no=COALESCE(invoice_no,?), placed=COALESCE(placed,?) WHERE id=?', [`INV-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`, today(), id]]);
    }
    stmts.push(['UPDATE orders SET stage=? WHERE id=?', [b.stage, id]], ['INSERT INTO stage_log(order_id,at,by,from_stage,to_stage) VALUES(?,?,?,?,?)', [id, new Date().toISOString(), g.ctx.user?.name, o.stage, b.stage]]);
    await batch('live', stmts);
  }
  if (b.discount !== undefined) {
    const discount = Number(b.discount);
    if (!Number.isSafeInteger(discount) || discount < 0) return Response.json({ error: 'Discount must be a whole amount of zero or more' }, { status: 400 });
    const saved = await run('live', 'UPDATE orders SET discount=? WHERE id=? AND ? <= (SELECT COALESCE(SUM(qty*(unit_price+decor_price)),0) FROM order_lines WHERE order_id=?)', [discount, id, discount, id]);
    if (!saved.meta.changes) return Response.json({ error: 'Discount cannot be more than the order total' }, { status: 400 });
  }
  if (b.due) await run('live', 'UPDATE orders SET due=? WHERE id=?', [b.due, id]);
  await run('live', 'UPDATE orders SET updated=? WHERE id=?', [new Date().toISOString(), id]);
  return Response.json({ ok: true });
}
