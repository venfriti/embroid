import { requireLive } from '@/lib/auth';
import { batch, first } from '@/lib/db';

const stamp = () => new Date().toISOString();
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireLive(); if ('res' in g) return g.res;
  const { id } = await params; const b = await req.json() as any; const body = String(b.body || '').trim();
  if (!body || body.length > 10000) return Response.json({ error: 'Write a note of up to 10,000 characters' }, { status: 400 });
  const note = await first<any>('live', 'SELECT * FROM notes WHERE id=? AND removed_at IS NULL', [id]);
  if (!note) return Response.json({ error: 'That note could not be found' }, { status: 404 });
  const at = stamp(); const by = g.ctx.user?.name || g.ctx.user?.email || 'Staff';
  await batch('live', [
    ['UPDATE notes SET body=?,updated_at=?,updated_by=? WHERE id=?', [body, at, by, id]],
    ['INSERT INTO note_events(note_id,action,body,detail,at,by) VALUES(?,?,?,?,?,?)', [id, 'edited', note.body, 'Previous note text', at, by]],
  ]);
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireLive(); if ('res' in g) return g.res;
  const { id } = await params; const note = await first<any>('live', 'SELECT * FROM notes WHERE id=? AND removed_at IS NULL', [id]);
  if (!note) return Response.json({ error: 'That note could not be found' }, { status: 404 });
  const at = stamp(); const by = g.ctx.user?.name || g.ctx.user?.email || 'Staff';
  await batch('live', [
    ['UPDATE notes SET removed_at=?,removed_by=?,updated_at=?,updated_by=? WHERE id=?', [at, by, at, by, id]],
    ['INSERT INTO note_events(note_id,action,body,at,by) VALUES(?,?,?,?,?)', [id, 'removed', note.body, at, by]],
  ]);
  return Response.json({ ok: true });
}
