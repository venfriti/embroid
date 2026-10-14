import { getCtx } from '@/lib/auth';
import { orders, naira } from '@/lib/q';
import { Link, h1, DueBadge, Pay, stripe } from '@/components/ui';

const VIEWS: [string, string][] = [['open', 'Open'], ['outstanding', 'Outstanding'], ['delivered', 'Delivered'], ['all', 'All']];
const STAGE_CHIPS = ['Confirmed', 'In production', 'Ready'];

export default async function All({ searchParams }: { searchParams: Promise<{ view?: string; stage?: string; q?: string; customer?: string }> }) {
  const { mode } = await getCtx(); const sp = await searchParams;
  const view = VIEWS.some(v => v[0] === sp.view) ? sp.view! : 'open'; const stage = sp.stage || ''; const q = (sp.q || '').trim().toLowerCase();
  let list = await orders(mode);
  if (sp.customer) list = list.filter(o => o.customer_id === sp.customer);
  const open = list.filter(o => o.stage !== 'Collected' && o.stage !== 'Draft');
  list = view === 'open' ? open : view === 'outstanding' ? list.filter(o => o.balance > 0 && o.stage !== 'Draft') : view === 'delivered' ? list.filter(o => o.stage === 'Collected') : list;
  if (view === 'open' && stage) list = list.filter(o => o.stage === stage);
  if (q) list = list.filter(o => (o.name + ' ' + o.customer + ' ' + (o.invoice_no || '')).toLowerCase().includes(q));
  const href = (o: Record<string, string>) => { const p = new URLSearchParams({ ...(sp as any), ...o }); for (const [k, v] of [...p]) if (!v) p.delete(k); const s = p.toString(); return '/orders' + (s ? '?' + s : ''); };
  const sub = view === 'open' ? `${list.length} open ${list.length === 1 ? 'order' : 'orders'}, soonest due first` : `${list.length} ${list.length === 1 ? 'order' : 'orders'}`;
  return (
    <main className="page" style={{ padding: '24px 32px 48px', gap: 20 }}>
      <section style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h1 style={{ ...h1, fontSize: 30 }}>Orders</h1>
          <span style={{ fontSize: 15, color: '#4B5563' }}>{sub}</span>
        </div>
        <Link href="/" style={{ minHeight: 48, padding: '0 20px', display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 600, color: '#FFFFFF', background: '#0E5C63', borderRadius: 12, textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>New order
        </Link>
      </section>

      <section style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px 20px' }}>
        <form action="/orders" style={{ flex: '1 1 320px', maxWidth: 420, position: 'relative' }}>
          {view !== 'open' && <input type="hidden" name="view" value={view} />}{sp.customer && <input type="hidden" name="customer" value={sp.customer} />}{stage && <input type="hidden" name="stage" value={stage} />}
          <label htmlFor="order-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Search orders</label>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3F4A58" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ position: 'absolute', left: 16, top: 16 }}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
          <input id="order-search" name="q" defaultValue={sp.q || ''} type="search" placeholder="Search order or customer" style={{ width: '100%', boxSizing: 'border-box', height: 52, padding: '0 16px 0 46px', fontSize: 16, color: '#1B2430', background: '#FFFFFF', border: '1px solid #C5CCD5', borderRadius: 12 }} />
        </form>
        <div role="group" aria-label="Show orders" style={{ display: 'inline-flex', gap: 4, padding: 4, background: '#E6EAEE', borderRadius: 12 }}>
          {VIEWS.map(([k, t]) => { const on = view === k; return <Link key={k} href={href({ view: k === 'open' ? '' : k, stage: '' })} aria-pressed={on} style={{ minHeight: 44, padding: '0 20px', display: 'inline-flex', alignItems: 'center', fontSize: 15, fontWeight: on ? 700 : 500, color: on ? '#0E5C63' : '#3F4A58', background: on ? '#FFFFFF' : 'transparent', borderRadius: 9, textDecoration: 'none' }}>{t}</Link>; })}
        </div>
      </section>

      {view === 'open' && (
        <section aria-label="Stage" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px', marginTop: -8 }}>
          <span style={{ fontSize: 14, color: '#4B5563', marginRight: 4 }}>Stage</span>
          {['', ...STAGE_CHIPS].map(s => { const on = stage === s; return (
            <Link key={s} href={href({ stage: s })} aria-pressed={on} style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', minHeight: 34, padding: '0 14px', fontSize: 14, fontWeight: on ? 600 : 500, color: on ? '#0A4449' : '#3F4A58', background: on ? '#DCEBED' : '#FFFFFF', border: `1px solid ${on ? '#0E5C63' : '#C5CCD5'}`, borderRadius: 999 }}>{s || 'All stages'}</span>
            </Link>); })}
        </section>
      )}

      <section aria-label="Orders" style={{ background: '#FFFFFF', border: '1px solid #DDE2E8', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {list.length === 0 && <div style={{ padding: 20, color: '#4B5563' }}>No orders here.</div>}
        {list.map((o, i) => (
          <Link key={o.id} href={`/orders/${o.id}`} style={{ width: '100%', minHeight: 68, boxSizing: 'border-box', padding: '10px 20px 10px 18px', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', textDecoration: 'none', background: '#FFFFFF', borderLeft: `6px solid ${o.stage === 'Draft' ? '#C5CCD5' : stripe(o)}`, borderBottom: i === list.length - 1 ? 0 : '1px solid #E8ECF0', color: '#1B2430' }}>
            <span style={{ flex: '1 1 200px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>{o.name}</span>
              <span style={{ fontSize: 14, color: '#4B5563' }}>{o.customer}{view === 'all' || view === 'delivered' || stage ? ` · ${o.stage}` : ''}{o.invoice_no && view !== 'open' ? ` · ${o.invoice_no}` : ''}</span>
            </span>
            <span style={{ flex: '0 0 auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              {o.stage === 'Collected' || o.stage === 'Draft' ? null : <DueBadge due={o.due} />}
              {o.stage === 'Draft' ? <span style={{ fontSize: 12, fontWeight: 600, color: '#5A3A00', background: '#FDE9B0', padding: '2px 8px', borderRadius: 999 }}>Draft</span> : <Pay o={o} />}
            </span>
            <span style={{ flex: '0 0 110px', textAlign: 'right', fontWeight: 600, fontSize: 16 }}>{naira(o.total)}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7684" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: '0 0 auto' }}><path d="M9 6l6 6-6 6" /></svg>
          </Link>
        ))}
      </section>
    </main>
  );
}
