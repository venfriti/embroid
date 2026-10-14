import { getCtx, requireLive } from '@/lib/auth';
import { first, run } from '@/lib/db';
/** Save the studio mockup for a line. Stored as JSON on the line so reorders and the production sheet can reuse it. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  const g = await requireLive(); if ('res' in g) return g.res;
  const { id, lineId } = await params; const b = (await req.json() as any);
  const txt = JSON.stringify(b.design ?? null);
  if (txt.length > 900000) return Response.json({ error: 'That design is too large to save' }, { status: 413 });
  await run('live', 'UPDATE order_lines SET design=? WHERE id=? AND order_id=?', [txt, Number(lineId), id]);
  return Response.json({ ok: true });
}

/** Read one line with its saved mockup. Open to demo visitors too (they see sample data). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  const { mode } = await getCtx(); const { id, lineId } = await params;
  const l = await first<any>(mode, 'SELECT l.item, l.detail, l.qty, l.design, o.name order_name, c.name customer FROM order_lines l JOIN orders o ON o.id=l.order_id JOIN customers c ON c.id=o.customer_id WHERE l.id=? AND l.order_id=?', [Number(lineId), id]);
  if (!l) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ ...l, design: l.design ? JSON.parse(l.design) : null });
}
