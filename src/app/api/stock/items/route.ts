import { requireLive } from '@/lib/auth';
import { run } from '@/lib/db';
import { nid } from '@/lib/q';
export async function POST(req: Request) {
  const g = await requireLive(); if ('res' in g) return g.res;
  const b = (await req.json() as any); const name = String(b.name || '').trim();
  if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });
  const id = nid('s');
  await run('live', 'INSERT INTO stock_items(id,name,type,unit,on_hand,reserved,supplier,cost,warn_below) VALUES(?,?,?,?,0,0,?,?,?)', [id, name, b.type || 'Fabric', b.unit || 'pieces', b.supplier || null, b.cost ? Number(b.cost) : null, b.warn_below ? Number(b.warn_below) : null]);
  return Response.json({ ok: true, id });
}
