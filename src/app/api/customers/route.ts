import { requireLive } from '@/lib/auth';
import { run } from '@/lib/db';
import { nid, today } from '@/lib/q';
export async function POST(req: Request) {
  const g = await requireLive(); if ('res' in g) return g.res;
  const b = (await req.json() as any); const name = String(b.name || '').trim();
  if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });
  const id = nid('c');
  await run('live', 'INSERT INTO customers(id,name,short_name,kind,contact,phone,email,address,payment_terms,deposit_pct,notes,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
    [id, name, b.short_name || null, ['school', 'individual', 'other'].includes(b.kind) ? b.kind : 'school', b.contact || null, b.phone || null, b.email || null, b.address || null, b.payment_terms || null, b.deposit_pct ? Number(b.deposit_pct) : null, b.notes || null, today()]);
  return Response.json({ ok: true, id });
}
