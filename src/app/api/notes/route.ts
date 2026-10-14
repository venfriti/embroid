import { getCtx, requireLive } from '@/lib/auth';
import { all, batch, first } from '@/lib/db';

const stamp = () => new Date().toISOString();
const validScope = (scope: string | null): scope is 'customer' | 'order' => scope === 'customer' || scope === 'order';

export async function GET(req: Request) {
  const { mode } = await getCtx();
  const url = new URL(req.url); const scope = url.searchParams.get('scope'); const owner = (url.searchParams.get('owner') || '').trim();
  if (!validScope(scope) || !owner) return Response.json({ error: 'Choose a customer or order' }, { status: 400 });
  const includeRemoved = url.searchParams.get('removed') === '1';
  const ownerField = scope === 'customer' ? 'customer_id' : 'order_id';
  const notes = await all<any>(mode, `SELECT * FROM notes WHERE ${ownerField}=? ${includeRemoved ? '' : 'AND removed_at IS NULL'} ORDER BY created_at DESC`, [owner]);
  const result = await Promise.all(notes.map(async note => ({
    ...note,
    attachments: await all<any>(mode, `SELECT * FROM note_attachments WHERE note_id=? ${includeRemoved ? '' : 'AND removed_at IS NULL'} ORDER BY created_at`, [note.id]),
    events: await all<any>(mode, 'SELECT id,action,body,detail,at,by FROM note_events WHERE note_id=? ORDER BY id', [note.id]),
  })));
  return Response.json({ ok: true, notes: result });
}

export async function POST(req: Request) {
  const g = await requireLive(); if ('res' in g) return g.res;
  const b = await req.json() as any; const scope = String(b.scope || ''); const owner = String(b.owner || '').trim(); const body = String(b.body || '').trim();
  if (!validScope(scope) || !owner || !body || body.length > 10000) return Response.json({ error: 'Write a note of up to 10,000 characters' }, { status: 400 });
  const ownerField = scope === 'customer' ? 'customer_id' : 'order_id';
  if (!await first('live', `SELECT id FROM ${scope === 'customer' ? 'customers' : 'orders'} WHERE id=?`, [owner])) return Response.json({ error: 'That record could not be found' }, { status: 404 });
  const id = crypto.randomUUID(); const at = stamp(); const by = g.ctx.user?.name || g.ctx.user?.email || 'Staff';
  await batch('live', [
    [`INSERT INTO notes(id,${ownerField},body,created_at,created_by,updated_at,updated_by) VALUES(?,?,?,?,?,?,?)`, [id, owner, body, at, by, at, by]],
    ['INSERT INTO note_events(note_id,action,body,at,by) VALUES(?,?,?,?,?)', [id, 'added', body, at, by]],
  ]);
  return Response.json({ ok: true, id });
}
