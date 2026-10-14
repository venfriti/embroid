import { getCtx } from '@/lib/auth';
import { owed, orders, stock, naira } from '@/lib/q';
import { Link, h1, Chev, daysFrom } from '@/components/ui';

export default async function Reports() {
  const { mode } = await getCtx();
  const rows = (await owed(mode)) as any[]; const all = await orders(mode); const st = await stock(mode);
  const open = all.filter(o => o.stage !== 'Collected' && o.stage !== 'Draft');
  const overdueCust = rows.filter(r => r.oldest && daysFrom(r.oldest) < 0).length;
  const short = st.filter(i => i.available < 0).length, low = st.filter(i => i.available >= 0 && i.warn_below != null && i.available <= i.warn_below).length;
  const soon = open.filter(o => o.due && daysFrom(o.due) >= 0 && daysFrom(o.due) <= 3).length;
  const sales = all.filter(o => o.stage !== 'Draft').reduce((s, o) => s + o.total, 0);
  const R = [
    ['/reports/owed', '#C0392B', 'Money owed', 'Who owes what, oldest first, with last payment date', naira(rows.reduce((s, r) => s + r.owed, 0)), `${rows.length} ${rows.length === 1 ? 'customer' : 'customers'} · ${overdueCust} overdue`],
    ['/reports/buy', '#B77900', 'What to buy', 'Short and low items, grouped by supplier, for open orders', `${short + low} ${short + low === 1 ? 'item' : 'items'}`, `${short} short · ${low} running low`],
    ['/reports/workload', '#0E5C63', 'Production workload', 'What is due this week and next, by stage', `${open.length} open ${open.length === 1 ? 'order' : 'orders'}`, `${soon} due within 3 days`],
    ['/reports/sales', '#D5DBE2', 'Sales', 'Everything confirmed, by customer', naira(sales), 'in confirmed orders'],
  ];
  return (
    <main className="page" style={{ padding: '24px 32px 48px', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <h1 style={h1}>Reports</h1>
        <span style={{ fontSize: 15, color: '#4B5563' }}>Open one to print it, save it as a PDF, or export to Excel</span>
      </div>
      <div style={{ background: '#fff', border: '1px solid #DDE2E8', borderRadius: 10, overflow: 'hidden' }}>
        {R.map(([href, c, t, d, big, small], i) => (
          <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 76, padding: '10px 20px 10px 16px', textDecoration: 'none', color: '#1B2430', borderLeft: `3px solid ${c}`, borderBottom: i === R.length - 1 ? 0 : '1px solid #E8ECF0' }}>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontWeight: 600, fontSize: 15 }}>{t}</span><span style={{ fontSize: 13, color: '#3F4A58' }}>{d}</span></span>
            <span style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontWeight: 700, fontSize: 18 }}>{big}</span><span style={{ fontSize: 13, color: '#4B5563' }}>{small}</span></span>
            <Chev />
          </Link>
        ))}
      </div>
    </main>
  );
}
