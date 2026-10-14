import { login } from '@/lib/auth';
export async function POST(req: Request) {
  const ip = req.headers.get('cf-connecting-ip') || (req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
  const { email, password } = (await req.json() as any);
  const r = await login(String(email || ''), String(password || ''), ip);
  if (r === 'ok') return Response.json({ ok: true });
  if (r === 'limited') return Response.json({ error: 'Too many tries. Wait a few minutes.' }, { status: 429 });
  return Response.json({ error: 'bad credentials' }, { status: 401 });
}
