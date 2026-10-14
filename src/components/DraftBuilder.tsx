'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { send } from '@/lib/client';
import { Silhouette } from './ui';

const n = (x: number) => '₦' + Math.round(x).toLocaleString('en-NG');
export type DLine = { id: number; item: string; detail: string | null; qty: number; unit_price: number; sizes: string | null; design: string | null };
type G = { name: string; sizes: number[]; placements: { place: string; what: string; method: string }[]; recipe: { item: string; qty: number; unit: string; onHand: number; avail: number }[] };
const LBL = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, color: '#3F4A58', minWidth: 0 } as const;
const INP = { width: '100%', boxSizing: 'border-box', minHeight: 46, padding: '0 12px', fontSize: 16, color: '#1B2430', background: '#FFFFFF', border: '1px solid #C5CCD5', borderRadius: 10 } as const;
const parse = (s: string | null) => Object.fromEntries((s || '').split(',').map(x => x.trim().split(':')).filter(a => a[0] && a[1]).map(a => [a[0].trim(), Number(a[1]) || 0]));
const ser = (m: Record<string, number>) => Object.entries(m).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(', ');

export function DraftBuilder({ orderId, customerId, customer, name, due, lines, garments, prices }: { orderId: string; customerId: string; customer: string; name: string; due: string; lines: DLine[]; garments: Record<string, G>; prices: Record<string, number> }) {
  const r = useRouter();
  const [sel, setSel] = useState<number | null>(lines[0]?.id ?? null);
  const [local, setLocal] = useState<Record<number, DLine>>({});
  const [saving, setSaving] = useState(false); const [busy, setBusy] = useState(false);
  const timer = useRef<any>(null);
  const cur = (l: DLine) => local[l.id] || l;
  const L = lines.map(cur); const l = L.find(x => x.id === sel) || null;
  useEffect(() => { if (sel === null && lines[0]) setSel(lines[0].id); }, [lines, sel]);
  const total = L.reduce((s, x) => s + x.qty * x.unit_price, 0), pieces = L.reduce((s, x) => s + x.qty, 0);
  const g = l ? garments[l.item] : undefined;
  const shortOf = (x: DLine) => (garments[x.item]?.recipe || []).filter(rc => x.qty * rc.qty > rc.avail).map(rc => Math.ceil(x.qty * rc.qty - rc.avail));

  const push = (x: DLine) => {
    setLocal(m => ({ ...m, [x.id]: x })); setSaving(true); clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const j: any = await send(`/api/orders/${orderId}/lines`, { line_id: x.id, item: x.item, detail: x.detail ?? '', sizes: x.sizes ?? '', qty: x.qty, unit_price: x.unit_price }, 'PATCH');
      setSaving(false); if (j.ok) r.refresh();
    }, 700);
  };
  const add = async (from?: DLine) => {
    const item = from?.item || Object.keys(prices)[0] || 'Item';
    setBusy(true);
    const j: any = await send(`/api/orders/${orderId}/lines`, { item, detail: from?.detail || '', qty: from?.qty || 1, unit_price: from?.unit_price ?? prices[item] ?? 0, sizes: from?.sizes || '' });
    setBusy(false); if (j.ok) { if (j.id) setSel(j.id); r.refresh(); }
  };
  const remove = async () => { if (!l || !confirm(`Remove ${l.item} from this order?`)) return; setBusy(true); const j: any = await send(`/api/orders/${orderId}/lines`, { line_id: l.id, qty: 0, unit_price: l.unit_price }, 'PATCH'); setBusy(false); if (j.ok) { setSel(null); r.refresh(); } };
  const confirmOrder = async () => {
    if (L.length === 0) { alert('Add at least one line first.'); return; }
    if (!confirm(`Confirm this order for ${n(total)}? It gets an invoice number and moves to Confirmed.`)) return;
    setBusy(true); const j: any = await send(`/api/orders/${orderId}`, { stage: 'Confirmed' }, 'PATCH'); setBusy(false); if (j.ok) r.refresh();
  };
  const sizeMap = l ? parse(l.sizes) : {};
  const setSize = (sz: string, v: number) => { if (!l) return; const m = { ...sizeMap, [sz]: Math.max(0, v) }; const q = Object.values(m).reduce((s, x) => s + x, 0); push({ ...l, sizes: ser(m), qty: q || l.qty }); };
  const items = Array.from(new Set([...Object.keys(prices), ...(l ? [l.item] : [])]));
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link href={`/customers/${customerId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>{customer}</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: 34, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{name}</h1>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#4B5563', background: '#E6EAEE', padding: '3px 10px', borderRadius: 999 }}>Draft</span>
          </div>
          <span style={{ fontSize: 15, color: '#4B5563' }}>{saving ? 'Saving…' : 'Draft saved automatically'}{due ? ` · Due ${due}` : ''}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: 13, color: '#4B5563' }}>Order total</div><div style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: 30, lineHeight: 1.05 }}>{n(total)}</div></div>
          <button type="button" disabled={busy || L.length === 0} onClick={confirmOrder} style={{ minHeight: 52, padding: '0 26px', fontSize: 16, fontWeight: 600, color: '#fff', background: L.length ? '#0E5C63' : '#8AA7AA', border: 0, borderRadius: 12, cursor: 'pointer' }}>Review and confirm</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 360px', maxWidth: 400, minWidth: 0, background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #E8ECF0' }}><b style={{ fontSize: 16 }}>Lines</b><span style={{ fontSize: 14, color: '#4B5563' }}>{L.length} {L.length === 1 ? 'line' : 'lines'} · {pieces} pieces</span></div>
          {L.map(x => { const on = x.id === sel; const sh = shortOf(x); return (
            <button key={x.id} type="button" onClick={() => setSel(x.id)} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', background: on ? '#E8EEF1' : '#fff', border: 0, borderBottom: '1px solid #E8ECF0', borderLeft: on ? '5px solid #0E5C63' : '5px solid transparent', cursor: 'pointer', color: '#1B2430' }}>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontWeight: 600, fontSize: 17 }}>{x.item}</span>
                <span style={{ fontSize: 14, color: '#3F4A58' }}>{[x.detail, `${x.qty} pcs`].filter(Boolean).join(' · ')}</span>
                {sh.length > 0 && <span style={{ alignSelf: 'flex-start', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#8A1C13', background: '#FDECEA', border: '1px solid #E8A29B', padding: '2px 10px', borderRadius: 999 }}>Stock short by {Math.max(...sh)}</span>}
              </span>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{n(x.qty * x.unit_price)}</span>
            </button>); })}
          <button type="button" disabled={busy} onClick={() => add()} style={{ width: '100%', textAlign: 'left', minHeight: 56, padding: '0 18px', fontSize: 16, fontWeight: 600, color: '#0E5C63', background: '#fff', border: 0, cursor: 'pointer' }}>+ &nbsp;Add line</button>
        </div>

        {l ? (
          <div style={{ flex: '2 1 560px', minWidth: 0, background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: 24 }}>{l.item}</h2>
              <span style={{ display: 'flex', gap: 10 }}>
                <button type="button" disabled={busy} onClick={() => add(l)} style={{ minHeight: 42, padding: '0 16px', fontSize: 14, fontWeight: 600, color: '#0E5C63', background: '#fff', border: '2px solid #0E5C63', borderRadius: 10, cursor: 'pointer' }}>Copy as new line</button>
                <button type="button" disabled={busy} onClick={remove} style={{ minHeight: 42, padding: '0 16px', fontSize: 14, fontWeight: 600, color: '#8A1C13', background: '#fff', border: '1px solid #E8A29B', borderRadius: 10, cursor: 'pointer' }}>Remove</button>
              </span>
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <label style={{ ...LBL, flex: '1 1 160px' }}>Garment
                    <select style={INP} value={l.item} onChange={e => push({ ...l, item: e.target.value, unit_price: prices[e.target.value] ?? l.unit_price })}>{items.map(i => <option key={i}>{i}</option>)}</select>
                  </label>
                  <label style={{ ...LBL, flex: '1 1 160px' }}>Colour and details
                    <input style={INP} value={l.detail || ''} onChange={e => push({ ...l, detail: e.target.value })} placeholder="e.g. Red house" />
                  </label>
                </div>
                {g && g.sizes.length > 0 ? (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#4B5563', marginBottom: 6 }}>Sizes · {l.qty} pieces</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {g.sizes.map(sz => <label key={sz} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 14, color: '#3F4A58' }}>{sz}<input type="number" min="0" value={sizeMap[String(sz)] || 0} onChange={e => setSize(String(sz), Math.floor(Number(e.target.value) || 0))} aria-label={`Size ${sz}`} style={{ width: 56, minHeight: 48, textAlign: 'center', fontSize: 18, border: '1px solid #C5CCD5', borderRadius: 10 }} /></label>)}
                    </div>
                  </div>
                ) : (
                  <label style={{ ...LBL, maxWidth: 160 }}>Quantity<input type="number" min="1" style={INP} value={l.qty} onChange={e => push({ ...l, qty: Math.max(1, Math.floor(Number(e.target.value) || 1)) })} /></label>
                )}
                {g && g.placements.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#4B5563', marginBottom: 6 }}>Decorations for this garment</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {g.placements.map((p, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid #C5CCD5', borderRadius: 10 }}><span style={{ flex: '0 0 26px', width: 26, height: 26, borderRadius: '50%', background: '#E3EEF0', color: '#0A4449', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{i + 1}</span><span style={{ flex: 1 }}><b style={{ fontWeight: 600 }}>{p.what}</b><div style={{ fontSize: 13, color: '#4B5563' }}>{p.method}</div></span><span style={{ color: '#3F4A58' }}>{p.place}</span></div>)}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ flex: '1 1 240px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#4B5563' }}>Preview</div>
                <div style={{ height: 220, borderRadius: 12, background: '#EEF1F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Silhouette item={l.item} detail={l.detail} size={170} /></div>
                <a href={`/studio/index.html?order=${orderId}&line=${l.id}&item=${encodeURIComponent(l.item)}`} target="_blank" rel="noreferrer" style={{ minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 15, color: '#0E5C63', border: '2px solid #0E5C63', borderRadius: 10, textDecoration: 'none' }}>{l.design ? 'Open saved 3D mockup' : 'Open 3D mockup'}</a>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #E8ECF0', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(g?.recipe || []).map(rc => { const need = Math.round(l.qty * rc.qty * 100) / 100; const okk = need <= rc.avail; return <span key={rc.item} style={{ fontSize: 15, color: okk ? '#14532D' : '#8A1C13' }}>{okk ? '✓' : '⚠'} {rc.item}: {rc.onHand} {rc.unit} on hand, {need} needed{okk ? '' : `. Short by ${Math.round((need - rc.avail) * 100) / 100}`}</span>; })}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
                <span style={{ fontSize: 15, color: '#4B5563' }}>{l.qty} × <input type="number" min="0" value={l.unit_price} onChange={e => push({ ...l, unit_price: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} aria-label="Price each" style={{ width: 100, minHeight: 36, fontSize: 15, padding: '0 8px', border: '1px solid #C5CCD5', borderRadius: 8 }} /> {prices[l.item] === l.unit_price ? 'from price book' : `(price book ${prices[l.item] != null ? n(prices[l.item]) : 'none'})`}</span>
                <b style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontSize: 28 }}>{n(l.qty * l.unit_price)}</b>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: '2 1 560px', background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, padding: 32, color: '#4B5563' }}>{L.length === 0 ? 'No lines yet. Use “Add line” to start.' : 'Pick a line on the left to edit it.'}</div>
        )}
      </div>
    </>
  );
}
