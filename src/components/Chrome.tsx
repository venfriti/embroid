'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export function Nav() {
  const p = usePathname();
  const items = [['Customers', '/', (x: string) => x === '/' || x.startsWith('/customers')], ['Orders', '/orders', (x: string) => x.startsWith('/orders')], ['Stock', '/stock', (x: string) => x.startsWith('/stock')], ['Reports', '/reports', (x: string) => x.startsWith('/reports')], ['Setup', '/setup', (x: string) => x.startsWith('/setup')]] as any[];
  return (
    <nav aria-label="Main" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {items.map(([n, h, f]) => { const on = f(p); return <Link key={n} href={h} aria-current={on ? 'page' : undefined} style={{ padding: '22px 14px 19px', fontWeight: on ? 600 : 500, fontSize: 15, color: on ? '#0E5C63' : '#3F4A58', textDecoration: 'none', borderBottom: `3px solid ${on ? '#0E5C63' : 'transparent'}` }}>{n}</Link>; })}
    </nav>
  );
}

/** Corner of the header: "Front desk" and the round avatar. Demo visitors get a small "Demo" chip and a sign-in menu. */
export function ProfileMenu({ user, demo }: { user: { name: string; email: string } | null; demo: boolean }) {
  const [open, setOpen] = useState(false);
  const r = useRouter();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
      {demo && <Link href="/login" title="Sample data. Changes are not saved. Sign in to use your own." style={{ fontSize: 12, fontWeight: 600, color: '#5A3A00', background: '#FDE9B0', padding: '3px 10px', borderRadius: 999, textDecoration: 'none' }}>Demo · changes not saved</Link>}
      <span style={{ fontSize: 14, color: '#3F4A58' }}>{user ? user.name : 'Front desk'}</span>
      <button aria-haspopup="menu" aria-expanded={open} aria-label="Profile menu" onClick={() => setOpen(!open)} style={{ width: 36, height: 36, borderRadius: '50%', background: '#E3EEF0', color: '#0E5C63', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, border: 0, padding: 0 }}>{(user?.name || 'A')[0].toUpperCase()}</button>
      {open && (
        <div className="menu" role="menu" style={{ top: 44 }}>
          {user ? (<>
            <div className="small mut" style={{ padding: '8px 14px' }}>Signed in as<br /><b style={{ color: 'var(--ink)' }}>{user.email}</b></div>
            <button role="menuitem" onClick={async () => { await fetch('/api/logout', { method: 'POST' }); setOpen(false); r.push('/'); r.refresh(); }}>Sign out</button>
          </>) : (<>
            <div className="small mut" style={{ padding: '8px 14px' }}>You are looking at sample data. Nothing you change is saved.</div>
            <Link role="menuitem" href="/login" onClick={() => setOpen(false)}>Sign in to use your own data</Link>
          </>)}
        </div>
      )}
    </div>
  );
}

export function Toast() {
  const [t, setT] = useState<{ msg: string; demo: boolean } | null>(null);
  useEffect(() => {
    const a = (e: any) => { setT({ msg: e.detail, demo: true }); setTimeout(() => setT(null), 6000); };
    const b = (e: any) => { setT({ msg: e.detail, demo: false }); setTimeout(() => setT(null), 5000); };
    window.addEventListener('demo-blocked', a); window.addEventListener('app-error', b);
    return () => { window.removeEventListener('demo-blocked', a); window.removeEventListener('app-error', b); };
  }, []);
  if (!t) return null;
  return <div className="toast" role="status">{t.msg}{t.demo && <Link href="/login">Sign in</Link>}</div>;
}
