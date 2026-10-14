import { getCtx } from '@/lib/auth';
import { customers, orders, kindName } from '@/lib/q';
import { Link, h1, h2, eyebrow, lede, btnSm, Pill, Chev, Initial, DueBadge, ago, day } from '@/components/ui';

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { mode } = await getCtx(); const q = ((await searchParams).q || '').trim();
  const list = await customers(mode, q);
  const all = await orders(mode);
  const open = (id: string) => all.filter(o => o.customer_id === id && o.stage !== 'Collected' && o.stage !== 'Draft');
  const drafts = all.filter(o => o.stage === 'Draft').sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
  const recent = list.map(c => {
    const os = open(c.id); const due = os.map(o => o.due).filter(Boolean).sort()[0] as string | undefined;
    const last = all.filter(o => o.customer_id === c.id).map(o => o.placed || '').sort().pop();
    return { c, n: os.length, due, last };
  }).sort((a, b) => (b.n ? 1 : 0) - (a.n ? 1 : 0) || (a.due || 'z').localeCompare(b.due || 'z'));
  const rowStyle = (last: boolean) => ({ width: '100%', boxSizing: 'border-box' as const, minHeight: 68, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' as const, textDecoration: 'none', background: '#FFFFFF', borderBottom: last ? 0 : '1px solid #E8ECF0', color: '#1B2430' });
  return (
    <main className="page" style={{ padding: '56px 32px 64px', gap: 40 }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={eyebrow}>New sale</span>
          <h1 style={h1}>Who is the customer?</h1>
          <p style={lede}>Find a school or person to see their past orders and saved designs, or add someone new.</p>
        </div>
        <form action="/" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: '1 1 480px', minWidth: 0, position: 'relative' }}>
            <label htmlFor="customer-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Search customers</label>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3F4A58" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ position: 'absolute', left: 20, top: 20 }}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
            <input id="customer-search" name="q" defaultValue={q} type="search" placeholder="Search school or customer name" style={{ width: '100%', boxSizing: 'border-box', height: 64, padding: '0 20px 0 56px', fontSize: 20, color: '#1B2430', background: '#FFFFFF', border: '2px solid #0E5C63', borderRadius: 14 }} />
          </div>
          <Link href="/customers/new" style={{ flex: '0 0 auto', height: 64, padding: '0 28px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 600, color: '#FFFFFF', background: '#0E5C63', border: 0, borderRadius: 14, textDecoration: 'none', boxSizing: 'border-box' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            New customer
          </Link>
        </form>
        <p style={{ margin: 0, fontSize: 14, color: '#4B5563' }}>Partial names work. Typing &quot;green pri&quot; finds Greenfield Primary School, and similar names are flagged before a duplicate is created.</p>
      </section>

      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
        {!q && <div style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 style={h2}>Unfinished drafts</h2>
          {drafts.length === 0 && <p style={{ margin: 0, color: '#4B5563' }}>No unfinished drafts.</p>}
          {drafts.map(o => (
            <div key={o.id} style={{ background: '#FFFFFF', border: '1px solid #DDE2E8', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><span style={{ fontWeight: 600, fontSize: 16 }}>{o.customer}</span><Pill>Draft</Pill></div>
                <span style={{ fontSize: 14, color: '#4B5563' }}>{o.line_count} {o.line_count === 1 ? 'line' : 'lines'}{o.updated ? ` · edited ${ago(o.updated)}` : ''}</span>
                {o.due && <span style={{ fontSize: 14, fontWeight: 600, color: '#1B2430' }}>Due {day(o.due)}</span>}
              </div>
              <Link href={`/orders/${o.id}`} style={btnSm}>Resume</Link>
            </div>
          ))}
        </div>}
        <div style={{ flex: '1.4 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 style={h2}>{q ? `Customers matching “${q}”` : 'Recent customers'}</h2>
          <div style={{ background: '#FFFFFF', border: '1px solid #DDE2E8', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {recent.length === 0 && <div style={{ padding: '18px', color: '#4B5563' }}>Nobody matches. <Link href="/customers/new">Add them as a new customer</Link></div>}
            {recent.map(({ c, n, due, last }, i) => (
              <Link key={c.id} href={`/customers/${c.id}`} style={rowStyle(i === recent.length - 1)}>
                <Initial name={c.name} kind={c.kind} />
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontWeight: 600, fontSize: 16 }}>{c.name}</span>
                  <span style={{ fontSize: 14, color: '#4B5563' }}>{kindName(c.kind)} · {n ? `${n} open ${n === 1 ? 'order' : 'orders'}` : last ? `last order ${`${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+last.slice(5,7)-1]} ${last.slice(0,4)}`}` : 'no orders yet'}</span>
                </span>
                {n > 0 && <DueBadge due={due} />}
                <Chev />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
