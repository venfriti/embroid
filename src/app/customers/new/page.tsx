import { getCtx } from '@/lib/auth';
import { all } from '@/lib/db';
import { NewCustomerForm } from '@/components/Forms';
import { Link, h1 } from '@/components/ui';

export default async function New() {
  const { mode } = await getCtx();
  const existing = await all<any>(mode, "SELECT c.id, c.name, c.short_name, c.phone, c.address, (SELECT COUNT(*) FROM orders o WHERE o.customer_id=c.id) orders FROM customers c ORDER BY c.name");
  return (
    <main className="page" style={{ maxWidth: 'none', padding: '20px 32px 48px', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>Back to customers
        </Link>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <h1 style={h1}>New customer</h1><span style={{ fontSize: 15, color: '#4B5563' }}>Only the name is required.</span>
        </div>
      </div>
      <NewCustomerForm existing={existing} />
    </main>
  );
}
