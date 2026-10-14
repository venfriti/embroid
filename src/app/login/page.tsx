'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const r = useRouter();
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr('');
    const f = new FormData(e.currentTarget);
    const res = await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: f.get('email'), password: f.get('password') }) });
    setBusy(false);
    if (res.ok) { r.push('/'); r.refresh(); } else setErr('That email and password do not match.');
  }
  return (
    <main className="page" style={{ maxWidth: 480 }}>
      <h1>Sign in</h1>
      <p className="mut" style={{ margin: 0 }}>Signing in switches from the sample data to your shop's own records. Accounts are created by the shop owner.</p>
      <form className="card pad" onSubmit={go} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label className="f">Email<input className="i" name="email" type="email" required autoComplete="username" /></label>
        <label className="f">Password<input className="i" name="password" type="password" required autoComplete="current-password" /></label>
        {err && <div role="alert" className="chip red" style={{ padding: '10px 12px', fontSize: 14 }}>{err}</div>}
        <button className="btn pri" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <Link href="/">Keep looking at the demo</Link>
    </main>
  );
}
