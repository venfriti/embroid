import { notFound } from 'next/navigation';
import { getCtx } from '@/lib/auth';
import { stockItem, movements, garmentList, orders, lines, naira, fmtDate } from '@/lib/q';
import { Link, h1, day } from '@/components/ui';

const KINDS: Record<string, [string, string]> = { Delivered: ['#DCF1E3', '#14532D'], Counted: ['#FDE9B0', '#5A3A00'], Reserved: ['#FDE9B0', '#5A3A00'], Used: ['#E6EAEE', '#4B5563'] };
export default async function Item({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ k?: string }> }) {
  const { mode } = await getCtx(); const { id } = await params; const k = (await searchParams).k || 'all';
  const s = await stockItem(mode, id); if (!s) notFound();
  const all = await movements(mode, s.id);
  const ms = k === 'arrivals' ? all.filter(m => m.kind === 'Delivered') : k === 'used' ? all.filter(m => m.kind === 'Used') : k === 'reserved' ? all.filter(m => m.kind === 'Reserved') : all;
  const u = s.unit === 'metres' ? 'm' : s.unit === 'pieces' ? '' : s.unit; const q = (x: number) => `${x}${u ? ' ' + u : ''}`;
  // Orders whose garments take this item
  const gs = (await garmentList(mode)).filter(g => (g.stock_per_piece || []).some(r => r.item === s.name));
  const waiting: { id: string; name: string; customer: string; due: string | null; need: number }[] = [];
  if (gs.length) for (const o of (await orders(mode)).filter(o => ['Confirmed', 'In production'].includes(o.stage))) {
    let need = 0; for (const l of await lines(mode, o.id)) { const g = gs.find(x => x.name === l.item); if (g) need += l.qty * (g.stock_per_piece!.find(r => r.item === s.name)!.qty); }
    if (need > 0) waiting.push({ id: o.id, name: o.name, customer: o.customer, due: o.due, need: Math.round(need * 100) / 100 });
  }
  const bad = s.available < 0;
  const tile = (l: string, v: string, sub: string, red = false) => <div style={{ flex: '1 1 220px', boxSizing: 'border-box', background: red ? '#FFF4F2' : '#fff', border: `1px solid ${red ? '#F1D0CB' : '#DDE2E8'}`, borderRadius: 14, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontSize: 15, color: '#3F4A58' }}>{l}</span><span style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: 32, lineHeight: 1.1, color: red ? '#8A1C13' : '#1B2430' }}>{v}</span><span style={{ fontSize: 14, color: '#4B5563' }}>{sub}</span></div>;
  const lastCount = all.find(m => m.kind === 'Counted')?.date;
  const per = gs.map(g => `${g.stock_per_piece!.find(r => r.item === s.name)!.qty} ${u || ''} per ${g.name.toLowerCase()}`);
  const SEC = { fontSize: 13, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#4B5563' } as const;
  return (
    <main className="page" style={{ maxWidth: 'none', padding: '20px 32px 48px', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link href="/stock" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>Back to stock</Link>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}><h1 style={{ ...h1, fontSize: 30 }}>{s.name}</h1><span style={{ fontSize: 16, color: '#4B5563' }}>{[s.type, s.supplier].filter(Boolean).join(' · ')}</span></div>
        </div>
        <Link href="/stock/add" style={{ minHeight: 48, padding: '0 28px', display: 'inline-flex', alignItems: 'center', fontSize: 16, fontWeight: 600, color: '#fff', background: '#0E5C63', borderRadius: 12, textDecoration: 'none' }}>Add stock</Link>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {tile('On the shelf', q(s.on_hand), lastCount ? `Last counted ${day(lastCount).split(' ').slice(1).join(' ')}` : 'Not counted yet')}
        {tile('Reserved by orders', q(s.reserved), `${waiting.length} open ${waiting.length === 1 ? 'order' : 'orders'}`)}
        {tile('Available', `${bad ? '−' : ''}${q(Math.abs(s.available))}`, bad ? `Short by ${q(-s.available)}` : 'Free to use', bad)}
        {s.cost ? tile('Cost on hand', naira(s.on_hand * s.cost), `At ${naira(s.cost)} ${s.unit === 'metres' ? 'a metre' : 'each'}`) : null}
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 560px', minWidth: 0, background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: 22 }}>History</h2>
            <span style={{ display: 'flex', gap: 6 }}>{[['all', 'All'], ['arrivals', 'Arrivals'], ['used', 'Used'], ['reserved', 'Reserved']].map(([key, t]) => <Link key={key} href={`/stock/${s.id}${key === 'all' ? '' : '?k=' + key}`} style={{ fontSize: 13, fontWeight: 600, padding: '3px 12px', borderRadius: 999, textDecoration: 'none', background: k === key ? '#DCEBED' : '#E6EAEE', color: k === key ? '#0A4449' : '#4B5563' }}>{t}</Link>)}</span>
          </div>
          <div style={{ display: 'flex', gap: 14, padding: '8px 0', borderBottom: '2px solid #E1E6EB', fontSize: 13, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#4B5563' }}><span style={{ flex: '0 0 84px' }}>When</span><span style={{ flex: '0 0 110px' }}>What</span><span style={{ flex: 1 }}>Where from or what for</span><span style={{ flex: '0 0 90px', textAlign: 'right' }}>Change</span><span style={{ flex: '0 0 90px', textAlign: 'right' }}>On hand</span></div>
          {ms.length === 0 && <div style={{ padding: '16px 0', color: '#4B5563' }}>Nothing recorded yet.</div>}
          {ms.map(m => { const [bg, c] = KINDS[m.kind] || KINDS.Used; return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: '1px solid #E8ECF0' }}>
              <span style={{ flex: '0 0 84px', fontSize: 16, color: '#3F4A58' }}>{day(m.date).split(' ').slice(1).join(' ')}</span>
              <span style={{ flex: '0 0 110px' }}><span style={{ fontSize: 13, fontWeight: 600, color: c, background: bg, padding: '3px 12px', borderRadius: 999 }}>{m.kind}</span></span>
              <span style={{ flex: 1, fontSize: 15 }}>{m.reference}</span>
              <span style={{ flex: '0 0 90px', textAlign: 'right', fontWeight: 700, color: m.change > 0 ? '#14532D' : '#8A1C13' }}>{m.change > 0 ? '+' : '−'}{Math.abs(m.change)}{u ? ' ' + u : ''}</span>
              <span style={{ flex: '0 0 90px', textAlign: 'right' }}>{q(m.on_hand_after)}</span>
            </div>); })}
        </div>
        <div style={{ flex: '0 1 400px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {waiting.length > 0 && <div style={{ background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={SEC}>Orders waiting for this</div>
            {waiting.map(w => <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ flex: 1 }}><Link href={`/orders/${w.id}`} style={{ fontWeight: 600, fontSize: 16 }}>{w.name}</Link><div style={{ fontSize: 13, color: '#4B5563' }}>{w.customer}{w.due ? ` · due ${day(w.due)}` : ''}</div></span><b>{q(w.need)}</b></div>)}
          </div>}
          <div style={{ background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={SEC}>About this item</div>
            {[['Kind', `${s.type}, ${s.unit}`], ['Supplier', s.supplier], [s.unit === 'metres' ? 'Cost per metre' : 'Cost each', s.cost ? naira(s.cost) : null], ['Warn me below', s.warn_below != null ? q(s.warn_below) : null], ['Used per piece', per.join(', ') || null]].filter(r => r[1]).map(([l, v]) => <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 16 }}><span style={{ color: '#3F4A58' }}>{l}</span><b style={{ fontWeight: 600, textAlign: 'right' }}>{v}</b></div>)}
          </div>
          {bad && <div style={{ background: '#FBE0DC', color: '#8A1C13', borderRadius: 14, padding: '16px 20px', fontSize: 16, lineHeight: 1.4 }}><b>{q(-s.available)} short.</b> Add stock before cutting starts.</div>}
        </div>
      </div>
    </main>
  );
}
