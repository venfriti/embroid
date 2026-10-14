import { getCloudflareContext } from '@opennextjs/cloudflare';

export type Mode = 'demo' | 'live';
export type Stmt = [string, any[]?];

export async function cfEnv(): Promise<any> { return (await getCloudflareContext({ async: true })).env; }
async function d1(mode: Mode): Promise<D1Database> { const e = await cfEnv(); return mode === 'demo' ? e.DEMO_DB : e.LIVE_DB; }

export async function all<T = any>(mode: Mode, sql: string, args: any[] = []): Promise<T[]> {
  return ((await (await d1(mode)).prepare(sql).bind(...args).all()).results || []) as T[];
}
export async function first<T = any>(mode: Mode, sql: string, args: any[] = []): Promise<T | null> {
  return ((await (await d1(mode)).prepare(sql).bind(...args).first()) as T) || null;
}
/** Writes only ever reach the live database. Asking to write to the demo throws, on top of the API check. */
export async function run(mode: Mode, sql: string, args: any[] = []) {
  if (mode !== 'live') throw new Error('The demo database is read-only');
  return (await d1('live')).prepare(sql).bind(...args).run();
}
/** Several statements that succeed or fail together. */
export async function batch(mode: Mode, stmts: Stmt[]) {
  if (mode !== 'live') throw new Error('The demo database is read-only');
  const db = await d1('live');
  return db.batch(stmts.map(([s, a]) => db.prepare(s).bind(...(a || []))));
}
