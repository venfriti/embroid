'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { send } from '@/lib/client';

const n = (x: number) => '₦' + Math.round(x).toLocaleString('en-NG');
type O = { id: string; name: string; due: string | null; invoice_no: string | null; balance: number; paid: number; total: number; dueText: string; late: boolean };
const LBL = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 15, color: '#3F4A58', minWidth: 0 } as const;
const INP = { width: '100%', boxSizing: 'border-box', minHeight: 46, padding: '0 12px', fontSize: 16, color: '#1B2430', background: '#FFFFFF', border: '1px solid #C5CCD5', borderRadius: 10 } as const;
const chip = (bg: string, color: string, t: string) => <span style={{ fontSize: 12, fontWeight: 600, color, background: bg, padding: '2px 10px', borderRadius: 999 }}>{t}</span>;

export function PaymentScreen({ customerId, customerName, thisId, orders, today, by, back }: { customerId: string; customerName: string; thisId: string; orders: O[]; today: string; by: string; back: string }) {
  const r = useRouter();
  const first = orders.find(o => o.id === thisId);
  const [amount, setAmount] = useState(String(first?.balance || ''));
  const [manual, setManual] = useState<Record<string, string> | null>(null);
  const [method, setMethod] = useState('Transfer'); const [ref, setRef] = useState(''); const [note, setNote] = useState(''); const [date, setDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const amt = Math.max(0, Math.floor(Number(amount) || 0));
  // Automatic split: this order first, then the rest in the order given (oldest first).
  const auto: Record<string, number> = {}; let left = amt;
  for (const o of orders) { const a = Math.min(left, o.balance); auto[o.id] = a; left -= a; }
  const alloc: Record<string, number> = Object.fromEntries(orders.map(o => [o.id, manual ? Math.max(0, Math.floor(Number(manual[o.id]) || 0)) : auto[o.id]]));
  const applied = Object.values(alloc).reduce((s, x) => s + x, 0);
  const over = orders.some(o => alloc[o.id] > o.balance);
  const ok = amt > 0 && applied === amt && !over;
  const setOne = (id: string, v: string) => setManual({ ...(manual || Object.fromEntries(orders.map(o => [o.id, String(auto[o.id])]))), [id]: v });
  const toggle = (id: string, on: boolean) => setOne(id, on ? String(Math.min(orders.find(o => o.id === id)!.balance, Math.max(0, amt - applied) || orders.find(o => o.id === id)!.balance)) : '0');
  const owedAll = orders.reduce((s, o) => s + o.balance, 0);
  const save = async () => {
    setBusy(true);
    const j: any = await send('/api/payments', { customer_id: customerId, date, method, ref, note, allocations: orders.map(o => ({ order_id: o.id, amount: alloc[o.id] })).filter(a => a.amount > 0) });
    setBusy(false); if (j.ok) { r.push(back); r.refresh(); }
  };
  const METHODS = [['Transfer', 'Bank transfer'], ['Cash', 'Cash'], ['POS', 'POS'], ['Cheque', 'Cheque']];
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 420px', minWidth: 0, background: '#FFFFFF', border: '1px solid #DDE2E8', borderRadius: 14, boxSizing: 'border-box', padding: '22px 22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontWeight: 700, fontSize: 20 }}>Payment details</div>
        <label style={LBL}>Amount received
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 64, padding: '0 16px', border: '2px solid #0E5C63', borderRadius: 12, background: '#fff' }}>
            <span style={{ fontSize: 26, fontWeight: 700 }}>₦</span>
            <input inputMode="numeric" value={amount ? Number(amount).toLocaleString('en-NG') : ''} onChange={e => { setAmount(e.target.value.replace(/\D/g, '')); setManual(null); }} aria-label="Amount received in naira" style={{ border: 0, outline: 0, width: '100%', fontSize: 30, fontWeight: 700, color: '#1B2430', background: 'transparent' }} />
          </span>
        </label>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <label style={{ ...LBL, flex: '1 1 160px' }}>Date received<input type="date" style={INP} value={date} onChange={e => setDate(e.target.value)} /></label>
          <label style={{ ...LBL, flex: '1 1 160px' }}>Received by<input style={{ ...INP, background: '#F4F6F8' }} value={by} readOnly /></label>
        </div>
        <div role="radiogroup" aria-label="How it was paid" style={{ ...LBL }}>How it was paid
          <div style={{ display: 'flex', border: '1px solid #C5CCD5', borderRadius: 10, overflow: 'hidden' }}>
            {METHODS.map(([k, t]) => { const on = method === k; return <button key={k} type="button" role="radio" aria-checked={on} onClick={() => setMethod(k)} style={{ flex: 1, minHeight: 46, fontSize: 16, fontWeight: on ? 700 : 500, color: on ? '#fff' : '#1B2430', background: on ? '#0E5C63' : '#fff', border: 0, borderRight: '1px solid #C5CCD5', cursor: 'pointer' }}>{t}</button>; })}
          </div>
        </div>
        <label style={LBL}>Reference or name on the transfer<input style={INP} value={ref} onChange={e => setRef(e.target.value)} /></label>
        <label style={LBL}>Note, if any<input style={INP} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. paid by the bursar" /></label>
      </div>

      <div style={{ flex: '1.3 1 460px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #DDE2E8', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px 10px' }}>
            <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontWeight: 700, fontSize: 20 }}>Where the money goes</div>
            <div style={{ fontSize: 15, color: '#3F4A58' }}>This order is paid first. Anything left over goes to the oldest unpaid order. Change the amounts if you need to.</div>
          </div>
          {orders.map(o => { const a = alloc[o.id], on = a > 0, this_ = o.id === thisId; const after = o.balance - a; return (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderTop: '1px solid #E8ECF0', background: this_ ? '#EEF5F6' : '#fff', borderLeft: this_ ? '6px solid #0E5C63' : '6px solid #E3E8ED' }}>
              <input type="checkbox" checked={on} onChange={e => toggle(o.id, e.target.checked)} aria-label={`Pay towards ${o.name}`} style={{ width: 26, height: 26, accentColor: '#0E5C63', flex: '0 0 auto' }} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><b style={{ fontSize: 17 }}>{o.name}</b>{this_ && chip('#DCEBED', '#0A4449', 'This order')}{o.late && chip('#FDECEA', '#8A1C13', 'Overdue')}{o.paid > 0 ? chip('#FDE9B0', '#5A3A00', 'Partial') : chip('#FBE0DC', '#8A1C13', 'Unpaid')}</span>
                <span style={{ fontSize: 14, color: '#4B5563' }}>{o.dueText}{o.invoice_no ? ` · ${o.invoice_no}` : ''}</span>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ fontSize: 13, color: '#4B5563' }}>Owes {n(o.balance)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontWeight: 700 }}>₦</span><input inputMode="numeric" aria-label={`Amount for ${o.name}`} value={a ? a.toLocaleString('en-NG') : '0'} onChange={e => setOne(o.id, e.target.value.replace(/\D/g, ''))} style={{ width: 112, minHeight: 40, textAlign: 'right', fontSize: 18, fontWeight: 600, padding: '0 10px', border: '1px solid #C5CCD5', borderRadius: 8 }} /></span>
                {on && (after === 0 ? <span style={{ fontSize: 13, fontWeight: 600, color: '#14532D' }}>Clears the balance</span> : after > 0 ? <span style={{ fontSize: 13, color: '#4B5563' }}>Balance after {n(after)}</span> : <span style={{ fontSize: 13, fontWeight: 600, color: '#8A1C13' }}>More than it owes</span>)}
              </span>
            </div>); })}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 18px', background: '#F4F6F8', borderTop: '1px solid #E8ECF0', fontSize: 15 }}>
            <span>Received {n(amt)} · applied {n(applied)}</span>
            {applied === amt && amt > 0 ? <b style={{ color: '#14532D' }}>✓ Nothing left over</b> : amt > applied ? <b style={{ color: '#8A1C13' }}>{n(amt - applied)} not placed yet</b> : applied > amt ? <b style={{ color: '#8A1C13' }}>{n(applied - amt)} more than received</b> : null}
          </div>
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #DDE2E8', borderRadius: 14, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div><div style={{ fontSize: 13, color: '#4B5563' }}>{customerName} owes now</div><div style={{ fontSize: 26, fontWeight: 700, color: '#6B7684', textDecoration: 'line-through', fontFamily: "'Poppins', system-ui, sans-serif" }}>{n(owedAll)}</div></div>
            <div><div style={{ fontSize: 13, color: '#4B5563' }}>After this payment</div><div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Poppins', system-ui, sans-serif" }}>{n(owedAll - applied)}</div></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 15 }}>
              {orders.filter(o => alloc[o.id] > 0).map(o => <span key={o.id}>{o.name} {o.balance - alloc[o.id] === 0 ? chip('#DCF1E3', '#14532D', 'Paid in full') : chip('#FDE9B0', '#5A3A00', `${n(o.balance - alloc[o.id])} left`)}</span>)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => r.push(back)} style={{ minHeight: 52, padding: '0 28px', fontSize: 17, fontWeight: 600, color: '#0E5C63', background: '#FFFFFF', border: '2px solid #0E5C63', borderRadius: 12, cursor: 'pointer' }}>Cancel</button>
            <button type="button" disabled={!ok || busy} onClick={save} style={{ minHeight: 52, padding: '0 28px', fontSize: 17, fontWeight: 600, color: '#FFFFFF', background: ok ? '#0E5C63' : '#8AA7AA', border: 0, borderRadius: 12, cursor: ok ? 'pointer' : 'not-allowed' }}>Save payment</button>
          </div>
        </div>
      </div>
    </div>
  );
}
