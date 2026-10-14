'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { send } from '@/lib/client';
import { Silhouette } from './ui';

const n = (x: number) => '₦' + Math.round(x).toLocaleString('en-NG');
type Need = { item: string; per: number; unit: string; avail: number; warn: number | null };
export type RLine = { id: number; item: string; detail: string; qty: number; old: number; now: number | null; needs: Need[] };
const LBL = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 15, color: '#3F4A58' } as const;
const INP = { width: '100%', boxSizing: 'border-box', minHeight: 46, padding: '0 12px', fontSize: 16, color: '#1B2430', background: '#fff', border: '1px solid #C5CCD5', borderRadius: 10 } as const;
const pill = (bg: string, c: string, t: string, key?: string) => <span key={key} style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 600, color: c, background: bg, padding: '2px 10px', borderRadius: 999 }}>{t}</span>;

export function ReorderScreen({ from, fromName, lines, suggestedName }: { from: string; fromName: string; lines: RLine[]; suggestedName: string }) {
  const r = useRouter(); const [busy, setBusy] = useState(false);
  const [q, setQ] = useState<Record<number, number>>(Object.fromEntries(lines.map(l => [l.id, l.qty])));
  const [on, setOn] = useState<Record<number, boolean>>(Object.fromEntries(lines.map(l => [l.id, true])));
  const [all, setAll] = useState(false); const [name, setName] = useState(suggestedName); const [due, setDue] = useState('');
  const price = (l: RLine) => l.now ?? l.old;
  const sel = lines.filter(l => on[l.id]); const pieces = sel.reduce((t, l) => t + q[l.id], 0);
  const before = lines.reduce((t, l) => t + l.qty * l.old, 0), total = sel.reduce((t, l) => t + q[l.id] * price(l), 0);
  const rises = lines.filter(l => on[l.id] && price(l) > l.old).length, rise = sel.reduce((t, l) => t + q[l.id] * Math.max(0, price(l) - l.old), 0);
  // Stock: what the ticked lines would take, against what is free
  const need: Record<string, { per: number; unit: string; avail: number; warn: number | null; take: number }> = {};
  for (const l of sel) for (const nd of l.needs) { const e = (need[nd.item] ||= { per: 0, unit: nd.unit, avail: nd.avail, warn: nd.warn, take: 0 }); e.take += q[l.id] * nd.per; }
  const short = (l: RLine) => l.needs.filter(nd => on[l.id] && q[l.id] * nd.per > nd.avail).map(nd => `${nd.item} short by ${Math.round((q[l.id] * nd.per - nd.avail) * 100) / 100}${nd.unit === 'metres' ? ' m' : ''}`);
  const stockRows = Object.entries(need).map(([item, e]) => { const left = e.avail - e.take; return { item, bad: left < 0, low: left >= 0 && e.warn != null && left <= e.warn, by: Math.round(-left * 100) / 100, unit: e.unit }; }).filter(x => x.bad || x.low);
  const shown = all ? lines : lines.slice(0, 5); const hidden = lines.slice(5);
  const step = (id: number, d: number) => setQ({ ...q, [id]: Math.max(0, q[id] + d) });
  const create = async () => {
    setBusy(true); const j: any = await send('/api/orders/reorder', { from, name, due, lines: sel.filter(l => q[l.id] > 0).map(l => ({ line_id: l.id, qty: q[l.id] })) });
    setBusy(false); if (j.ok) r.push(`/orders/${j.id}`);
  };
  return (
    <>
      <div style={{ flex: '2 1 560px', minWidth: 0, background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div><div style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: 22 }}>{fromName}</div><div style={{ color: '#4B5563' }}>{shown.length} of {lines.length} {lines.length === 1 ? 'line' : 'lines'} shown · {sel.length} ticked</div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ color: '#3F4A58' }}>Start quantities from</span>
            <span style={{ display: 'inline-flex', border: '1px solid #C5CCD5', borderRadius: 10, overflow: 'hidden' }}>
              <button type="button" onClick={() => { setQ(Object.fromEntries(lines.map(l => [l.id, l.qty]))); setOn(Object.fromEntries(lines.map(l => [l.id, true]))); }} style={{ minHeight: 46, padding: '0 16px', fontSize: 16, fontWeight: 600, color: '#fff', background: '#0E5C63', border: 0, cursor: 'pointer' }}>Same as last time</button>
              <button type="button" onClick={() => setQ(Object.fromEntries(lines.map(l => [l.id, 0])))} style={{ minHeight: 46, padding: '0 20px', fontSize: 16, fontWeight: 600, color: '#0E5C63', background: '#fff', border: 0, cursor: 'pointer' }}>Blank</button>
            </span>
          </div>
        </div>
        {shown.map(l => { const sh = short(l); const up = price(l) > l.old; const stripe = sh.length ? '#C0392B' : up ? '#E8A317' : '#E3E8ED'; return (
          <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px 12px 14px', borderTop: '1px solid #E8ECF0', borderLeft: `6px solid ${stripe}`, opacity: on[l.id] ? 1 : .55 }}>
            <input type="checkbox" checked={on[l.id]} onChange={e => setOn({ ...on, [l.id]: e.target.checked })} aria-label={`Include ${l.item}`} style={{ width: 26, height: 26, accentColor: '#0E5C63', flex: '0 0 auto' }} />
            <span style={{ flex: '0 0 48px', width: 48, height: 48, borderRadius: 10, background: '#EEF1F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Silhouette item={l.item} detail={l.detail} size={36} /></span>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <b style={{ fontSize: 17, fontWeight: 600 }}>{l.item}</b><span style={{ fontSize: 15, color: '#3F4A58' }}>{l.detail}</span>
              {up && pill('#FDE9B0', '#5A3A00', `Price up from ${n(l.old)}`)}
              {sh.map(t => pill('#FBE0DC', '#8A1C13', t, t))}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #C5CCD5', borderRadius: 10 }}>
                <button type="button" aria-label="Less" onClick={() => step(l.id, -1)} style={{ width: 40, height: 44, fontSize: 20, border: 0, background: 'none', cursor: 'pointer' }}>−</button>
                <input aria-label={`Quantity of ${l.item}`} value={q[l.id]} inputMode="numeric" onChange={e => setQ({ ...q, [l.id]: Number(e.target.value.replace(/\D/g, '')) || 0 })} style={{ width: 44, textAlign: 'center', fontSize: 18, fontWeight: 600, border: 0, background: 'none' }} />
                <button type="button" aria-label="More" onClick={() => step(l.id, 1)} style={{ width: 40, height: 44, fontSize: 20, border: 0, background: 'none', cursor: 'pointer' }}>+</button>
              </span>
              <span style={{ fontSize: 13, color: '#4B5563' }}>Last time {l.qty}</span>
            </span>
            <span style={{ flex: '0 0 110px', textAlign: 'right' }}><b style={{ fontSize: 17 }}>{n(q[l.id] * price(l))}</b><div style={{ fontSize: 14, color: '#4B5563' }}>{n(price(l))} each</div></span>
          </div>); })}
        {hidden.length > 0 && <button type="button" onClick={() => setAll(!all)} style={{ width: '100%', minHeight: 52, textAlign: 'left', padding: '0 18px', fontSize: 16, fontWeight: 600, color: '#0E5C63', background: '#fff', border: 0, borderTop: '1px solid #E8ECF0', cursor: 'pointer' }}>{all ? 'Show fewer lines' : `Show ${hidden.length} more ${hidden.length === 1 ? 'line' : 'lines'} · ${n(hidden.reduce((t, l) => t + (on[l.id] ? q[l.id] * price(l) : 0), 0))} · ${hidden.reduce((t, l) => t + (on[l.id] ? q[l.id] : 0), 0)} pieces`}</button>}
      </div>
      <div style={{ flex: '1 1 340px', maxWidth: 400, minWidth: 0, background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: 22 }}>New draft order</div>
        <label style={LBL}>Name<input style={INP} value={name} onChange={e => setName(e.target.value)} /></label>
        <label style={LBL}>Due date<input type="date" style={INP} value={due} onChange={e => setDue(e.target.value)} /></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 6, fontSize: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3F4A58' }}><span>Last time, {lines.length} {lines.length === 1 ? 'line' : 'lines'}</span><span>{n(before)}</span></div>
          {rises > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#5A3A00' }}><span>Price rises on {rises} {rises === 1 ? 'line' : 'lines'}</span><span>+{n(rise)}</span></div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><b>At today&apos;s prices</b><b style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontSize: 30 }}>{n(total)}</b></div>
          <div style={{ fontSize: 14, color: '#4B5563' }}>{sel.length} {sel.length === 1 ? 'line' : 'lines'} · {pieces} pieces</div>
        </div>
        {stockRows.length > 0 && (
          <div style={{ borderTop: '1px solid #E8ECF0', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#4B5563' }}>Stock check</div>
            {stockRows.map(x => <span key={x.item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, color: x.bad ? '#8A1C13' : '#5A3A00' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: x.bad ? '#C0392B' : '#E8A317' }} />{x.item} {x.bad ? `is ${x.by}${x.unit === 'metres' ? ' m' : ''} short` : 'running low'}</span>)}
            <Link href="/reports/buy" style={{ fontWeight: 600 }}>See what to buy</Link>
            <span style={{ fontSize: 14, color: '#4B5563' }}>You can still create the draft. Nothing is taken from stock until the order is confirmed.</span>
          </div>
        )}
        <button type="button" disabled={busy || sel.filter(l => q[l.id] > 0).length === 0} onClick={create} style={{ minHeight: 52, fontSize: 17, fontWeight: 600, color: '#fff', background: '#0E5C63', border: 0, borderRadius: 12, cursor: 'pointer' }}>Create draft with {sel.filter(l => q[l.id] > 0).length} {sel.filter(l => q[l.id] > 0).length === 1 ? 'line' : 'lines'}</button>
        <Link href=".." onClick={e => { e.preventDefault(); history.back(); }} style={{ minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 600, color: '#0E5C63', border: '2px solid #0E5C63', borderRadius: 12, textDecoration: 'none' }}>Cancel</Link>
      </div>
    </>
  );
}
