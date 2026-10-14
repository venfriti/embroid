import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { batch, cfEnv, first, run } from './db';

export type Ctx = { mode: 'demo' | 'live'; user: { id: number; email: string; name: string } | null };

const enc = new TextEncoder();
async function secret() {
  const e = await cfEnv();
  if (!e.AUTH_SECRET) throw new Error('Set the AUTH_SECRET secret before hosting');
  return enc.encode(e.AUTH_SECRET);
}
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const unhex = (s: string) => new Uint8Array(s.match(/../g)!.map(h => parseInt(h, 16)));
// PBKDF2 through the platform's native crypto, so it is fast enough for Workers. 100k is the platform maximum.
async function derive(pw: string, salt: Uint8Array) {
  const k = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: 100000 }, k, 256));
}
export async function hashPassword(pw: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${hex(salt.buffer)}$${await derive(pw, salt)}`;
}
async function check(pw: string, stored: string) {
  const [, s, h] = stored.split('$'); const got = await derive(pw, unhex(s));
  let d = 0; for (let i = 0; i < h.length; i++) d |= h.charCodeAt(i) ^ got.charCodeAt(i); return d === 0 && h.length === got.length;
}

/** The first owner login comes from the ADMIN_* secrets when the live database has no users yet. */
async function ensureAdmin() {
  const e = await cfEnv();
  const n = (await first<{ c: number }>('live', 'SELECT COUNT(*) c FROM users'))!.c;
  if (n === 0 && e.ADMIN_EMAIL && e.ADMIN_PASSWORD) {
    await run('live', 'INSERT INTO users(email,name,password_hash) VALUES(?,?,?)', [String(e.ADMIN_EMAIL).toLowerCase(), e.ADMIN_NAME || 'Owner', await hashPassword(e.ADMIN_PASSWORD)]);
  }
}

export async function getCtx(): Promise<Ctx> {
  const tok = (await cookies()).get('session')?.value;
  if (tok) {
    try {
      const { payload } = await jwtVerify(tok, await secret());
      const u = await first<any>('live', 'SELECT id,email,name FROM users WHERE id=?', [payload.uid as number]);
      if (u) return { mode: 'live', user: u };
    } catch {}
  }
  return { mode: 'demo', user: null };
}

export async function login(email: string, password: string, ip: string): Promise<'ok' | 'bad' | 'limited'> {
  const now = Date.now();
  // Reserve one of the eight attempts atomically before doing the expensive password check.
  // D1 batches serialize this count-and-insert against concurrent requests.
  const token = crypto.randomUUID();
  const results = await batch('live', [
    ['DELETE FROM login_attempts WHERE at < ?', [now - 600000]],
    ['INSERT INTO login_attempts(ip,at,token) SELECT ?,?,? WHERE (SELECT COUNT(*) FROM login_attempts WHERE ip=?) < 8', [ip, now, token, ip]],
    ['SELECT token FROM login_attempts WHERE token=?', [token]],
  ]) as any[];
  if (!results[2]?.results?.length) return 'limited';
  await ensureAdmin();
  const u = await first<any>('live', 'SELECT * FROM users WHERE email=?', [email.trim().toLowerCase()]);
  if (!u || !(await check(password, u.password_hash))) return 'bad';
  await run('live', 'DELETE FROM login_attempts WHERE ip=?', [ip]);
  const tok = await new SignJWT({ uid: u.id }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('14d').sign(await secret());
  (await cookies()).set('session', tok, { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 14 * 86400 });
  return 'ok';
}
export async function logout() { (await cookies()).delete('session'); }

/** Every write goes through this. Visitors without a login get a 403 and nothing is saved. */
export async function requireLive(): Promise<{ ctx: Ctx } | { res: Response }> {
  const ctx = await getCtx();
  if (ctx.mode !== 'live') return { res: Response.json({ demo: true, error: "This is the demo. Changes aren't saved. Sign in to save." }, { status: 403 }) };
  return { ctx };
}
