import { notFound } from 'next/navigation';
import { getCtx } from '@/lib/auth';
import { customer, orders, lines, priceFor, garmentList, stock, naira, fmtDate } from '@/lib/q';
import { ReorderScreen } from '@/components/ReorderScreen';
import { Link, h1, Pay, daysFrom, day } from '@/components/ui';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export default async function Reorder({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string }> }) {
  const { mode } = await getCtx(); const { id } = await params; const c = await customer(mode, id); if (!c) notFound();
  const past = (await orders(mode, 'WHERE o.customer_id=?', [id])).filter(o => o.line_count > 0 && o.stage !== 'Draft').sort((a, b) => (b.placed || b.due || '').localeCompare(a.placed || a.due || ''));
  const sp = await searchParams; const from = past.find(o => o.id === sp.from) || [...past].sort((a, b) => b.line_count - a.line_count)[0];
  const gs = await garmentList(mode), st = await stock(mode);
  const ls = from ? await lines(mode, from.id) : [];
  const rows = await Promise.all(ls.map(async (l: any) => ({ id: l.id, item: l.item, detail: l.detail || '', qty: l.qty, old: l.unit_price, now: await priceFor(mode, id, l.item),
    needs: (gs.find(g => g.name === l.item)?.stock_per_piece || []).map(r => { const s = st.find(x => x.name === r.item); return { item: r.item, per: r.qty, unit: s?.unit || '', avail: s?.available ?? 0, warn: s?.warn_below ?? null }; }) })));
  const month = (d?: string | null) => d ? `${MON[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}` : '';
  const stagePill = (st: string) => <span style={{ fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 6, background: st === 'Collected' ? '#E6EAEE' : st === 'Ready' ? '#DCF1E3' : '#DCEBED', color: st === 'Collected' ? '#4B5563' : st === 'Ready' ? '#14532D' : '#0A4449' }}>{st === 'Collected' ? 'Delivered' : st}</span>;
  const suggested = from ? `Reorder of ${from.name}` : '';
  return (
    <main className="page" style={{ maxWidth: 'none', padding: '20px 32px 48px', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Link href={`/customers/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>{c.name}</Link>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}><h1 style={h1}>Reorder from a past order</h1><span style={{ fontSize: 15, color: '#4B5563' }}>Pick an order, untick what you don&apos;t need, change quantities. Prices are today&apos;s, not last time&apos;s.</span></div>
      </div>
      {!from ? <p style={{ color: '#4B5563' }}>No past orders to copy yet.</p> : (
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 290px', maxWidth: 320, background: '#fff', border: '1px solid #DDE2E8', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', alignItems: 'baseline' }}><b style={{ fontSize: 15 }}>Past orders</b><span style={{ color: '#4B5563' }}>{past.length} {past.length === 1 ? 'order' : 'orders'}</span></div>
            {past.map(o => { const on = o.id === from.id; return (
              <Link key={o.id} href={`/customers/${id}/reorder?from=${o.id}`} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 18px', textDecoration: 'none', color: '#1B2430', background: on ? '#E8EEF1' : '#fff', borderLeft: on ? '3px solid #0E5C63' : '3px solid transparent', borderTop: '1px solid #E8ECF0' }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><b style={{ fontSize: 15 }}>{o.name}</b><b>{naira(o.total)}</b></span>
                <span style={{ color: '#4B5563', fontSize: 15 }}>{o.stage === 'Collected' ? month(o.placed || o.due) : o.due ? `${daysFrom(o.due) < 0 ? 'Overdue' : 'Due'} ${day(o.due)}` : month(o.placed)} · {o.line_count} {o.line_count === 1 ? 'line' : 'lines'}</span>
                <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{stagePill(o.stage)}<Pay o={o} /></span>
              </Link>); })}
            <div style={{ padding: '12px 18px', fontSize: 14, color: '#4B5563', borderTop: '1px solid #E8ECF0' }}>Pick one order at a time.</div>
          </div>
          <ReorderScreen key={from.id} from={from.id} fromName={from.name} lines={rows} suggestedName={suggested} />
        </div>
      )}
    </main>
  );
}
