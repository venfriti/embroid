import { getCtx } from '@/lib/auth';
import { orders } from '@/lib/q';
import { Link, DueBadge } from '@/components/ui';
import { ExcelBtn, PrintBtn, ReportHead } from '@/components/ReportBits';

export default async function Workload() {
  const { mode } = await getCtx(); const open = (await orders(mode)).filter(o => o.stage !== 'Collected' && o.stage !== 'Draft');
  const stages = ['Confirmed', 'In production', 'Ready'];
  return (
    <main className="page" style={{ padding: '24px 32px 48px', gap: 14 }}>
      <ReportHead title="Production workload" sub={`${open.length} open orders, by stage, soonest due first`}>
        <ExcelBtn name="production-workload" rows={[['Stage', 'Order', 'Customer', 'Due', 'Pieces'], ...stages.flatMap(s => open.filter(o => o.stage === s).map(o => [s, o.name, o.customer, o.due || '', o.pieces]))]} /><PrintBtn />
      </ReportHead>
      {stages.map(s => { const list = open.filter(o => o.stage === s); return (
        <div key={s} style={{ background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', fontWeight: 700, fontSize: 16, background: '#EEF1F4', borderBottom: '1px solid #E8ECF0', display: 'flex', justifyContent: 'space-between' }}><span>{s}</span><span style={{ fontWeight: 500, color: '#4B5563' }}>{list.length} {list.length === 1 ? 'order' : 'orders'} · {list.reduce((t, o) => t + o.pieces, 0)} pieces</span></div>
          {list.length === 0 && <div style={{ padding: '14px 20px', color: '#4B5563' }}>Nothing here.</div>}
          {list.map(o => <Link key={o.id} href={`/orders/${o.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 60, padding: '8px 20px', textDecoration: 'none', color: '#1B2430', borderBottom: '1px solid #E8ECF0' }}><span style={{ flex: 1 }}><b style={{ fontWeight: 600 }}>{o.name}</b><div style={{ fontSize: 14, color: '#4B5563' }}>{o.customer} · {o.pieces} pieces</div></span><DueBadge due={o.due} /></Link>)}
        </div>); })}
    </main>
  );
}
