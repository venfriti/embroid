import './globals.css';
import Link from 'next/link';
import { getCtx } from '@/lib/auth';
import { Nav, ProfileMenu, Toast } from '@/components/Chrome';

export const metadata = { title: 'Embroid', description: 'Orders, invoices and stock for an embroidery and uniform shop' };
export const dynamic = 'force-dynamic';

export default async function Root({ children }: { children: React.ReactNode }) {
  const ctx = await getCtx();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <header style={{ background: '#fff', borderBottom: '1px solid #DDE2E8', padding: '0 32px', minHeight: 64, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#1B2430' }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: '#0E5C63', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 8h3M10 8h4M17 8h3M4 16h3M10 16h4M17 16h3" /><path d="M12 3v18" strokeDasharray="2 3" /></svg>
              </span>
              <span style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: '-0.01em' }}>[Shop name]</span>
            </Link>
            <Nav />
          </div>
          <ProfileMenu user={ctx.user} demo={ctx.mode === 'demo'} />
        </header>
        {children}
        <Toast />
      </body>
    </html>
  );
}
