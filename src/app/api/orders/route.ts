import { requireLive } from '@/lib/auth';
import { run } from '@/lib/db';
import { nid } from '@/lib/q';
export async function POST(req: Request) {
  const g = await requireLive(); if ('res' in g) return g.res;
  const b = (await req.json() as any);
  if (!b.customer_id || !String(b.name || '').trim()) return Response.json({ error: 'Customer and order name are required' }, { status: 400 });
  const id = nid('o');
  await run('live', "INSERT INTO orders(id,customer_id,name,due,stage,discount,updated) VALUES(?,?,?,?, 'Draft', 0, ?)", [id, b.customer_id, String(b.name).trim(), b.due || null, new Date().toISOString()]);
  return Response.json({ ok: true, id });
}
