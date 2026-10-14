'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { send } from '@/lib/client';

const n = (x: number) => '₦' + Math.round(x).toLocaleString('en-NG');
type Line = { id: number; line_no: number; item: string; detail: string | null; qty: number; unit_price: number; design: string | null };
type Need = { item: string; per: number; unit: string; avail: number };
const LBL = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 15, color: '#3F4A58', minWidth: 0 } as const;
const INP = { width: '100%', boxSizing: 'border-box', minHeight: 46, padding: '0 12px', fontSize: 16, color: '#1B2430', background: '#FFFFFF', border: '1px solid #C5CCD5', borderRadius: 10 } as const;

/** All lines of an order, with the edit panel. Confirmed orders ask for a reason and the change is logged. */
export function LinesEditor({ orderId, confirmed, lines, selected, needs, subtotal, changed, orderStage, log }: { log: { id: number; change: string; amount: number; by: string; reason: string; date: string }[];  orderId: string; confirmed: boolean; lines: Line[]; selected?: number; needs: Record<number, Need[]>; subtotal: number; changed: Record<number, number>; orderStage: string }) {
  const r = useRouter();
  const [sel, setSel] = useState<number | null>(selected ?? null);
  const l = lines.find(x => x.id === sel) || null;
  const [qty, setQty] = useState(l ? String(l.qty) : ''); const [price, setPrice] = useState(l ? String(l.unit_price) : ''); const [why, setWhy] = useState('');
  const [busy, setBusy] = useState(false);
  const open = (x: Line | null) => { setSel(x?.id ?? null); setQty(x ? String(x.qty) : ''); setPrice(x ? String(x.unit_price) : ''); setWhy(''); };
  const q = Math.max(0, Math.floor(Number(qty) || 0)), p = Math.max(0, Math.floor(Number(price) || 0));
  const pieces = lines.reduce((s, x) => s + x.qty, 0);
  const save = async (remove = false) => {
    if (!l) return; setBusy(true);
    const j: any = await send(`/api/orders/${orderId}/lines`, { line_id: l.id, qty: remove ? 0 : q, unit_price: p, reason: why }, 'PATCH');
    setBusy(false); if (j.ok) { open(null); r.refresh(); }
  };
  const dQty = l ? q - l.qty : 0, dTotal = l ? q * p - l.qty * l.unit_price : 0;
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 560px', minWidth: 0, background: '#FFFFFF', border: '1px solid #DDE2E8', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#EEF1F4', borderBottom: '1px solid #DDE2E8', fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#4B5563' }}>
          <span style={{ flex: '0 0 24px' }}>#</span><span style={{ flex: 1 }}>Item</span><span style={{ flex: '0 0 56px', textAlign: 'right' }}>Qty</span><span style={{ flex: '0 0 90px', textAlign: 'right' }}>Each</span><span style={{ flex: '0 0 100px', textAlign: 'right' }}>Total</span><span style={{ flex: '0 0 110px' }} />
        </div>
        {lines.length === 0 && <div style={{ padding: 18, color: '#4B5563' }}>No lines yet. Add the first one below.</div>}
        {lines.map(x => { const on = x.id === sel; return (
          <div key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', minHeight: 34, borderBottom: '1px solid #E8ECF0', background: on ? '#E3EEF0' : '#fff', borderLeft: on ? '4px solid #0E5C63' : '4px solid transparent', fontSize: 15 }}>
            <span style={{ flex: '0 0 24px', color: '#4B5563' }}>{x.line_no}</span>
            <span style={{ flex: 1, minWidth: 0 }}><b style={{ fontWeight: 600 }}>{x.item}</b>{x.detail && <span style={{ color: '#4B5563', fontSize: 14, marginLeft: 10 }}>{x.detail}</span>}</span>
            {changed[x.id] != null && <span style={{ fontSize: 13, fontWeight: 600, color: '#5A3A00', background: '#FDE9B0', padding: '2px 10px', borderRadius: 999 }}>Was {changed[x.id]}</span>}
            <span style={{ flex: '0 0 56px', textAlign: 'right' }}>{x.qty}</span><span style={{ flex: '0 0 90px', textAlign: 'right' }}>{n(x.unit_price)}</span><span style={{ flex: '0 0 100px', textAlign: 'right', fontWeight: 600 }}>{n(x.qty * x.unit_price)}</span>
            <span style={{ flex: '0 0 110px', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <a href={`/studio/index.html?order=${orderId}&line=${x.id}&item=${encodeURIComponent(x.item)}`} target="_blank" rel="noreferrer" style={{ fontWeight: 600, fontSize: 14 }}>{x.design ? 'Mockup ✓' : 'Mockup'}</a>
              <button type="button" onClick={() => open(on ? null : x)} style={{ background: 'none', border: 0, padding: 0, color: '#0E5C63', fontWeight: 600, fontSize: 14, textDecoration: 'underline', cursor: 'pointer' }}>{on ? 'Editing' : 'Edit'}</button>
            </span>
          </div>); })}
        <AddLineRow orderId={orderId} confirmed={confirmed} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 14px 12px', color: '#4B5563' }}><span>{lines.length} {lines.length === 1 ? 'line' : 'lines'} · {pieces} pieces</span><span style={{ color: '#1B2430' }}>Before discount <b style={{ fontSize: 22 }}>{n(subtotal)}</b></span></div>
      </div>
      <div style={{ flex: '0 1 440px', minWidth: 300, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {l && (
        <div style={{ background: '#FFFFFF', border: '1px solid #DDE2E8', borderTop: '4px solid #0E5C63', borderRadius: 14, boxSizing: 'border-box', padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: 20 }}>Line {l.line_no} · {l.item}</span><span style={{ fontSize: 14, color: '#4B5563' }}>{l.detail}</span>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <label style={{ ...LBL, flex: '1 1 100px' }}>Quantity<input type="number" min="0" style={INP} value={qty} onChange={e => setQty(e.target.value)} /></label>
            <label style={{ ...LBL, flex: '1 1 110px' }}>Price each<input type="number" min="0" style={INP} value={price} onChange={e => setPrice(e.target.value)} /></label>
            <div style={{ ...LBL, flex: '1 1 110px' }}>Line total<span style={{ minHeight: 46, display: 'flex', alignItems: 'center', fontSize: 20, fontWeight: 700, color: '#1B2430' }}>{n(q * p)}</span></div>
          </div>
          {confirmed && <label style={LBL}>Why is it changing? (required)<input style={INP} value={why} onChange={e => setWhy(e.target.value)} placeholder="e.g. Parent called, two more girls" /></label>}
          {(dQty !== 0 || dTotal !== 0) && (
            <div style={{ background: '#E8EDF1', borderRadius: 10, padding: '12px 14px', fontSize: 15, lineHeight: 1.4, color: '#3F4A58', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span><b style={{ color: '#1B2430' }}>{dQty !== 0 ? `Was ${l.qty}, now ${q}.` : `Price ${n(l.unit_price)} → ${n(p)}.`}</b> The total goes from {n(subtotal)} to {n(subtotal + dTotal)}.</span>
              {dQty !== 0 && (needs[l.id] || []).map(nd => { const d = Math.round(dQty * nd.per * 100) / 100; const after = nd.avail - d; return <span key={nd.item}>{nd.item} needed goes {d > 0 ? 'up' : 'down'} by {Math.abs(d)} {nd.unit}. {after >= 0 ? `${nd.avail} ${nd.unit} free, so it is fine.` : `Only ${nd.avail} ${nd.unit} free. You would be short by ${Math.round(-after * 100) / 100}.`}</span>; })}
            </div>
          )}
          {confirmed && <div style={{ background: '#FDE9B0', color: '#5A3A00', borderRadius: 10, padding: '12px 14px', fontSize: 15, lineHeight: 1.4 }}><b>This order is confirmed.</b> Saving is logged below, and the production sheet needs printing again.</div>}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" onClick={() => open(null)} style={{ flex: 1, minHeight: 48, fontSize: 16, fontWeight: 600, color: '#0E5C63', background: '#FFFFFF', border: '2px solid #0E5C63', borderRadius: 12, cursor: 'pointer' }}>Cancel</button>
            <button type="button" disabled={busy} onClick={() => save()} style={{ flex: 1.2, minHeight: 48, fontSize: 16, fontWeight: 600, color: '#FFFFFF', background: '#0E5C63', border: 0, borderRadius: 12, cursor: 'pointer' }}>Save change</button>
          </div>
          <button type="button" disabled={busy} onClick={() => { if (confirm(`Remove ${l.item} from this order?`)) save(true); }} style={{ alignSelf: 'flex-start', background: 'none', border: 0, color: '#8A1C13', fontWeight: 600, fontSize: 14, cursor: 'pointer', padding: 0 }}>Remove this line</button>
        </div>
      )}
      {log.length > 0 && (
        <div style={{ background: '#FFFFFF', border: '1px solid #DDE2E8', borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#4B5563', marginBottom: 6 }}>Changes since confirming</div>
          {log.map(c => <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid #E8ECF0' }}><b>{c.change}.</b> <span style={{ color: '#3F4A58' }}>{c.amount >= 0 ? '+' : '−'}{n(Math.abs(c.amount))}</span><div style={{ fontSize: 14, color: '#4B5563' }}>{c.date}, {c.by} · {c.reason}</div></div>)}
        </div>
      )}
      </div>
    </div>
  );
}

function AddLineRow({ orderId, confirmed }: { orderId: string; confirmed: boolean }) {
  const r = useRouter(); const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false);
  if (!open) return <button type="button" onClick={() => setOpen(true)} style={{ width: '100%', minHeight: 48, textAlign: 'left', padding: '0 18px', fontSize: 15, fontWeight: 600, color: '#0E5C63', background: '#fff', border: 0, borderBottom: '1px solid #E8ECF0', cursor: 'pointer' }}>+ Add line</button>;
  return (
    <form style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', padding: '12px 14px', background: '#FAFBFC', borderBottom: '1px solid #E8ECF0' }} onSubmit={async e => {
      e.preventDefault(); const f = e.currentTarget; const b = Object.fromEntries(new FormData(f) as any); setBusy(true);
      const j: any = await send(`/api/orders/${orderId}/lines`, b); setBusy(false); if (j.ok) { setOpen(false); r.refresh(); }
    }}>
      <label style={{ ...LBL, fontSize: 14, flex: '2 1 200px' }}>Item<input name="item" required style={INP} /></label>
      <label style={{ ...LBL, fontSize: 14, flex: '2 1 200px' }}>Details<input name="detail" style={INP} placeholder="Red house · crest" /></label>
      <label style={{ ...LBL, fontSize: 14, flex: '0 1 80px' }}>Qty<input name="qty" type="number" min="1" required style={INP} /></label>
      <label style={{ ...LBL, fontSize: 14, flex: '0 1 120px' }}>Price each<input name="unit_price" type="number" min="0" required style={INP} /></label>
      {confirmed && <label style={{ ...LBL, fontSize: 14, flex: '1 1 200px' }}>Why? (required)<input name="reason" required style={INP} /></label>}
      <button disabled={busy} style={{ minHeight: 46, padding: '0 18px', fontWeight: 600, color: '#fff', background: '#0E5C63', border: 0, borderRadius: 10, cursor: 'pointer' }}>Add line</button>
      <button type="button" onClick={() => setOpen(false)} style={{ minHeight: 46, padding: '0 14px', fontWeight: 600, color: '#0E5C63', background: '#fff', border: '2px solid #0E5C63', borderRadius: 10, cursor: 'pointer' }}>Cancel</button>
    </form>
  );
}
