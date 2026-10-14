import { getCtx, requireLive } from '@/lib/auth';
import { batch, cfEnv, first } from '@/lib/db';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED: Record<string, string[]> = { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] };
const stamp = () => new Date().toISOString();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireLive(); if ('res' in g) return g.res;
  const { id } = await params; const note = await first<any>('live', 'SELECT id FROM notes WHERE id=? AND removed_at IS NULL', [id]);
  if (!note) return Response.json({ error: 'That note could not be found' }, { status: 404 });
  const form = await req.formData(); const file = form.get('file');
  if (!(file instanceof File)) return Response.json({ error: 'Choose a PDF or image to attach' }, { status: 400 });
  const type = file.type.toLowerCase(); const ext = ALLOWED[type]?.find(x => file.name.toLowerCase().endsWith(x));
  if (!ext) return Response.json({ error: 'Use a PDF, JPG, PNG or WebP file' }, { status: 400 });
  if (!file.size || file.size > MAX_SIZE) return Response.json({ error: 'Attachments must be smaller than 10 MB' }, { status: 400 });
  const bytes = await file.arrayBuffer(); const head = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 12));
  const isPdf = type === 'application/pdf' && new TextDecoder().decode(head.slice(0, 5)) === '%PDF-';
  const isJpeg = type === 'image/jpeg' && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const isPng = type === 'image/png' && head[0] === 0x89 && new TextDecoder().decode(head.slice(1, 4)) === 'PNG';
  const isWebp = type === 'image/webp' && new TextDecoder().decode(head.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(head.slice(8, 12)) === 'WEBP';
  if (!(isPdf || isJpeg || isPng || isWebp)) return Response.json({ error: 'The file contents do not match a supported PDF or image' }, { status: 400 });
  const env = await cfEnv();
  const fileId = crypto.randomUUID(); const key = `${id}/${fileId}${ext}`; const at = stamp(); const by = g.ctx.user?.name || g.ctx.user?.email || 'Staff';
  const filename = file.name.replace(/[\r\n\/\\]/g, '_').slice(0, 180) || `attachment${ext}`;
  await env.NOTE_FILES.put(key, bytes, { httpMetadata: { contentType: type } });
  try {
    await batch('live', [
      ['INSERT INTO note_attachments(id,note_id,object_key,filename,content_type,size,created_at,created_by) VALUES(?,?,?,?,?,?,?,?)', [fileId, id, key, filename, type, file.size, at, by]],
      ['INSERT INTO note_events(note_id,action,detail,at,by) VALUES(?,?,?,?,?)', [id, 'attachment added', filename, at, by]],
    ]);
  } catch (e) { await env.NOTE_FILES.delete(key); throw e; }
  return Response.json({ ok: true, id: fileId });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireLive(); if ('res' in g) return g.res;
  const { id } = await params; const fileId = new URL(req.url).searchParams.get('file');
  if (!fileId) return Response.json({ error: 'Choose an attachment' }, { status: 400 });
  const f = await first<any>('live', 'SELECT * FROM note_attachments WHERE id=? AND note_id=? AND removed_at IS NULL', [fileId, id]);
  if (!f) return Response.json({ error: 'That attachment could not be found' }, { status: 404 });
  const note = await first<any>('live', 'SELECT removed_at FROM notes WHERE id=?', [id]);
  if (!note || note.removed_at) return Response.json({ error: 'That note could not be found' }, { status: 404 });
  const at = stamp(); const by = g.ctx.user?.name || g.ctx.user?.email || 'Staff';
  await batch('live', [
    ['UPDATE note_attachments SET removed_at=?,removed_by=? WHERE id=?', [at, by, fileId]],
    ['INSERT INTO note_events(note_id,action,detail,at,by) VALUES(?,?,?,?,?)', [id, 'attachment removed', f.filename, at, by]],
  ]);
  return Response.json({ ok: true });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getCtx(); const { id } = await params; const fileId = new URL(req.url).searchParams.get('file');
  if (ctx.mode !== 'live') return Response.json({ error: 'Sign in to view attachments' }, { status: 403 });
  if (!fileId) return Response.json({ error: 'Choose an attachment' }, { status: 400 });
  const f = await first<any>('live', 'SELECT a.*,n.removed_at note_removed FROM note_attachments a JOIN notes n ON n.id=a.note_id WHERE a.id=? AND a.note_id=?', [fileId, id]);
  if (!f || f.removed_at || f.note_removed) return Response.json({ error: 'That attachment is not available' }, { status: 404 });
  const env = await cfEnv(); const obj = await env.NOTE_FILES.get(f.object_key);
  if (!obj) return Response.json({ error: 'That attachment is not available' }, { status: 404 });
  const asciiName = String(f.filename).replace(/[^\x20-\x7E]|["\\;]/g, '_');
  return new Response(obj.body, { headers: { 'Content-Type': f.content_type, 'Content-Length': String(f.size), 'Content-Disposition': `inline; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(f.filename)}`, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' } });
}
