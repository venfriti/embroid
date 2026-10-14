import { getCtx } from '@/lib/auth';
import { stock } from '@/lib/q';
import { Link, h1, Chev } from '@/components/ui';

export default async function Stock({ searchParams }: { searchParams: Promise<{ q?: string; view?: string; type?: string }> }) {
  const { mode } = await getCtx(); const sp = await searchParams; const q = (sp.q || '').trim().toLowerCase(); const view = sp.view === 'needs' ? 'needs' : 'all'; const type = sp.type || '';
  const every = await stock(mode);
  const isBad = (i: any) => i.available < 0, isLow = (i: any) => !isBad(i) && i.warn_below != null && i.available <= i.warn_below;
  const short = every.filter(isBad).length, low = every.filter(isLow).length;
  const types = Array.from(new Set(every.map(i => i.type).filter(Boolean))) as string[];
  let items = every;
  if (view === 'needs') items = items.filter(i => isBad(i) || isLow(i));
  if (type) items = items.filter(i => i.type === type);
  if (q) items = items.filter(i => i.name.toLowerCase().includes(q));
  const href = (o: Record<string, string>) => { const p = new URLSearchParams({ ...(sp as any), ...o }); for (const [k, v] of [...p]) if (!v) p.delete(k); const s = p.toString(); return '/stock' + (s ? '?' + s : ''); };
  return (
    <main className="page" style={{ padding: '24px 32px 48px', gap: 20 }}>
      <section style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h1 style={{ ...h1, fontSize: 30 }}>Stock</h1>
          <span style={{ fontSize: 15, color: '#4B5563' }}>{short} {short === 1 ? 'item' : 'items'} short for open orders · {low} running low</span>
        </div>
        <Link href="/stock/add" style={{ minHeight: 48, padding: '0 20px', display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 600, color: '#FFFFFF', background: '#0E5C63', borderRadius: 12, textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>Add stock
        </Link>
      </section>
      <section style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px 20px' }}>
        <form action="/stock" style={{ flex: '1 1 320px', maxWidth: 420, position: 'relative' }}>
          {view === 'needs' && <input type="hidden" name="view" value="needs" />}{type && <input type="hidden" name="type" value={type} />}
          <label htmlFor="stock-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Search stock</label>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3F4A58" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ position: 'absolute', left: 16, top: 16 }}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
          <input id="stock-search" name="q" defaultValue={sp.q || ''} type="search" placeholder="Search stock" style={{ width: '100%', boxSizing: 'border-box', height: 52, padding: '0 16px 0 46px', fontSize: 16, color: '#1B2430', background: '#FFFFFF', border: '1px solid #C5CCD5', borderRadius: 12 }} />
        </form>
        <div role="group" aria-label="Show" style={{ display: 'inline-flex', gap: 4, padding: 4, background: '#E6EAEE', borderRadius: 12 }}>
          {[['all', 'All items'], ['needs', 'Needs ordering']].map(([k, t]) => { const on = view === k; return <Link key={k} href={href({ view: k === 'all' ? '' : k })} aria-pressed={on} style={{ minHeight: 44, padding: '0 20px', display: 'inline-flex', alignItems: 'center', fontSize: 15, fontWeight: on ? 700 : 500, color: on ? '#0E5C63' : '#3F4A58', background: on ? '#FFFFFF' : 'transparent', borderRadius: 9, textDecoration: 'none' }}>{t}</Link>; })}
        </div>
      </section>
      <section aria-label="Type" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px', marginTop: -8 }}>
        <span style={{ fontSize: 14, color: '#4B5563', marginRight: 4 }}>Type</span>
        {['', ...types].map(t => { const on = type === t; return (
          <Link key={t} href={href({ type: t })} aria-pressed={on} style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', minHeight: 34, padding: '0 14px', fontSize: 14, fontWeight: on ? 600 : 500, color: on ? '#0A4449' : '#3F4A58', background: on ? '#DCEBED' : '#FFFFFF', border: `1px solid ${on ? '#0E5C63' : '#C5CCD5'}`, borderRadius: 999 }}>{t || 'All types'}</span>
          </Link>); })}
      </section>
      <section style={{ background: '#FFFFFF', border: '1px solid #DDE2E8', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 20px 10px 24px', fontSize: 13, color: '#4B5563', borderBottom: '1px solid #E8ECF0' }}>
          <span style={{ flex: 1 }}>Item</span><span style={{ flex: '0 0 130px' }} /><span style={{ flex: '0 0 70px', textAlign: 'right' }}>On hand</span><span style={{ flex: '0 0 80px', textAlign: 'right' }}>Reserved</span><span style={{ flex: '0 0 90px', textAlign: 'right' }}>Available</span><span style={{ flex: '0 0 20px' }} />
        </div>
        {items.length === 0 && <div style={{ padding: 20, color: '#4B5563' }}>{every.length === 0 ? <>No stock items yet. <Link href="/stock/add">Add the first one</Link></> : 'Nothing matches.'}</div>}
        {items.map((i, k) => { const bad = isBad(i), lo = isLow(i); return (
          <Link key={i.id} href={`/stock/${i.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 68, padding: '8px 20px 8px 18px', textDecoration: 'none', color: '#1B2430', borderLeft: `6px solid ${bad ? '#C0392B' : lo ? '#B77900' : '#D5DBE2'}`, borderBottom: k === items.length - 1 ? 0 : '1px solid #E8ECF0' }}>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}><span style={{ fontWeight: 600, fontSize: 17 }}>{i.name}</span><span style={{ fontSize: 14, color: '#4B5563' }}>{i.type} · {i.unit}</span></span>
            <span style={{ flex: '0 0 130px' }}>
              {bad && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#8A1C13', background: '#FDECEA', border: '1px solid #E8A29B', padding: '3px 10px', borderRadius: 999 }}>Short by {-i.available}</span>}
              {lo && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#5A3A00', background: '#FDE9B0', padding: '3px 10px', borderRadius: 999 }}>Running low</span>}
            </span>
            <span style={{ flex: '0 0 70px', textAlign: 'right', fontSize: 17 }}>{i.on_hand}</span><span style={{ flex: '0 0 80px', textAlign: 'right', fontSize: 17 }}>{i.reserved}</span>
            <span style={{ flex: '0 0 90px', textAlign: 'right', fontSize: 18, fontWeight: 700, color: bad ? '#8A1C13' : lo ? '#5A3A00' : '#1B2430' }}>{bad ? `−${-i.available}` : i.available}</span>
            <Chev />
          </Link>); })}
      </section>
    </main>
  );
}
