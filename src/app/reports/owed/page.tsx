import { getCtx } from '@/lib/auth';
import { owed, naira, kindName } from '@/lib/q';
import { all } from '@/lib/db';
import { Link, day, daysFrom } from '@/components/ui';
import { ExcelBtn, PrintBtn, ReportHead } from '@/components/ReportBits';

export default async function Owed() {
  const { mode } = await getCtx(); const rows = (await owed(mode)) as any[]; const total = rows.reduce((s, r) => s + r.owed, 0);
  const last = Object.fromEntries((await all<any>(mode, 'SELECT o.customer_id c, MAX(p.date) d FROM payments p JOIN orders o ON o.id=p.order_id GROUP BY o.customer_id')).map(r => [r.c, r.d]));
  const kinds = Object.fromEntries((await all<any>(mode, 'SELECT id, kind FROM customers')).map(r => [r.id, r.kind]));
  const short = (d?: string) => d ? day(d).split(' ').slice(1).join(' ') : 'No payment yet';
  const todayStr = day(new Date().toISOString().slice(0, 10));
  const od = (r: any) => r.oldest && daysFrom(r.oldest) < 0;
  const tone = (r: any) => od(r) ? '#C0392B' : '#B77900';
  return (
    <main className="page" style={{ padding: '24px 32px 48px', gap: 14 }}>
      <ReportHead title="Money owed" sub={`As of ${todayStr} · oldest due date first`}>
        <ExcelBtn name="money-owed" rows={[['Customer', 'Open orders', 'Oldest due', 'Last payment', 'Owed'], ...rows.map(r => [r.name, r.open, r.oldest || '', last[r.id] || '', r.owed])]} />
        <PrintBtn />
      </ReportHead>
      <div style={{ background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 14, padding: '10px 20px 10px 24px', fontSize: 13, color: '#4B5563', borderBottom: '1px solid #E8ECF0' }}>
          <span style={{ flex: 1 }}>Customer</span><span style={{ flex: '0 0 100px', textAlign: 'right' }}>Open orders</span><span style={{ flex: '0 0 190px', textAlign: 'right' }}>Oldest due</span><span style={{ flex: '0 0 160px', textAlign: 'right' }}>Last payment</span><span style={{ flex: '0 0 150px', textAlign: 'right' }}>Owed</span>
        </div>
        {rows.length === 0 && <div style={{ padding: 20, color: '#4B5563' }}>Nobody owes anything.</div>}
        {rows.map(r => (
          <Link key={r.id} href={`/customers/${r.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 68, padding: '8px 20px 8px 18px', textDecoration: 'none', color: '#1B2430', borderLeft: `6px solid ${tone(r)}`, borderBottom: '1px solid #E8ECF0' }}>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}><span style={{ fontWeight: 600, fontSize: 16 }}>{r.name}</span><span style={{ fontSize: 14, color: '#4B5563' }}>{kindName(kinds[r.id])}</span></span>
            <span style={{ flex: '0 0 100px', textAlign: 'right', fontSize: 17 }}>{r.open}</span>
            <span style={{ flex: '0 0 190px', textAlign: 'right', fontSize: 17, fontWeight: 600, color: od(r) ? '#8A1C13' : '#3F4A58' }}>{r.oldest ? (od(r) ? `Overdue ${day(r.oldest)}` : daysFrom(r.oldest) <= 3 ? `Due in ${daysFrom(r.oldest)} days` : `Due ${day(r.oldest)}`) : '—'}</span>
            <span style={{ flex: '0 0 160px', textAlign: 'right', fontSize: 17, color: '#3F4A58' }}>{short(last[r.id])}</span>
            <span style={{ flex: '0 0 150px', textAlign: 'right', fontSize: 18, fontWeight: 700 }}>{naira(r.owed)}</span>
          </Link>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 16px 24px', background: '#F4F6F8', color: '#3F4A58' }}><span>Total across {rows.length} {rows.length === 1 ? 'customer' : 'customers'}</span><span style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: 24, color: '#1B2430' }}>{naira(total)}</span></div>
      </div>
    </main>
  );
}
