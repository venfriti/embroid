import { notFound } from 'next/navigation';
import { getCtx } from '@/lib/auth';
import { order, lines, payments, decorations, customer, naira, fmtDate } from '@/lib/q';
import { PrintBtns } from '@/components/DocBits';
import { Link, Pay, day } from '@/components/ui';

const SHOW = 5;
export default async function Invoice({ params }: { params: Promise<{ id: string }> }) {
  const { mode } = await getCtx(); const { id } = await params; const o = await order(mode, id); if (!o) notFound();
  const c = await customer(mode, o.customer_id); const ls = await lines(mode, o.id); const ps = await payments(mode, o.id);
  const decors = await decorations(mode, o.id);
  const head = ls.slice(0, SHOW), rest = ls.slice(SHOW);
  const cell = (w: number) => ({ flex: `0 0 ${w}px`, textAlign: 'right' as const });
  const row = (l: any) => (
    <div key={l.id} style={{ padding: '14px 0', borderBottom: '1px solid #E8ECF0' }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <span style={{ flex: 1 }}><b style={{ fontSize: 16 }}>{l.item}</b>{l.detail && <div style={{ fontSize: 14, color: '#4B5563' }}>{l.detail}</div>}</span>
        <span style={cell(70)}>{l.qty}</span><span style={cell(110)}>{naira(l.unit_price)}</span><b style={{ ...cell(130), fontWeight: 600 }}>{naira(l.qty * l.unit_price)}</b>
      </div>
      {(decors[l.id] || []).map((dc, i) => (
        <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginTop: 8 }}>
          <span style={{ flex: 1 }}><b style={{ fontSize: 16 }}>{dc.name}</b></span>
          <span style={cell(70)}>{l.qty}</span><span style={cell(110)}>{naira(dc.price)}</span><b style={{ ...cell(130), fontWeight: 600 }}>{naira(dc.price * l.qty)}</b>
        </div>
      ))}
    </div>
  );
  const money = (a: string, b: string, o2: any = {}) => <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, ...o2 }}><span>{a}</span><span>{b}</span></div>;
  return (
    <main className="page" style={{ maxWidth: 860, padding: '24px 32px 48px', gap: 14 }}>
      <div className="noprint" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link href={`/orders/${o.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>{o.name}</Link>
          <h1 style={{ margin: 0, fontFamily: "'Poppins', system-ui, sans-serif", fontWeight: 700, fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.02em' }}>Invoice</h1>
          <span style={{ fontSize: 16, color: '#4B5563' }}>Made from the order. It updates itself when lines or payments change.</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}><PrintBtns /></div>
      </div>
      <article style={{ background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div><div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontWeight: 700, fontSize: 28 }}>Embroid</div><div style={{ fontSize: 14, color: '#4B5563' }}>[Shop address] · [Phone] · [Email]</div></div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}><span style={{ fontSize: 13, letterSpacing: '.1em', color: '#4B5563' }}>INVOICE</span><b style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: 26 }}>{o.invoice_no}</b><Pay o={o} /></div>
        </div>
        <div style={{ display: 'flex', gap: 44, flexWrap: 'wrap', fontSize: 14 }}>
          <div><div style={{ color: '#4B5563' }}>Billed to</div><b style={{ fontSize: 16 }}>{c.name}</b><div style={{ color: '#4B5563', fontSize: 16 }}>{c.address || '—'}</div></div>
          <div><div style={{ color: '#4B5563' }}>Issued</div><b style={{ fontSize: 16 }}>{fmtDate(o.placed)}</b></div>
          <div><div style={{ color: '#4B5563' }}>Delivery due</div><b style={{ fontSize: 16 }}>{day(o.due) ? `${day(o.due)} ${o.due!.slice(0, 4)}` : '—'}</b></div>
          <div><div style={{ color: '#4B5563' }}>Order</div><b style={{ fontSize: 16 }}>{o.name}</b></div>
        </div>
        <div>
          <div style={{ display: 'flex', gap: 14, padding: '8px 0', borderBottom: '2px solid #1B2430', fontSize: 14, color: '#4B5563' }}><span style={{ flex: 1 }}>Item</span><span style={cell(70)}>Qty</span><span style={cell(110)}>Price</span><span style={cell(130)}>Amount</span></div>
          {head.map(row)}
          {rest.length > 0 && <>
            <div className="screen-only" style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid #E8ECF0' }}><span style={{ flex: 1 }}><b style={{ fontSize: 16 }}>{rest.length} further {rest.length === 1 ? 'line' : 'lines'}</b><div style={{ fontSize: 14, color: '#4B5563' }}>Listed in full on the printed invoice</div></span><b style={{ ...cell(130), fontWeight: 600 }}>{naira(rest.reduce((t, l) => t + l.qty * (l.unit_price + l.decor_price), 0))}</b></div>
            <div className="print-only">{rest.map(row)}</div>
          </>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 280, fontSize: 15, color: '#3F4A58', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ps.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><span style={{ color: '#4B5563', fontSize: 14 }}>Payments received</span>{ps.map(p => <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 28 }}><span>{fmtDate(p.date).replace(/ \d{4}$/, '')} · {p.method}</span><span>{naira(p.amount)}</span></div>)}</div>}
            <span style={{ fontSize: 14, color: '#4B5563' }}>[Bank name] · [Account number] · [Account name]</span>
          </div>
          <div style={{ flex: '0 1 320px', minWidth: 240, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {money('Subtotal', naira(o.subtotal))}
            {o.discount > 0 && money('Discount', '−' + naira(o.discount))}
            {money('Total', naira(o.total))}
            {money('Paid', '−' + naira(o.paid), { color: '#14532D' })}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '2px solid #1B2430', paddingTop: 10, marginTop: 4 }}><b style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: 22 }}>Balance due</b><b style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: 26 }}>{naira(o.balance)}</b></div>
          </div>
        </div>
      </article>
    </main>
  );
}
