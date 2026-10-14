import { getCtx } from '@/lib/auth';
import { orders, naira } from '@/lib/q';
import { Link } from '@/components/ui';
import { ExcelBtn, PrintBtn, ReportHead } from '@/components/ReportBits';

export default async function Sales() {
  const { mode } = await getCtx(); const os = (await orders(mode)).filter(o => o.stage !== 'Draft');
  const by: Record<string, any> = {}; for (const o of os) { const b = (by[o.customer_id] ||= { id: o.customer_id, name: o.customer, n: 0, total: 0, paid: 0 }); b.n++; b.total += o.total; b.paid += o.paid; }
  const rows = Object.values(by).sort((a: any, b: any) => b.total - a.total); const sum = rows.reduce((s: number, r: any) => s + r.total, 0);
  return (
    <main className="page" style={{ padding: '24px 32px 48px', gap: 14 }}>
      <ReportHead title="Sales" sub="Everything confirmed, by customer">
        <ExcelBtn name="sales" rows={[['Customer', 'Orders', 'Sales', 'Paid'], ...rows.map((r: any) => [r.name, r.n, r.total, r.paid])]} /><PrintBtn />
      </ReportHead>
      <div style={{ background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 14, padding: '10px 20px', fontSize: 13, color: '#4B5563', borderBottom: '1px solid #E8ECF0' }}><span style={{ flex: 1 }}>Customer</span><span style={{ flex: '0 0 90px', textAlign: 'right' }}>Orders</span><span style={{ flex: '0 0 150px', textAlign: 'right' }}>Paid</span><span style={{ flex: '0 0 150px', textAlign: 'right' }}>Sales</span></div>
        {rows.map((r: any) => <Link key={r.id} href={`/customers/${r.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 56, padding: '8px 20px', textDecoration: 'none', color: '#1B2430', borderBottom: '1px solid #E8ECF0' }}><span style={{ flex: 1, fontWeight: 600 }}>{r.name}</span><span style={{ flex: '0 0 90px', textAlign: 'right' }}>{r.n}</span><span style={{ flex: '0 0 150px', textAlign: 'right' }}>{naira(r.paid)}</span><span style={{ flex: '0 0 150px', textAlign: 'right', fontWeight: 700 }}>{naira(r.total)}</span></Link>)}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: '#F4F6F8' }}><span style={{ color: '#3F4A58' }}>Total across {rows.length} customers</span><b style={{ fontSize: 22 }}>{naira(sum)}</b></div>
      </div>
    </main>
  );
}
