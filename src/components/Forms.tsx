'use client';
import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { send } from '@/lib/client';
import { studioUrl } from './ui';

function useSave(after?: (j: any) => void) {
  const [busy, setBusy] = useState(false); const r = useRouter();
  return { busy, run: async (url: string, body: any, method = 'POST') => {
    setBusy(true); const j: any = await send(url, body, method); setBusy(false);
    if (j.ok) { after ? after(j) : r.refresh(); }
    return j;
  } };
}
const fd = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); return Object.fromEntries(new FormData(e.currentTarget) as any) as any; };

const LBL = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, color: '#3F4A58', minWidth: 0 } as const;
const INP = { width: '100%', boxSizing: 'border-box', minHeight: 46, padding: '0 12px', fontSize: 16, color: '#1B2430', background: '#FFFFFF', border: '1px solid #C5CCD5', borderRadius: 10 } as const;
const BTN = { boxSizing: 'border-box', textDecoration: 'none', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, borderRadius: 12, padding: '0 28px', cursor: 'pointer' } as const;
const SEC = { fontSize: 13, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#4B5563' } as const;
const KINDS = [['school', 'School', 'Many items, term orders, one invoice'], ['individual', 'Individual', 'One-off orders, e.g. Ankara'], ['other', 'Business / other', 'Staff wear, clubs, churches']];

export function NewCustomerForm({ existing }: { existing: { id: string; name: string; short_name?: string | null; phone?: string | null; address?: string | null; orders: number }[] }) {
  const r = useRouter(); const s = useSave();
  const [kind, setKind] = useState('school'); const [name, setName] = useState(''); const [phone, setPhone] = useState('');
  const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, '');
  const digits = (x: string) => x.replace(/\D/g, '');
  const matches = existing.filter(c => (norm(name).length >= 3 && (norm(c.name).includes(norm(name)) || norm(name).includes(norm(c.short_name || '~~')) || norm(c.name).startsWith(norm(name).slice(0, 5)))) || (digits(phone).length >= 7 && digits(c.phone || '') === digits(phone))).slice(0, 4);
  const samePhone = matches.some(c => digits(phone).length >= 7 && digits(c.phone || '') === digits(phone));
  const go = (next: boolean) => async (e: React.MouseEvent<HTMLButtonElement>) => {
    const form = e.currentTarget.form!; if (!form.reportValidity()) return;
    const b = { ...(Object.fromEntries(new FormData(form) as any) as any), kind }; const j = await s.run('/api/customers', b, 'POST');
    if (j.ok) r.push(next ? `/customers/${j.id}?start=1` : `/customers/${j.id}`);
  };
  const tile = { background: '#FFFFFF', border: '1px solid #DDE2E8', borderRadius: 14, boxSizing: 'border-box', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 6 } as const;
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <form onSubmit={e => e.preventDefault()} style={{ background: '#FFFFFF', border: '1px solid #DDE2E8', borderRadius: 14, boxSizing: 'border-box', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16, flex: '1 1 560px', minWidth: 0 }}>
        <div style={SEC}>What kind of customer</div>
        <div role="radiogroup" aria-label="Kind of customer" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {KINDS.map(([k, t, d]) => { const on = kind === k; return (
            <button key={k} type="button" role="radio" aria-checked={on} onClick={() => setKind(k)} style={{ flex: '1 1 160px', minHeight: 52, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', textAlign: 'left', padding: '0 14px', borderRadius: 12, border: on ? '2px solid #0E5C63' : '1px solid #C5CCD5', background: on ? '#E3EEF0' : '#FFFFFF', cursor: 'pointer' }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: on ? '#0A4449' : '#1B2430' }}>{t}</span><span style={{ fontSize: 13, color: '#4B5563' }}>{d}</span>
            </button>); })}
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <label style={{ ...LBL, flex: '2 1 260px' }}>Customer name<input name="name" required style={INP} value={name} onChange={e => setName(e.target.value)} /></label>
          <label style={{ ...LBL, flex: '1 1 160px' }}>Short name on lists<input name="short_name" style={INP} /></label>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <label style={{ ...LBL, flex: '1 1 180px' }}>Contact person<input name="contact" style={INP} /></label>
          <label style={{ ...LBL, flex: '1 1 180px' }}>Phone<input name="phone" inputMode="tel" style={INP} value={phone} onChange={e => setPhone(e.target.value)} /></label>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <label style={{ ...LBL, flex: '1 1 220px' }}>Email<input name="email" type="email" style={INP} /></label>
          <label style={{ ...LBL, flex: '1.4 1 260px' }}>Address<input name="address" style={INP} /></label>
        </div>
        {kind !== 'individual' && (
          <label style={LBL}>Payment terms<input name="payment_terms" placeholder="Pay on collection" style={INP} /></label>
        )}
        <label style={LBL}>Notes for the team<textarea name="notes" style={{ ...INP, minHeight: 78, padding: '10px 12px', resize: 'none' }} /></label>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 4, flexWrap: 'wrap' }}>
          <a href="/" style={{ ...BTN, color: '#0E5C63', background: '#FFFFFF', border: '2px solid #0E5C63' }}>Cancel</a>
          <button type="button" disabled={s.busy} onClick={go(false)} style={{ ...BTN, color: '#0E5C63', background: '#FFFFFF', border: '2px solid #0E5C63' }}>Save customer</button>
          <button type="button" disabled={s.busy} onClick={go(true)} style={{ ...BTN, color: '#FFFFFF', background: '#0E5C63', border: 0 }}>Save and start an order</button>
        </div>
      </form>
      <div style={{ flex: '0 1 440px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={tile}>
          <div style={SEC}>Already on the list?</div>
          <div style={{ fontSize: 15, color: '#3F4A58', marginBottom: 4 }}>As you type the name, similar customers show here, so the same school is not added twice.</div>
          {matches.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: i === matches.length - 1 ? 0 : '1px solid #E8ECF0' }}>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}><span style={{ fontWeight: 600, fontSize: 16 }}>{c.name}</span><span style={{ fontSize: 13, color: '#4B5563' }}>{[c.address, c.phone, `${c.orders} ${c.orders === 1 ? 'order' : 'orders'}`].filter(Boolean).join(' · ')}</span></span>
              <a href={`/customers/${c.id}`} style={{ ...BTN, minHeight: 38, padding: '0 16px', fontSize: 14, color: '#0E5C63', background: '#FFFFFF', border: '2px solid #0E5C63' }}>Open</a>
            </div>
          ))}
          {matches.length === 0 && <div style={{ fontSize: 14, color: '#4B5563' }}>{name.length >= 3 ? 'No similar names. Safe to add.' : 'Nothing to compare yet.'}</div>}
          {samePhone && <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 10, background: '#FDE9B0', color: '#5A3A00', fontSize: 14, lineHeight: 1.4 }}><b>Check before saving.</b> One of these has the same phone number as this form.</div>}
        </div>
        <div style={{ ...tile, gap: 8 }}>
          <div style={SEC}>What happens next</div>
          {['The customer gets a profile with an empty order history.', 'Items and prices are filled in on the first order, then remembered for reorders.', 'Nothing is sent to the customer. They are not told they were added.'].map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, fontSize: 15, color: '#3F4A58' }}><span style={{ fontWeight: 700, color: '#0E5C63' }}>{i + 1}</span><span>{t}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NewOrderForm({ customerId }: { customerId: string }) {
  const r = useRouter(); const s = useSave();
  return (
    <form className="card pad" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }} onSubmit={async e => {
      const b = fd(e); const j = await s.run('/api/orders', { ...b, customer_id: customerId });
      if (j.ok) r.push(`/orders/${j.id}`);
    }}>
      <label className="f" style={{ flex: '2 1 240px' }}>New order<input className="i" name="name" placeholder="e.g. First term 2027 intake" required /></label>
      <label className="f">Due date<input className="i" name="due" type="date" required /></label>
      <button className="btn pri" disabled={s.busy}>Start order</button>
    </form>
  );
}

export function StageButtons({ id, stage, stages }: { id: string; stage: string; stages: string[] }) {
  const s = useSave();
  return <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{stages.map(st => <button key={st} className={'btn sm' + (st === stage ? ' pri' : '')} disabled={s.busy} aria-pressed={st === stage} onClick={() => st !== stage && s.run(`/api/orders/${id}`, { stage: st }, 'PATCH')}>{st}</button>)}</div>;
}

export function AddLine({ id, items, confirmed }: { id: string; items: { item: string; standard: number }[]; confirmed: boolean }) {
  const s = useSave(); const [price, setPrice] = useState('');
  return (
    <form className="row" style={{ background: '#FAFBFC', alignItems: 'flex-end' }} onSubmit={async e => {
      const f = e.currentTarget; const b = fd(e); const j = await s.run(`/api/orders/${id}/lines`, b); if (j.ok) { f.reset(); setPrice(''); }
    }}>
      <label className="f" style={{ flex: '2 1 220px' }}>Item<input className="i" name="item" list="garments" required onChange={e => { const m = items.find(x => x.item === e.target.value); if (m) setPrice(String(m.standard)); }} /></label>
      <datalist id="garments">{items.map(i => <option key={i.item} value={i.item} />)}</datalist>
      <label className="f" style={{ flex: '2 1 200px' }}>Details<input className="i" name="detail" placeholder="Red house · crest, left chest" /></label>
      <label className="f" style={{ flex: '0 1 90px' }}>Qty<input className="i" name="qty" type="number" min="1" required /></label>
      <label className="f" style={{ flex: '0 1 130px' }}>Price each<input className="i" name="unit_price" type="number" min="0" required value={price} onChange={e => setPrice(e.target.value)} /></label>
      <label className="f" style={{ flex: '1 1 180px' }}>Sizes (optional)<input className="i" name="sizes" placeholder="6:2, 8:3, 10:3" /></label>
      {confirmed && <label className="f" style={{ flex: '1 1 200px' }}>Why? (required)<input className="i" name="reason" required /></label>}
      <button className="btn pri" disabled={s.busy}>Add line</button>
    </form>
  );
}

export function EditLine({ orderId, line, confirmed }: { orderId: string; line: any; confirmed: boolean }) {
  const s = useSave(); const [open, setOpen] = useState(false);
  if (!open) return <button className="btn sm" onClick={() => setOpen(true)}>Edit</button>;
  return (
    <form style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', width: '100%', padding: '10px 0' }} onSubmit={async e => { const b = fd(e); const j = await s.run(`/api/orders/${orderId}/lines`, { ...b, line_id: line.id }, 'PATCH'); if (j.ok) setOpen(false); }}>
      <label className="f" style={{ flex: '0 1 90px' }}>Qty<input className="i" name="qty" type="number" min="0" defaultValue={line.qty} /></label>
      <label className="f" style={{ flex: '0 1 130px' }}>Price each<input className="i" name="unit_price" type="number" min="0" defaultValue={line.unit_price} /></label>
      {confirmed && <label className="f" style={{ flex: '1 1 220px' }}>Why is it changing? (required)<input className="i" name="reason" required /></label>}
      <button className="btn pri sm" disabled={s.busy}>Save change</button>
      <button type="button" className="btn sm" onClick={() => setOpen(false)}>Cancel</button>
      <span className="small mut" style={{ flexBasis: '100%' }}>Set quantity to 0 to remove the line.</span>
    </form>
  );
}

export function PaymentForm({ customerId, owed }: { customerId: string; owed: number }) {
  const s = useSave();
  return (
    <form className="card pad" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }} onSubmit={async e => { const f = e.currentTarget; const j = await s.run('/api/payments', { ...fd(e), customer_id: customerId }); if (j.ok) f.reset(); }}>
      <label className="f">Amount received (₦)<input className="i" name="amount" type="number" min="1" max={owed} required /></label>
      <label className="f">How paid<select className="i" name="method"><option>Transfer</option><option>Cash</option><option>POS</option><option>Cheque</option></select></label>
      <button className="btn pri" disabled={s.busy || owed <= 0}>Record payment</button>
      <span className="small mut" style={{ flexBasis: '100%' }}>It is applied to the oldest unpaid order first.</span>
    </form>
  );
}

export function DeliveryForm({ items }: { items: { id: string; name: string; unit: string; on_hand: number; reserved: number; cost: number | null }[] }) {
  const s = useSave(); const r = useRouter();
  const blank = () => ({ id: '', qty: '', cost: '' });
  const [rows, setRows] = useState([blank()]); const [supplier, setSupplier] = useState(''); const [invoice, setInvoice] = useState(''); const [note, setNote] = useState(''); const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const it = (id: string) => items.find(i => i.id === id);
  const set = (i: number, k: string, v: string) => setRows(rows.map((x, j) => j === i ? { ...x, [k]: v, ...(k === 'id' ? { cost: String(it(v)?.cost || '') } : {}) } : x));
  const num = (x: string) => Math.max(0, Number(x) || 0);
  const total = rows.reduce((t, x) => t + num(x.qty) * num(x.cost), 0);
  const eff: Record<string, number> = {}; for (const x of rows) if (x.id && num(x.qty) > 0) eff[x.id] = (eff[x.id] || 0) + num(x.qty);
  const m = (x: number) => '₦' + Math.round(x).toLocaleString('en-NG');
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <form onSubmit={async e => { e.preventDefault(); const lines = rows.filter(x => x.id && num(x.qty) > 0).map(x => ({ item_id: x.id, qty: num(x.qty), unit_cost: num(x.cost) })); const j = await s.run('/api/stock', { supplier, invoice, date, note, lines }); if (j.ok) r.push('/stock'); }}
        style={{ flex: '1 1 600px', minWidth: 0, background: '#FFFFFF', border: '1px solid #DDE2E8', borderRadius: 14, boxSizing: 'border-box', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <label style={{ ...LBL, flex: '2 1 240px' }}>Supplier<input style={INP} value={supplier} onChange={e => setSupplier(e.target.value)} /></label>
          <label style={{ ...LBL, flex: '1 1 150px' }}>Date received<input type="date" style={INP} value={date} onChange={e => setDate(e.target.value)} /></label>
          <label style={{ ...LBL, flex: '1 1 150px' }}>Their invoice number<input style={INP} value={invoice} onChange={e => setInvoice(e.target.value)} /></label>
        </div>
        <div style={SEC}>What arrived</div>
        {rows.map((x, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', paddingBottom: 12, borderBottom: '1px solid #E8ECF0' }}>
            <label style={{ ...LBL, flex: '3 1 220px' }}>Item<select style={INP} value={x.id} onChange={e => set(i, 'id', e.target.value)}><option value="" disabled>Choose…</option>{items.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
            <label style={{ ...LBL, flex: '0 1 110px' }}>Quantity<input type="number" min="0" step="any" style={INP} value={x.qty} onChange={e => set(i, 'qty', e.target.value)} /></label>
            <label style={{ ...LBL, flex: '0 1 90px' }}>Unit<input style={{ ...INP, background: '#F4F6F8' }} value={it(x.id)?.unit || ''} readOnly tabIndex={-1} /></label>
            <label style={{ ...LBL, flex: '0 1 130px' }}>Cost each<input type="number" min="0" style={INP} value={x.cost} onChange={e => set(i, 'cost', e.target.value)} /></label>
            <span style={{ flex: '0 0 110px', textAlign: 'right', fontWeight: 700, fontSize: 17, minHeight: 46, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{m(num(x.qty) * num(x.cost))}</span>
          </div>
        ))}
        <button type="button" onClick={() => setRows([...rows, blank()])} style={{ alignSelf: 'flex-start', background: 'none', border: 0, padding: 0, fontSize: 16, fontWeight: 600, color: '#0E5C63', textDecoration: 'underline', cursor: 'pointer' }}>+ Add another item</button>
        <label style={LBL}>Note<input style={INP} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Short delivery, 10 m still to come" /></label>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ color: '#3F4A58' }}>Total of this delivery <b style={{ fontSize: 20, color: '#1B2430' }}>{m(total)}</b></span>
          <span style={{ display: 'flex', gap: 12 }}>
            <a href="/stock" style={{ ...BTN, color: '#0E5C63', background: '#fff', border: '2px solid #0E5C63' }}>Cancel</a>
            <button disabled={s.busy || Object.keys(eff).length === 0} style={{ ...BTN, color: '#fff', background: Object.keys(eff).length ? '#0E5C63' : '#8AA7AA', border: 0 }}>Save delivery</button>
          </span>
        </div>
      </form>
      <div style={{ flex: '1 1 340px', maxWidth: 440, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={SEC}>What saving will do</div>
          {Object.keys(eff).length === 0 && <div style={{ fontSize: 15, color: '#4B5563' }}>Pick an item and a quantity to see what changes.</div>}
          {Object.entries(eff).map(([id, q]) => { const o = it(id)!; const after = o.on_hand + q; const free = after - o.reserved; return (
            <div key={id} style={{ paddingBottom: 10, borderBottom: '1px solid #E8ECF0' }}>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{o.name}</div>
              <div style={{ fontSize: 15, color: '#3F4A58' }}>on hand {o.on_hand} {o.unit === 'metres' ? 'm' : ''} → <b style={{ color: '#1B2430' }}>{after} {o.unit === 'metres' ? 'm' : ''}</b></div>
              <div style={{ fontSize: 14, color: free >= 0 ? '#14532D' : '#8A1C13' }}>Reserved {o.reserved}. {free >= 0 ? `${free} available after the delivery.` : `Still short by ${-free} after the delivery.`}</div>
            </div>); })}
        </div>
        <div style={{ background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, padding: '16px 20px', fontSize: 15, color: '#3F4A58', lineHeight: 1.45 }}>Each line is added to the item&apos;s history with this invoice number, so a miscount can be traced to the delivery.</div>
      </div>
    </div>
  );
}

export function NewStockItemForm() {
  const s = useSave();
  return (
    <form className="card pad" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }} onSubmit={async e => { const f = e.currentTarget; const j = await s.run('/api/stock/items', fd(e)); if (j.ok) f.reset(); }}>
      <label className="f" style={{ flex: '2 1 220px' }}>New stock item<input className="i" name="name" required placeholder="e.g. Navy twill" /></label>
      <label className="f">Type<select className="i" name="type"><option>Fabric</option><option>Badges</option><option>Thread</option><option>Other</option></select></label>
      <label className="f">Counted in<select className="i" name="unit"><option>metres</option><option>pieces</option><option>cones</option></select></label>
      <label className="f">Warn me below<input className="i" name="warn_below" type="number" min="0" /></label>
      <button className="btn" disabled={s.busy}>Add item</button>
    </form>
  );
}

export function DiscountForm({ id, discount }: { id: string; discount: number }) {
  const s = useSave(); const [edit, setEdit] = useState(false);
  if (!edit) return <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="mut">Discount <button className="small" style={{ background: 'none', border: 0, color: 'var(--teal)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setEdit(true)}>change</button></span><span>{discount > 0 ? '−₦' + discount.toLocaleString('en-NG') : '₦0'}</span></div>;
  return <form style={{ display: 'flex', gap: 8 }} onSubmit={async e => { const b = fd(e); const j = await s.run(`/api/orders/${id}`, { discount: b.discount }, 'PATCH'); if (j.ok) setEdit(false); }}><input className="i" name="discount" type="number" min="0" defaultValue={discount} aria-label="Discount in naira" /><button className="btn pri sm" disabled={s.busy}>Save</button></form>;
}

export function ReorderPicker({ from, lines }: { from: string; lines: { id: number; item: string; detail: string; qty: number; old: number; now: number | null }[] }) {
  const s = useSave(); const r = useRouter();
  const [q, setQ] = useState<Record<number, number>>(Object.fromEntries(lines.map(l => [l.id, l.qty])));
  const [on, setOn] = useState<Record<number, boolean>>(Object.fromEntries(lines.map(l => [l.id, true])));
  const total = lines.reduce((t, l) => t + (on[l.id] ? q[l.id] * (l.now ?? l.old) : 0), 0), count = lines.filter(l => on[l.id]).length;
  const n = (x: number) => '₦' + x.toLocaleString('en-NG');
  return (
    <form onSubmit={async e => { const b = fd(e); const j = await s.run('/api/orders/reorder', { from, name: b.name, due: b.due, lines: lines.filter(l => on[l.id]).map(l => ({ line_id: l.id, qty: q[l.id] })) }); if (j.ok) r.push(`/orders/${j.id}`); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card">
        {lines.map(l => (
          <div key={l.id} className="row" style={{ opacity: on[l.id] ? 1 : .55 }}>
            <input type="checkbox" checked={on[l.id]} onChange={e => setOn({ ...on, [l.id]: e.target.checked })} aria-label={`Include ${l.item}`} style={{ width: 22, height: 22 }} />
            <span className="grow"><span className="b">{l.item}</span><div className="small mut">{l.detail}</div></span>
            <input className="i" type="number" min="0" value={q[l.id]} onChange={e => setQ({ ...q, [l.id]: Number(e.target.value) })} aria-label="Quantity" style={{ width: 90 }} />
            <span className="right" style={{ width: 150 }}>{l.now != null && l.now !== l.old ? <><s className="mut">{n(l.old)}</s> <b>{n(l.now)}</b></> : n(l.now ?? l.old)}</span>
          </div>
        ))}
      </div>
      <div className="card pad" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label className="f" style={{ flex: '2 1 240px' }}>New order name<input className="i" name="name" placeholder="Reorder" /></label>
        <label className="f">Due date<input className="i" name="due" type="date" /></label>
        <div className="right"><div className="small mut">{count} lines at today's prices</div><div style={{ fontSize: 22, fontWeight: 700 }}>{n(total)}</div></div>
        <button className="btn pri" disabled={s.busy || count === 0}>Create draft with {count} lines</button>
      </div>
    </form>
  );
}

export function PriceRow({ item, standard, price, customerId, reason }: { item: string; standard: number; price: number; customerId?: string; reason?: string }) {
  const s = useSave(); const [v, setV] = useState(String(price)); const [rs, setRs] = useState(reason || '');
  const dirty = Number(v) !== price;
  return (
    <div className="row">
      <span className="grow b">{item}</span>
      {customerId && <span style={{ width: 120 }} className="right mut">₦{standard.toLocaleString('en-NG')}</span>}
      <input className="i" type="number" min="0" value={v} onChange={e => setV(e.target.value)} aria-label={`Price for ${item}`} style={{ width: 130 }} />
      {customerId && <input className="i" placeholder="Why different?" value={rs} onChange={e => setRs(e.target.value)} style={{ width: 170 }} aria-label="Reason" />}
      <button className={'btn sm' + (dirty ? ' pri' : '')} disabled={s.busy || !dirty} onClick={() => s.run('/api/setup', { kind: 'price', item, price: v, customer_id: customerId, reason: rs })}>Save</button>
    </div>
  );
}
export function NewPriceForm({ customerId }: { customerId?: string }) {
  const s = useSave();
  return (
    <form className="row" style={{ background: '#FAFBFC' }} onSubmit={async e => { const f = e.currentTarget; const j = await s.run('/api/setup', { ...fd(e), kind: 'price', customer_id: customerId }); if (j.ok) f.reset(); }}>
      <label className="f" style={{ flex: '2 1 200px' }}>Item<input className="i" name="item" required placeholder="e.g. Prefect blazer" /></label>
      <label className="f" style={{ flex: '0 1 140px' }}>Price (₦)<input className="i" name="price" type="number" min="0" required /></label>
      <button className="btn pri" disabled={s.busy}>{customerId ? 'Add school price' : 'Add item'}</button>
    </form>
  );
}

export function GarmentForm({ g, stockNames, stockMeta, price }: { g: any; stockNames: string[]; stockMeta: Record<string, { type: string; unit: string }>; price?: number | null }) {
  const s = useSave(); const r = useRouter();
  const SIZES = ['6', '8', '10', '12', '14', '16', '18'];
  const [name, setName] = useState(g?.name || ''); const [kind, setKind] = useState(g?.kind || ''); const [cloth, setCloth] = useState(g?.cloth || '');
  const [sizes, setSizes] = useState<string[]>((g?.sizes || []).map(String));
  const [rec, setRec] = useState<{ item: string; qty: string }[]>((g?.stock_per_piece || []).map((x: any) => ({ item: x.item, qty: String(x.qty) })));
  const [pl, setPl] = useState<{ place: string; what: string; method: string }[]>((g?.placements || []).map((p: any) => ({ place: p.place, what: p.what, method: p.method })));
  const allSizes = Array.from(new Set([...SIZES, ...sizes]));
  const toggle = (z: string) => setSizes(sizes.includes(z) ? sizes.filter(x => x !== z) : [...sizes, z].sort((a, b) => Number(a) - Number(b)));
  const flat = { border: 0, borderBottom: '1px solid #E8ECF0', borderRadius: 0, background: 'transparent', minHeight: 40, padding: '0 4px', fontSize: 16, width: '100%' } as const;
  const tile = { background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 10 } as const;
  const firstRec = rec.find(x => x.item && Number(x.qty) > 0);
  return (
    <form onSubmit={async e => {
      e.preventDefault();
      const j = await s.run('/api/setup', { kind: 'garment', name, kind_of: kind, cloth, sizes, placements: pl.filter(p => p.place).map((p, i) => ({ no: i + 1, ...p })), recipe: rec.filter(x => x.item && x.qty) });
      if (j.ok) r.push('/setup/garments?g=' + encodeURIComponent(name));
    }} style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 0 }}>
      <div style={{ ...tile, gap: 14 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <label style={{ ...LBL, flex: '2 1 240px' }}>Garment name<input style={INP} value={name} onChange={e => setName(e.target.value)} required readOnly={!!g} /></label>
          <label style={{ ...LBL, flex: '1 1 160px' }}>Kind<input style={INP} value={kind} onChange={e => setKind(e.target.value)} placeholder="Shirt, dress / skirt…" /></label>
          <label style={{ ...LBL, flex: '1 1 160px' }}>Main cloth
            <select style={INP} value={cloth} onChange={e => setCloth(e.target.value)}><option value="">None</option>{stockNames.filter(n => stockMeta[n]?.type === 'Fabric').map(n => <option key={n}>{n}</option>)}{cloth && !stockNames.includes(cloth) && <option>{cloth}</option>}</select>
          </label>
        </div>
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={LBL}>Sizes offered
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{allSizes.map(z => { const on = sizes.includes(z); return <button key={z} type="button" aria-pressed={on} onClick={() => toggle(z)} style={{ minWidth: 48, minHeight: 38, padding: '0 8px', fontSize: 16, fontWeight: 700, color: on ? '#fff' : '#3F4A58', background: on ? '#0E5C63' : '#fff', border: on ? 0 : '1px solid #C5CCD5', borderRadius: 10, cursor: 'pointer' }}>{z}</button>; })}</div>
          </div>
          {g && price != null && <div style={LBL}>Standard price<span style={{ fontSize: 22, fontWeight: 700, color: '#1B2430' }}>₦{price.toLocaleString('en-NG')} <a href="/setup" style={{ fontSize: 15, fontWeight: 600, marginLeft: 6 }}>Change in Prices</a></span></div>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ ...tile, flex: '1.4 1 440px', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={SEC}>Where things can go</span><button type="button" onClick={() => setPl([...pl, { place: '', what: '', method: '' }])} style={{ background: 'none', border: 0, padding: 0, color: '#0E5C63', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', fontSize: 15 }}>+ Add a place</button></div>
          {pl.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #E8ECF0', paddingBottom: 4 }}>
              <span style={{ flex: '0 0 30px', width: 30, height: 30, borderRadius: '50%', border: '2px solid #1B2430', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>{i + 1}</span>
              {(['place', 'what', 'method'] as const).map(k => <input key={k} aria-label={k} placeholder={{ place: 'Place (Bib)', what: 'What (School crest)', method: 'How (Sew-on badge)' }[k]} value={p[k]} onChange={e => setPl(pl.map((x, j) => j === i ? { ...x, [k]: e.target.value } : x))} style={{ ...flat, flex: 1, fontWeight: k === 'place' ? 700 : 400 }} />)}
              <button type="button" onClick={() => setPl(pl.filter((_, j) => j !== i))} style={{ background: 'none', border: 0, color: '#0E5C63', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>Remove</button>
            </div>))}
          <span style={{ fontSize: 14, color: '#4B5563' }}>These are the numbered places on the production sheet and the 3D studio.</span>
        </div>
        <div style={{ ...tile, flex: '1 1 340px', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={SEC}>Taken from stock for each one</span><button type="button" onClick={() => setRec([...rec, { item: '', qty: '' }])} style={{ background: 'none', border: 0, padding: 0, color: '#0E5C63', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', fontSize: 15 }}>+ Add</button></div>
          <datalist id="stocknames">{stockNames.map(n => <option key={n} value={n} />)}</datalist>
          {rec.map((x, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #E8ECF0', paddingBottom: 4 }}>
              <input list="stocknames" aria-label="Stock item" placeholder="Stock item" value={x.item} onChange={e => setRec(rec.map((y, j) => j === i ? { ...y, item: e.target.value } : y))} style={{ ...flat, flex: 2, fontWeight: 700 }} />
              <span style={{ flex: '0 0 70px', color: '#4B5563' }}>{stockMeta[x.item]?.type || ''}</span>
              <input type="number" step="any" min="0" aria-label="Amount per piece" placeholder="Each" value={x.qty} onChange={e => setRec(rec.map((y, j) => j === i ? { ...y, qty: e.target.value } : y))} style={{ ...flat, flex: '0 0 80px', textAlign: 'right', fontWeight: 700 }} />
              <button type="button" onClick={() => setRec(rec.filter((_, j) => j !== i))} aria-label="Remove" style={{ background: 'none', border: 0, color: '#4B5563', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>))}
          {firstRec && <span style={{ fontSize: 14, color: '#4B5563' }}>A line of 10 {name.toLowerCase()}s reserves {Math.round(Number(firstRec.qty) * 10 * 100) / 100} {stockMeta[firstRec.item]?.unit === 'metres' ? 'm' : ''} of {firstRec.item.toLowerCase()}.</span>}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <a href={`/studio/index.html?item=${encodeURIComponent(name)}`} target="_blank" rel="noreferrer" style={{ ...BTN, color: '#0E5C63', background: '#fff', border: '2px solid #0E5C63' }}>Open in the 3D studio</a>
        <span style={{ display: 'flex', gap: 12 }}>
          <a href="/setup/garments" style={{ ...BTN, color: '#0E5C63', background: '#fff', border: '2px solid #0E5C63' }}>Cancel</a>
          <button disabled={s.busy} style={{ ...BTN, color: '#fff', background: '#0E5C63', border: 0 }}>Save garment</button>
        </span>
      </div>
    </form>
  );
}

export function HouseForm({ customerId }: { customerId: string }) {
  const s = useSave();
  return (
    <form className="row" style={{ background: '#FAFBFC' }} onSubmit={async e => { const f = e.currentTarget; const j = await s.run('/api/setup', { ...fd(e), kind: 'house', customer_id: customerId }); if (j.ok) f.reset(); }}>
      <label className="f" style={{ flex: '1 1 140px' }}>House<input className="i" name="house" required placeholder="Green house" /></label>
      <label className="f" style={{ flex: '0 1 90px' }}>Colour<input className="i" name="colour" type="color" defaultValue="#2E7D4F" style={{ padding: 4 }} /></label>
      <label className="f" style={{ flex: '1 1 160px' }}>Jersey cloth<input className="i" name="jersey" placeholder="Green house jersey" /></label>
      <label className="f" style={{ flex: '1 1 160px' }}>House badge<input className="i" name="badge" placeholder="Green house badge" /></label>
      <button className="btn pri" disabled={s.busy}>Add house</button>
    </form>
  );
}
export function DeleteBtn({ table, id, label }: { table: string; id: number; label: string }) {
  const s = useSave();
  return <button className="btn sm" disabled={s.busy} onClick={() => { if (confirm(`Remove ${label}?`)) s.run('/api/setup', { kind: 'delete', table, id }); }}>Remove</button>;
}
export function CrestForm({ customerId }: { customerId: string }) {
  const s = useSave();
  return (
    <form className="row" style={{ background: '#FAFBFC' }} onSubmit={async e => { const f = e.currentTarget; const j = await s.run('/api/setup', { ...fd(e), kind: 'crest', customer_id: customerId }); if (j.ok) f.reset(); }}>
      <label className="f" style={{ flex: '1 1 140px' }}>Crest<input className="i" name="name" required placeholder="School crest" /></label>
      <label className="f" style={{ flex: '1 1 160px' }}>Used on<input className="i" name="used_on" /></label>
      <label className="f" style={{ flex: '1 1 160px' }}>Badge stock item<input className="i" name="badge" /></label>
      <button className="btn pri" disabled={s.busy}>Add crest</button>
    </form>
  );
}

/** "New blank order" button on the customer page: opens a small name and due-date card. */
export function NewBlankOrder({ customerId, start }: { customerId: string; start?: boolean }) {
  const r = useRouter(); const s = useSave(); const [open, setOpen] = useState(!!start);
  const btn = { textDecoration: 'none', minHeight: 48, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 600, color: '#0E5C63', background: '#FFFFFF', border: '2px solid #0E5C63', borderRadius: 12, cursor: 'pointer' } as const;
  return (
    <>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} style={btn}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0E5C63" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>New blank order
      </button>
      {open && (
        <form style={{ flexBasis: '100%', background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }} onSubmit={async e => {
          const b = fd(e); const j = await s.run('/api/orders', { ...b, customer_id: customerId }); if (j.ok) r.push(`/orders/${j.id}`);
        }}>
          <label className="f" style={{ flex: '2 1 240px' }}>Order name<input className="i" name="name" placeholder="e.g. First term 2027 intake" required autoFocus /></label>
          <label className="f">Due date<input className="i" name="due" type="date" required /></label>
          <button className="btn pri" disabled={s.busy}>Start order</button>
        </form>
      )}
    </>
  );
}

/** "Use in new order" on a saved design: starts a draft with that garment on it. */
export function UseDesign({ customerId, item, detail, price, fromOrder, fromLine }: { customerId: string; item: string; detail: string; price: number; fromOrder?: string; fromLine?: number }) {
  const r = useRouter(); const s = useSave();
  return <button type="button" disabled={s.busy} style={{ minHeight: 44, fontSize: 14, fontWeight: 600, color: '#0E5C63', background: '#FFFFFF', border: '2px solid #0E5C63', borderRadius: 10, cursor: 'pointer' }} onClick={async () => {
    const j = await s.run('/api/orders', { customer_id: customerId, name: 'New order' }); if (!j.ok) return;
    const k = await s.run(`/api/orders/${j.id}/lines`, { item, detail, qty: 1, unit_price: price }); if (!k.ok) return;
    // carry the saved 3D mockup over to the new line so it opens exactly as it was made
    if (fromOrder && fromLine && k.id) {
      try {
        const src: any = await fetch(`/api/orders/${fromOrder}/lines/${fromLine}`).then(x => x.ok ? x.json() : null);
        if (src?.design) await fetch(`/api/orders/${j.id}/lines/${k.id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ design: src.design }) });
      } catch { /* the line still exists without the mockup */ }
    }
    r.push(`/orders/${j.id}`);
  }}>Use in new order</button>;
}

/** The 3D studio's own four garment models. Matches pickGarment() in public/studio/index.html, so whichever
 * catalog item we seed the line with is guaranteed to open on the right model, not fall back to the tee. */
const STUDIO_GARMENTS: { label: string; match: RegExp; fallback: string }[] = [
  { label: 'Top', match: /tee|shirt|polo|jersey|top/i, fallback: 'Top' },
  { label: 'Shorts', match: /short/i, fallback: 'Shorts' },
  { label: 'Trousers', match: /trouser|pant/i, fallback: 'Trousers' },
  { label: 'Ankara', match: /ankara/i, fallback: 'Ankara shirt' },
];
/** Sketch a brand new design live with the customer: starts a one-line draft and jumps straight into the 3D studio,
 * skipping the usual order name, due date and quantity so there's nothing between "pick a garment" and showing it to them.
 * Four explicit buttons rather than a dropdown over the full price list, which mixes in accessories (cap badges, ties)
 * that have no 3D model, and could be submitted without the staff member meaning to pick one. */
export function NewDesignButton({ customerId, items }: { customerId: string; items: { item: string; price: number }[] }) {
  const r = useRouter(); const s = useSave(); const [open, setOpen] = useState(false);
  const btn = { textDecoration: 'none', minHeight: 44, padding: '0 16px', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#0E5C63', background: '#FFFFFF', border: '2px solid #0E5C63', borderRadius: 8, cursor: 'pointer' } as const;
  const go = async (g: typeof STUDIO_GARMENTS[number]) => {
    const found = items.find(i => g.match.test(i.item));
    const item = found?.item ?? g.fallback, price = found?.price ?? 0;
    const j = await s.run('/api/orders', { customer_id: customerId, name: `New design · ${item}` }); if (!j.ok) return;
    const k = await s.run(`/api/orders/${j.id}/lines`, { item, qty: 1, unit_price: price }); if (!k.ok) return;
    r.push(studioUrl(j.id, k.id, item));
  };
  return (
    <>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} style={btn}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0E5C63" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>New design
      </button>
      {open && (
        <div style={{ flexBasis: '100%', background: '#fff', border: '1px solid #DDE2E8', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, color: '#4B5563' }}>Garment</span>
          {STUDIO_GARMENTS.map(g => (
            <button key={g.label} type="button" disabled={s.busy} onClick={() => go(g)} style={{ minHeight: 44, padding: '0 18px', fontSize: 14, fontWeight: 600, color: '#0E5C63', background: '#FFFFFF', border: '2px solid #0E5C63', borderRadius: 8, cursor: 'pointer' }}>{g.label}</button>
          ))}
        </div>
      )}
    </>
  );
}

/** Stage steps along the top of an order. Anyone can move the order; the big button takes it to the next stage. */
export function StageStepper({ id, stage }: { id: string; stage: string }) {
  const s = useSave();
  const steps = ['Confirmed', 'In production', 'Ready', 'Collected']; const labels = ['Confirmed', 'In production', 'Ready', 'Delivered'];
  const at = steps.indexOf(stage); const next = ['Start production', 'Mark as ready', 'Mark as delivered'][at];
  const go = (st: string) => !s.busy && st !== stage && s.run(`/api/orders/${id}`, { stage: st }, 'PATCH');
  return (
    <section aria-label="Order stages" style={{ background: '#FFFFFF', border: '1px solid #DDE2E8', borderRadius: 14, padding: '14px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px 24px' }}>
      <ol style={{ flex: '1 1 520px', minWidth: 0, margin: 0, padding: 0, listStyle: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
        {steps.map((st, i) => {
          const done = i < at, cur = i === at;
          return (<Fragment key={st}>
            {i > 0 && <li key={'b' + i} aria-hidden="true" style={{ flex: '1 1 24px', minWidth: 16, height: 3, borderRadius: 2, background: i <= at ? '#0E5C63' : '#D5DBE2' }} />}
            <li key={st} aria-current={cur ? 'step' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" onClick={() => go(st)} aria-label={`Move to ${labels[i]}`} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit' }}>
                {done ? <span style={{ flex: '0 0 auto', width: 26, height: 26, borderRadius: '50%', background: '#0E5C63', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
                  : cur ? <span style={{ flex: '0 0 auto', width: 26, height: 26, boxSizing: 'border-box', borderRadius: '50%', border: '3px solid #0E5C63', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0E5C63' }} /></span>
                    : <span style={{ flex: '0 0 auto', width: 26, height: 26, boxSizing: 'border-box', borderRadius: '50%', border: '2px solid #B8C0CA', background: '#FFFFFF' }} />}
                <span style={{ fontSize: 15, fontWeight: cur ? 700 : done ? 600 : 500, color: cur ? '#0E5C63' : done ? '#1B2430' : '#4B5563' }}>{labels[i]}</span>
              </button>
            </li>
          </Fragment>);
        })}
      </ol>
      {next && <button type="button" disabled={s.busy} onClick={() => go(steps[at + 1])} style={{ minHeight: 48, padding: '0 22px', fontSize: 15, fontWeight: 600, color: '#FFFFFF', background: '#0E5C63', border: 0, borderRadius: 12, cursor: 'pointer' }}>{next}</button>}
    </section>
  );
}

/** "Adjust" on the Price card: set the discount for the whole order. */
export function PriceAdjust({ id, discount }: { id: string; discount: number }) {
  const s = useSave(); const [edit, setEdit] = useState(false);
  if (!edit) return <button type="button" onClick={() => setEdit(true)} style={{ minHeight: 44, padding: '0 12px', fontSize: 14, fontWeight: 600, color: '#0E5C63', background: '#FFFFFF', border: 0, cursor: 'pointer' }}>Adjust</button>;
  return (
    <form style={{ display: 'flex', gap: 8, alignItems: 'center' }} onSubmit={async e => { const b = fd(e); const j = await s.run(`/api/orders/${id}`, { discount: b.discount }, 'PATCH'); if (j.ok) setEdit(false); }}>
      <label style={{ fontSize: 13, color: '#4B5563' }}>Discount ₦<input className="i" name="discount" type="number" min="0" defaultValue={discount} style={{ width: 120, marginLeft: 6, minHeight: 40 }} autoFocus /></label>
      <button className="btn pri sm" disabled={s.busy}>Save</button>
    </form>
  );
}
