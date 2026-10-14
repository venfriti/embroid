import { getCtx } from '@/lib/auth';
import { stock } from '@/lib/q';
import { Link } from '@/components/ui';
import { ExcelBtn, PrintBtn, ReportHead } from '@/components/ReportBits';

export default async function Buy() {
  const { mode } = await getCtx(); const items = (await stock(mode)).filter(i => i.available < 0 || (i.warn_below != null && i.available <= i.warn_below));
  const by: Record<string, any[]> = {}; for (const i of items) (by[i.supplier || 'No supplier set'] ||= []).push(i);
  const need = (i: any) => i.available < 0 ? -i.available : Math.max(0, (i.warn_below ?? 0) - i.available);
  return (
    <main className="page" style={{ padding: '24px 32px 48px', gap: 14 }}>
      <ReportHead title="What to buy" sub="Short and low items for open orders, grouped by supplier">
        <ExcelBtn name="what-to-buy" rows={[['Supplier', 'Item', 'Unit', 'Available', 'Reserved', 'Short by / top up'], ...items.map(i => [i.supplier || '', i.name, i.unit, i.available, i.reserved, need(i)])]} /><PrintBtn />
      </ReportHead>
      {items.length === 0 && <div style={{ background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, padding: 20, color: '#4B5563' }}>Nothing to buy right now.</div>}
      {Object.entries(by).map(([sup, list]) => (
        <div key={sup} style={{ background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', fontWeight: 700, fontSize: 16, background: '#EEF1F4', borderBottom: '1px solid #E8ECF0' }}>{sup}</div>
          {list.map(i => <Link key={i.id} href={`/stock/${i.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 60, padding: '8px 20px', textDecoration: 'none', color: '#1B2430', borderLeft: `6px solid ${i.available < 0 ? '#C0392B' : '#B77900'}`, borderBottom: '1px solid #E8ECF0' }}>
            <span style={{ flex: 1 }}><b style={{ fontWeight: 600 }}>{i.name}</b><div style={{ fontSize: 14, color: '#4B5563' }}>{i.available} {i.unit} free after {i.reserved} reserved</div></span>
            <span style={{ fontWeight: 700, color: i.available < 0 ? '#8A1C13' : '#5A3A00' }}>{i.available < 0 ? `Short by ${need(i)} ${i.unit}` : `Running low`}</span>
          </Link>)}
        </div>
      ))}
    </main>
  );
}
