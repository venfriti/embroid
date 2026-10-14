'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { send } from '@/lib/client';

export function SetupTabs() {
  const p = usePathname();
  const tabs: [string, string, boolean][] = [['Prices', '/setup', p === '/setup'], ['Garments', '/setup/garments', p.startsWith('/setup/garments')], ['Houses and crests', '/setup/houses', p.startsWith('/setup/houses')]];
  return <div style={{ display: 'inline-flex', gap: 4, padding: 4, background: '#E6EAEE', borderRadius: 12, alignSelf: 'flex-start', flexWrap: 'wrap' }}>{tabs.map(([n, h, on]) => <Link key={h} href={h} aria-current={on ? 'page' : undefined} style={{ minHeight: 44, padding: '0 18px', display: 'flex', alignItems: 'center', fontSize: 15, fontWeight: on ? 700 : 500, textDecoration: 'none', color: on ? '#0E5C63' : '#3F4A58', background: on ? '#fff' : 'transparent', borderRadius: 9 }}>{n}</Link>)}</div>;
}

export function ListPicker({ label, value, options, base }: { label: string; value: string; options: [string, string][]; base: string }) {
  const r = useRouter();
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 15, color: '#3F4A58', alignSelf: 'flex-start' }}>{label}
      <select value={value} onChange={e => r.push(e.target.value ? `${base}?c=${e.target.value}` : base)} style={{ width: 340, maxWidth: '100%', minHeight: 46, padding: '0 12px', fontSize: 17, color: '#1B2430', background: '#fff', border: '1px solid #C5CCD5', borderRadius: 10 }}>
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </label>
  );
}

type Row = { item: string; standard: number; price: number; reason: string };
/** One table of prices. Edited rows are highlighted. Nothing changes until "Save prices". */
export function PricesEditor({ rows, customerId, shortName, picker }: { rows: Row[]; customerId?: string; shortName?: string; picker?: React.ReactNode }) {
  const r = useRouter();
  const [v, setV] = useState<Record<string, string>>({}); const [why, setWhy] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false);
  const cur = (x: Row) => v[x.item] ?? String(x.price);
  const changed = rows.filter(x => Number(cur(x)) !== x.price || (why[x.item] !== undefined && why[x.item] !== x.reason));
  const save = async () => {
    setBusy(true);
    for (const x of changed) { const j: any = await send('/api/setup', { kind: 'price', item: x.item, price: cur(x), customer_id: customerId, reason: why[x.item] ?? x.reason }); if (!j.ok) { setBusy(false); return; } }
    setBusy(false); setV({}); setWhy({}); r.refresh();
  };
  const n = (x: number) => '₦' + x.toLocaleString('en-NG');
  return (
    <>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>{picker}
        <button type="button" disabled={!changed.length} onClick={() => { setV({}); setWhy({}); }} style={{ minHeight: 48, padding: '0 28px', fontSize: 17, fontWeight: 600, color: '#0E5C63', background: '#fff', border: '2px solid #0E5C63', borderRadius: 12, cursor: 'pointer' }}>Discard</button>
        <button type="button" disabled={!changed.length || busy} onClick={save} style={{ minHeight: 48, padding: '0 28px', fontSize: 17, fontWeight: 600, color: '#fff', background: changed.length ? '#0E5C63' : '#8AA7AA', border: 0, borderRadius: 12, cursor: changed.length ? 'pointer' : 'default' }}>Save prices</button>
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 560px', minWidth: 0, background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', background: '#EEF1F4', fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#4B5563' }}>
            <span style={{ flex: 1 }}>Item</span>{customerId && <span style={{ flex: '0 0 130px', textAlign: 'right' }}>Standard price</span>}<span style={{ flex: '0 0 120px', textAlign: 'right' }}>{customerId ? `${shortName} price` : 'Price'}</span>{customerId && <span style={{ flex: '0 0 150px', textAlign: 'right' }}>Why different</span>}
          </div>
          {rows.length === 0 && <div style={{ padding: 18, color: '#4B5563' }}>No prices yet. Add the first item below.</div>}
          {rows.map(x => { const val = Number(cur(x)); const diff = customerId && val !== x.standard; const dirty = val !== x.price || (why[x.item] !== undefined && why[x.item] !== x.reason); return (
            <div key={x.item} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 18px', minHeight: 43, borderTop: '1px solid #E8ECF0', background: diff ? '#FFFBEA' : '#fff' }}>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 16 }}>{x.item}</span>
              {customerId && <span style={{ flex: '0 0 130px', textAlign: 'right', color: '#4B5563' }}>{n(x.standard)}</span>}
              <span style={{ flex: '0 0 120px', display: 'flex', justifyContent: 'flex-end' }}><input inputMode="numeric" aria-label={`Price for ${x.item}`} value={n(Number(cur(x).replace(/\D/g, '') || 0))} onChange={e => setV({ ...v, [x.item]: e.target.value.replace(/\D/g, '') })} style={{ width: 110, minHeight: 34, textAlign: 'right', fontSize: 16, fontWeight: 700, padding: '0 10px', border: `${dirty || diff ? 2 : 1}px solid ${dirty || diff ? '#B77900' : '#C5CCD5'}`, borderRadius: 8, background: '#fff' }} /></span>
              {customerId && <span style={{ flex: '0 0 150px', textAlign: 'right' }}>{diff ? <input aria-label="Why different" placeholder="Why?" value={why[x.item] ?? x.reason} onChange={e => setWhy({ ...why, [x.item]: e.target.value })} style={{ width: 140, minHeight: 30, fontSize: 13, fontWeight: 600, padding: '0 10px', border: 0, borderRadius: 999, background: '#FDE9B0', color: '#5A3A00', textAlign: 'center' }} /> : <span style={{ color: '#4B5563' }}>Standard</span>}</span>}
            </div>); })}
        </div>
        <div style={{ flex: '0 1 400px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#4B5563' }}>Who sees which price</div>
            <div style={{ fontSize: 16, lineHeight: 1.45, color: '#3F4A58' }}>A school with its own price list gets those prices filled in on every new order. Anything left as Standard follows the standard list.</div>
            <div style={{ background: '#E5EFF1', borderRadius: 10, padding: '12px 14px', fontSize: 15, lineHeight: 1.4, color: '#3F4A58' }}><b style={{ color: '#0A4449' }}>Changes apply to new orders only.</b> Orders already confirmed keep the price they were confirmed at.</div>
          </div>
          {changed.length > 0 && <div style={{ background: '#FDE9B0', color: '#5A3A00', borderRadius: 14, padding: '14px 18px', fontSize: 15, lineHeight: 1.4 }}><b>{changed.length} unsaved {changed.length === 1 ? 'change' : 'changes'}</b> on this list. Nothing is changed until you save.</div>}
        </div>
      </div>
    </>
  );
}
