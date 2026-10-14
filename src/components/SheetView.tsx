'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { send } from '@/lib/client';
import { Mockup, studioUrl, h2 } from './ui';

export type SLine = { thumb?: string | null; id: number; line_no: number; item: string; detail: string | null; qty: number; unit_price: number; decor_price: number; sizes: [string, number][]; placements: { no: number; what: string; place: string; method: string }[]; short: string[] };
type Mat = { name: string; qty: number; unit: string; short: number };
const n = (x: number) => '₦' + Math.round(x).toLocaleString('en-NG');
const Toggle = ({ on, set, title, sub }: { on: boolean; set: (v: boolean) => void; title: string; sub?: string }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
    <button type="button" role="switch" aria-checked={on} onClick={() => set(!on)} style={{ flex: '0 0 44px', width: 44, height: 26, borderRadius: 13, border: 0, background: on ? '#0E5C63' : '#9CA3AF', position: 'relative', cursor: 'pointer' }}><span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} /></button>
    <span style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 16, fontWeight: 500 }}>{title}</span>{sub && <span style={{ fontSize: 14, color: '#4B5563' }}>{sub}</span>}</span>
  </label>
);

export function SheetView({ orderId, name, customer, invoice, due, pieces, lineCount, stage, lines, pull, trims, note }: { orderId: string; name: string; customer: string; invoice: string; due: string; pieces: number; lineCount: number; stage: string; lines: SLine[]; pull: Mat[]; trims: Mat[]; note: string }) {
  const r = useRouter();
  const [pic, setPic] = useState(true), [sz, setSz] = useState(true), [boxes, setBoxes] = useState(true), [prices, setPrices] = useState(false);
  const [view, setView] = useState('Whole order'); const [busy, setBusy] = useState(false);
  const showSz = sz && view !== 'Embroidery' && view !== 'Finishing', showPl = view !== 'Cutting', showPull = view === 'Whole order' || view === 'Cutting', showTrims = view === 'Whole order' || view === 'Embroidery';
  const next: Record<string, [string, string]> = { Confirmed: ['In production', 'Start production'], 'In production': ['Ready', 'Mark as ready'], Ready: ['Collected', 'Mark as delivered'] };
  const mv = async () => { const t = next[stage]; if (!t) return; setBusy(true); const j: any = await send(`/api/orders/${orderId}`, { stage: t[0] }, 'PATCH'); setBusy(false); if (j.ok) r.refresh(); };
  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div className="noprint" style={{ flex: '0 0 316px', background: '#fff', border: '1px solid #DDE2E8', borderRadius: 10, padding: '18px 18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <b style={h2}>On the sheet</b>
        <Toggle on={pic} set={setPic} title="Picture of each line" sub="Garment with numbered placements" />
        <Toggle on={sz} set={setSz} title="Size breakdown" />
        <Toggle on={boxes} set={setBoxes} title="Tick boxes for each step" />
        <Toggle on={prices} set={setPrices} title="Show prices" sub="Keep off for the workshop" />
        <div style={{ borderTop: '1px solid #E8ECF0', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 14, color: '#4B5563' }}>Order stage</span>
          <span style={{ alignSelf: 'flex-start', fontSize: 14, fontWeight: 600, color: '#0A4449', background: '#DCEBED', padding: '3px 12px', borderRadius: 999 }}>{stage === 'Collected' ? 'Delivered' : stage}</span>
          {next[stage] && <button type="button" disabled={busy} onClick={mv} style={{ minHeight: 48, fontSize: 16, fontWeight: 600, color: '#fff', background: '#0E5C63', border: 0, borderRadius: 10, cursor: 'pointer' }}>{next[stage][1]}</button>}
        </div>
      </div>
      <div style={{ flex: '1 1 640px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="noprint" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ color: '#4B5563' }}>Show</span>
          <span style={{ display: 'inline-flex', border: '1px solid #C5CCD5', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>{['Whole order', 'Cutting', 'Embroidery', 'Finishing'].map(t => <button key={t} type="button" aria-pressed={view === t} onClick={() => setView(t)} style={{ minHeight: 46, padding: '0 20px', fontSize: 16, fontWeight: 600, border: 0, borderRight: '1px solid #C5CCD5', color: view === t ? '#fff' : '#1B2430', background: view === t ? '#0E5C63' : '#fff', cursor: 'pointer' }}>{t}</button>)}</span>
          <span style={{ color: '#4B5563' }}>Each station can print only its own part.</span>
        </div>
        <article style={{ background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, padding: '14px 26px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', borderBottom: '3px solid #1B2430', paddingBottom: 10 }}>
            <div><div style={{ fontSize: 13, letterSpacing: '.08em', color: '#4B5563', fontWeight: 600 }}>PRODUCTION SHEET{view !== 'Whole order' ? ` · ${view.toUpperCase()}` : ''}</div><div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontWeight: 700, fontSize: 28, lineHeight: 1.1 }}>{name}</div><div style={{ color: '#4B5563' }}>{customer}</div></div>
            <div style={{ display: 'flex', gap: 30 }}>
              <div><div style={{ fontSize: 14, color: '#4B5563' }}>Order</div><b style={{ fontSize: 18 }}>{invoice}</b></div>
              <div><div style={{ fontSize: 14, color: '#4B5563' }}>Due</div><b style={{ fontSize: 18 }}>{due}</b></div>
              <div><div style={{ fontSize: 14, color: '#4B5563' }}>Size of job</div><b style={{ fontSize: 18 }}>{lineCount} {lineCount === 1 ? 'line' : 'lines'} · {pieces} pieces</b></div>
            </div>
          </div>
          {lines.map(l => (
            <div key={l.id} style={{ display: 'flex', gap: 18, padding: '12px 0', borderBottom: '1px solid #E1E6EB', alignItems: 'center', flexWrap: 'wrap', breakInside: 'avoid' }}>
              <span style={{ flex: '0 0 26px', fontSize: 24, fontWeight: 700 }}>{l.line_no}</span>
              {pic && <span style={{ flex: '0 0 76px', display: 'flex', justifyContent: 'center' }}><Mockup thumb={l.thumb} item={l.item} detail={l.detail} size={70} /></span>}
              <div style={{ flex: '1 1 170px', minWidth: 0 }}><div style={{ fontSize: 19, fontWeight: 700 }}>{l.item} <a className="noprint" href={studioUrl(orderId, l.id, l.item)} style={{ fontSize: 14, fontWeight: 600, marginLeft: 8 }}>3D mockup</a></div><div style={{ color: '#4B5563' }}>{l.detail}</div><b style={{ fontSize: 17 }}>{l.qty} pieces{prices ? ` · ${n(l.unit_price + l.decor_price)} each · ${n(l.qty * (l.unit_price + l.decor_price))}` : ''}</b></div>
              {showSz && <div style={{ flex: '0 1 200px' }}>{l.sizes.length > 0 ? <div style={{ display: 'flex', border: '1px solid #C5CCD5', borderRadius: 8, overflow: 'hidden' }}>{l.sizes.map(([s, q]) => <div key={s} style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: 13, color: '#4B5563', borderBottom: '1px solid #E1E6EB', padding: '2px 0' }}>{s}</div><div style={{ fontWeight: 700, fontSize: 20, padding: '4px 0' }}>{q}</div></div>)}</div> : <span style={{ fontSize: 14, color: '#4B5563' }}>No size breakdown</span>}</div>}
              {showPl && <div style={{ flex: '1 1 220px', fontSize: 15, display: 'flex', flexDirection: 'column', gap: 6 }}>{l.placements.length === 0 ? <span style={{ color: '#4B5563' }}>No decorations</span> : l.placements.map(p => <div key={p.no} style={{ display: 'flex', gap: 8 }}><span style={{ flex: '0 0 22px', width: 22, height: 22, borderRadius: '50%', border: '2px solid #1B2430', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.no}</span><span><b>{p.what}</b> · {p.place}<div style={{ color: '#4B5563' }}>{p.method} · {l.qty}</div></span></div>)}{l.short.map(t => <b key={t} style={{ color: '#8A1C13', fontSize: 14 }}>{t}</b>)}</div>}
              {boxes && <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>{(view === 'Cutting' ? ['Cut'] : view === 'Embroidery' ? ['Stitch'] : view === 'Finishing' ? ['Finish', 'Check'] : ['Cut', 'Stitch', 'Finish', 'Check']).map(t => <div key={t} style={{ textAlign: 'center', fontSize: 13, color: '#4B5563' }}><div style={{ width: 32, height: 32, border: '2px solid #1B2430', borderRadius: 6, marginBottom: 2 }} />{t}</div>)}</div>}
            </div>))}
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', borderTop: '3px solid #1B2430', paddingTop: 10, marginTop: -1 }}>
            {showPull && pull.length > 0 && <div style={{ flex: '1 1 260px' }}><div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.08em', color: '#4B5563' }}>PULL FROM STOCK</div>{pull.map(m => <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', color: m.short > 0 ? '#8A1C13' : undefined }}><span>{m.name}</span><b>{m.qty} {m.unit === 'metres' ? 'm' : ''}{m.short > 0 ? ` · short ${m.short}` : ''}</b></div>)}</div>}
            {showTrims && trims.length > 0 && <div style={{ flex: '1 1 260px' }}><div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.08em', color: '#4B5563' }}>BADGES AND THREAD</div>{trims.map(m => <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', color: m.short > 0 ? '#8A1C13' : undefined }}><span>{m.name}</span><b>{m.qty}{m.unit === 'cones' ? ' cones' : ''}{m.short > 0 ? ` · short ${m.short}` : ''}</b></div>)}</div>}
            {note && <div style={{ flex: '1 1 260px' }}><div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.08em', color: '#4B5563' }}>NOTES FROM THE FRONT DESK</div><div>{note}</div></div>}
          </div>
        </article>
      </div>
    </div>
  );
}
