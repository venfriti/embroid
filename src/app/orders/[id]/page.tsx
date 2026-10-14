import { notFound } from 'next/navigation';
import { getCtx } from '@/lib/auth';
import { order, lines, payments, naira, fmtDate } from '@/lib/q';
import { StageStepper, PriceAdjust } from '@/components/Forms';
import { Link, h1, h2, Pay, Silhouette, Chev, day, daysFrom } from '@/components/ui';
import Builder from './Builder';

const SHOW = 5;
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { mode } = await getCtx(); const { id } = await params; const o = await order(mode, id); if (!o) notFound();
  if (o.stage === 'Draft') return <Builder id={id} />;
  const ls = await lines(mode, o.id), ps = await payments(mode, o.id);
  const pct = o.total > 0 ? Math.min(100, Math.round(o.paid / o.total * 100)) : 0;
  const n = o.due ? daysFrom(o.due) : null;
  const meta = [o.customer, o.placed ? `Placed ${fmtDate(o.placed)}` : null, `${o.line_count} ${o.line_count === 1 ? 'line' : 'lines'}`, o.due ? `Due ${day(o.due)}${n !== null && o.stage !== 'Collected' ? (n < 0 ? ` (${-n} ${-n === 1 ? 'day' : 'days'} late)` : ` (${n} ${n === 1 ? 'day' : 'days'} to go)`) : ''}` : null].filter(Boolean).join(' · ');
  const tile = { background: '#FFFFFF', border: '1px solid #DDE2E8', borderRadius: 14 } as const;
  const outBtn = { minHeight: 48, padding: '0 18px', display: 'flex', textDecoration: 'none', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 600, color: '#0E5C63', background: '#FFFFFF', border: '2px solid #0E5C63', borderRadius: 12 } as const;
  const shown = ls.slice(0, SHOW);
  return (
    <main className="page" style={{ padding: '24px 32px 48px', gap: 20 }}>
      <section style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: '1 1 480px' }}>
          <Link href={`/customers/${o.customer_id}`} aria-label="Back to the customer" style={{ flex: '0 0 auto', width: 44, height: 44, boxSizing: 'border-box', border: '1px solid #C5CCD5', borderRadius: 12, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1B2430' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}><h1 style={{ ...h1, fontSize: 30 }}>{o.name}</h1><Pay o={o} /></div>
            <span style={{ fontSize: 15, color: '#4B5563' }}>{meta}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {o.invoice_no && <Link href={`/orders/${o.id}/invoice`} style={outBtn}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /><path d="M10 13h6M10 17h6" /></svg>Invoice</Link>}
          <Link href={`/orders/${o.id}/sheet`} style={outBtn}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="6" y="5" width="12" height="16" rx="2" /><path d="M9 5V4h6v1M9 11h6M9 15h4" /></svg>Production sheet</Link>
        </div>
      </section>

      <StageStepper id={o.id} stage={o.stage} />

      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start' }}>
        <div style={{ flex: '1.6 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ ...tile, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #E8ECF0' }}>
              <h2 style={{ ...h2, flex: 1, fontSize: 18 }}>Lines <span style={{ fontFamily: "'Figtree', system-ui, sans-serif", fontWeight: 400, fontSize: 14, color: '#4B5563' }}>· {shown.length === ls.length ? ls.length : `${shown.length} of ${ls.length}`}</span></h2>
              <span style={{ flex: '0 0 64px', textAlign: 'right', fontSize: 13, color: '#4B5563' }}>Qty</span>
              <span style={{ flex: '0 0 88px', textAlign: 'right', fontSize: 13, color: '#4B5563' }}>Each</span>
              <span style={{ flex: '0 0 104px', textAlign: 'right', fontSize: 13, color: '#4B5563' }}>Total</span>
              <span style={{ flex: '0 0 20px' }} />
            </div>
            {shown.map(l => (
              <Link key={l.id} href={`/orders/${o.id}/lines?line=${l.id}`} style={{ width: '100%', minHeight: 64, boxSizing: 'border-box', padding: '8px 16px 8px 20px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', textDecoration: 'none', background: '#FFFFFF', borderBottom: '1px solid #E8ECF0', color: '#1B2430' }}>
                <span style={{ flex: '0 0 auto', width: 48, height: 48, borderRadius: 10, background: '#EEF1F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Silhouette item={l.item} detail={l.detail} size={36} /></span>
                <span style={{ flex: '1 1 160px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{l.item}</span>
                  {l.detail && <span style={{ fontSize: 13, color: '#4B5563' }}>{l.detail}</span>}
                </span>
                <span style={{ flex: '0 0 64px', textAlign: 'right', fontSize: 15 }}>{l.qty}</span>
                <span style={{ flex: '0 0 88px', textAlign: 'right', fontSize: 15 }}>{naira(l.unit_price)}</span>
                <span style={{ flex: '0 0 104px', textAlign: 'right', fontSize: 15, fontWeight: 600 }}>{naira(l.qty * l.unit_price)}</span>
                <Chev />
              </Link>
            ))}
            <Link href={`/orders/${o.id}/lines`} style={{ width: '100%', minHeight: 48, padding: '0 20px', display: 'flex', alignItems: 'center', fontSize: 15, fontWeight: 600, color: '#0E5C63', textDecoration: 'none', boxSizing: 'border-box' }}>{ls.length > SHOW ? `Show all ${ls.length} lines` : 'Edit lines'}</Link>
          </div>
        </div>

        <div style={{ flex: '1 1 340px', maxWidth: 400, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ ...tile, padding: '16px 20px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><h2 style={{ ...h2, fontSize: 18 }}>Payment</h2><Pay o={o} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 13, color: '#4B5563' }}>Balance left</span>
              <span style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{naira(Math.max(0, o.balance))}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ height: 8, borderRadius: 4, background: '#D5DBE2', overflow: 'hidden' }} aria-hidden="true"><div style={{ width: `${pct}%`, height: 8, background: o.balance <= 0 ? '#2F855A' : '#B77900' }} /></div>
              <span style={{ fontSize: 14, color: '#3F4A58' }}>{naira(o.paid)} paid of {naira(o.total)}</span>
            </div>
            {o.balance > 0 && <Link href={`/orders/${o.id}/payment`} style={{ boxSizing: 'border-box', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 48, fontSize: 15, fontWeight: 600, color: '#FFFFFF', background: '#0E5C63', border: 0, borderRadius: 12 }}>Record payment</Link>}
            {ps.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 4, borderTop: '1px solid #E8ECF0' }}>
                <span style={{ fontSize: 13, color: '#4B5563', paddingTop: 10 }}>Payments received</span>
                {ps.map((p: any) => <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 36, fontSize: 15 }}><span>{day(p.date).split(' ').slice(1).join(' ')} · {p.method}</span><span style={{ fontWeight: 600 }}>{naira(p.amount)}</span></div>)}
              </div>
            )}
          </div>
          <div style={{ ...tile, padding: '12px 20px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 44 }}>
              <h2 style={{ ...h2, fontSize: 18 }}>Price</h2><PriceAdjust id={o.id} discount={o.discount} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 32, fontSize: 15 }}><span style={{ color: '#3F4A58' }}>List price</span><span>{naira(o.subtotal)}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 32, fontSize: 15 }}><span style={{ color: '#3F4A58' }}>Discount</span><span>{o.discount > 0 ? '−' + naira(o.discount) : naira(0)}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 40, marginTop: 4, borderTop: '1px solid #E8ECF0', fontSize: 18, fontWeight: 700 }}><span>Total</span><span>{naira(o.total)}</span></div>
          </div>
        </div>
      </section>
    </main>
  );
}
