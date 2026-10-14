'use client';
/** POST/PATCH helper. A 403 with {demo:true} shows the "demo, not saved" message instead of an error. */
export async function send(url: string, body: any, method = 'POST') {
  const r = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const j: any = await r.json().catch(() => ({}));
  if (r.status === 403 && j.demo) { window.dispatchEvent(new CustomEvent('demo-blocked', { detail: j.error })); return { ok: false, demo: true, ...j }; }
  if (!r.ok) { window.dispatchEvent(new CustomEvent('app-error', { detail: j.error || 'Something went wrong' })); return { ok: false, ...j }; }
  return { ok: true, ...j };
}
