import { notFound } from 'next/navigation';
import { getCtx } from '@/lib/auth';
import { customer, naira, orders, priceFor, kindName } from '@/lib/q';
import { all } from '@/lib/db';
import { NewBlankOrder, UseDesign } from '@/components/Forms';
import { Link, H, h1, h2, Pill, DueBadge, Pay, stripe, ago, btnSm, Mockup, studioUrl } from '@/components/ui';

const chev = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7684" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: '0 0 auto' }}><path d="M9 6l6 6-6 6" /></svg>;
export default async function Profile({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ start?: string }> }) {
  const start = !!(await searchParams).start;
  const { mode } = await getCtx(); const { id } = await params; const c = await customer(mode, id); if (!c) notFound();
  const os = await orders(mode, 'WHERE o.customer_id=?', [c.id]);
  const owedOrders = os.filter(o => o.balance > 0 && o.stage !== 'Draft');
  const owed = owedOrders.reduce((s, o) => s + o.balance, 0);
  const draft = os.filter(o => o.stage === 'Draft').sort((a, b) => (b.updated || '').localeCompare(a.updated || ''))[0];
  const hist = os.filter(o => o.stage !== 'Draft').sort((a, b) => (a.stage === 'Collected' ? 1 : 0) - (b.stage === 'Collected' ? 1 : 0) || (a.due || '').localeCompare(b.due || ''));
  const shown = hist.slice(0, 6);
  const rows = await all<any>(mode, `SELECT l.id line_id, l.order_id, l.item, l.detail, l.unit_price price, l.decor_price, (l.design IS NOT NULL AND l.design!='null') has_design, json_extract(l.design,'$.thumb') thumb FROM order_lines l JOIN orders o ON o.id=l.order_id WHERE o.customer_id=? AND o.stage!='Draft' AND l.detail IS NOT NULL ORDER BY o.placed DESC, l.id DESC`, [c.id]);
  // one card per garment + colour: the newest line, preferring one that has a saved 3D mockup
  const seen = new Map<string, any>();
  for (const r of rows) { const k = r.item + '|' + r.detail; const cur = seen.get(k); if (!cur || (!cur.has_design && r.has_design)) seen.set(k, cur ? { ...r, price: cur.price } : r); }
  const past = [...seen.values()].sort((a, b) => Number(!!b.has_design) - Number(!!a.has_design)).slice(0, 6); // mockups first, then newest
  const designs = await Promise.all(past.map(async d => ({ ...d, price: ((await priceFor(mode, c.id, d.item)) ?? d.price) + (d.decor_price || 0) })));
  const contact = [['Contact person', c.contact], ['Phone', c.phone], ['Email', c.email], ['Delivery address', c.address]];
  const notes = String(c.notes || '').split(/\n+/).map((x: string) => x.trim()).filter(Boolean);
  const row = { width: '100%', minHeight: 56, boxSizing: 'border-box' as const, padding: '8px 16px 8px 12px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' as const, textDecoration: 'none', background: '#FFFFFF', color: '#1B2430' };
  const tile = { background: '#FFFFFF', border: '1px solid #DDE2E8', borderRadius: 10, padding: '14px 18px 18px', display: 'flex', flexDirection: 'column' as const, gap: 10 };
  return (
    <main className="page" style={{ padding: '24px 32px 48px', gap: 20 }}>
      <section style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: '1 1 480px' }}>
          <Link href="/" aria-label="Back to all customers" style={{ flex: '0 0 auto', width: 44, height: 44, boxSizing: 'border-box', border: '1px solid #C5CCD5', borderRadius: 12, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1B2430' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          </Link>
          <div style={{ flex: '0 0 auto', width: 48, height: 48, borderRadius: 10, background: '#E3EEF0', color: '#0E5C63', display: 'flex', alignItems: 'center', justifyContent: 'center', ...H, fontWeight: 700, fontSize: 20 }}>{(c.name.replace(/^(mrs?\.?|ms\.?|dr\.?|st\.?)\s+/i, '')[0] || '?').toUpperCase()}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={h1}>{c.name}</h1>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#0A4449', background: '#DCEBED', padding: '2px 8px', borderRadius: 6 }}>{kindName(c.kind)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 14, color: '#4B5563' }}>
              {(c.contact || c.phone) && <span>{[c.contact, c.phone].filter(Boolean).join(' · ')}</span>}
              {owed > 0 && <span style={{ fontWeight: 500 }}>{naira(owed)} outstanding across {owedOrders.length} {owedOrders.length === 1 ? 'order' : 'orders'}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {os.length > 0 && <Link href={`/customers/${c.id}/reorder`} style={{ textDecoration: 'none', minHeight: 48, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: '#FFFFFF', background: '#0E5C63', border: 0, borderRadius: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" /><path d="M3 21v-5h5" /></svg>Reorder from past order
          </Link>}
          <NewBlankOrder customerId={c.id} start={start} />
        </div>
      </section>

      {draft && (
        <section style={{ background: '#FEF3CF', border: '1px solid #F1D68A', borderRadius: 10, padding: '8px 16px 8px 18px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Pill>Draft</Pill>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#3D2800' }}>{draft.name} · {draft.line_count} {draft.line_count === 1 ? 'line' : 'lines'}</span>
            {draft.updated && <span style={{ fontSize: 13, color: '#5A3A00' }}>edited {ago(draft.updated)}</span>}
          </div>
          <Link href={`/orders/${draft.id}`} style={{ ...btnSm, color: '#3D2800', border: '2px solid #3D2800' }}>Resume draft</Link>
        </section>
      )}

      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: '1.8 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <h2 style={h2}>Order history</h2>
              {hist.length > 0 && <Link href={`/orders?customer=${c.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 44, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>See all {os.length} orders<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></Link>}
            </div>
            <div style={{ background: '#FFFFFF', border: '1px solid #DDE2E8', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {shown.length === 0 && <div style={{ padding: 18, color: '#4B5563' }}>No orders yet. Start with a new blank order.</div>}
              {shown.map((o, i) => (
                <Link key={o.id} href={`/orders/${o.id}`} style={{ ...row, borderLeft: `3px solid ${stripe(o)}`, borderBottom: i === shown.length - 1 ? 0 : '1px solid #E8ECF0' }}>
                  <span style={{ flex: '1 1 150px', minWidth: 0, fontWeight: 600, fontSize: 15 }}>{o.name}</span>
                  <span style={{ flex: '0 0 auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                    {o.stage === 'Collected' ? <span style={{ fontSize: 13, color: '#4B5563' }}>Collected</span> : <DueBadge due={o.due} />}
                    <Pay o={o} />
                  </span>
                  <span style={{ flex: '0 0 96px', textAlign: 'right', fontWeight: 600, fontSize: 15 }}>{naira(o.total)}</span>
                  {chev}
                </Link>
              ))}
            </div>
          </div>

          {designs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                <h2 style={h2}>Saved designs</h2>
                <span style={{ fontSize: 13, color: '#4B5563' }}>Reuse a garment spec exactly as it was made</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
                {designs.map((d, i) => (
                  <div key={i} style={{ background: '#FFFFFF', border: '1px solid #DDE2E8', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <a href={studioUrl(d.order_id, d.line_id, d.item, { view: true, customer: c.id })} aria-label={`Open the 3D mockup of ${d.item}, ${d.detail}`} style={{ display: 'flex', flexDirection: 'column', gap: 8, color: 'inherit', textDecoration: 'none' }}>
                      <div style={{ position: 'relative', height: 64, borderRadius: 8, background: '#EEF1F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Mockup thumb={d.thumb} item={d.item} detail={d.detail} size={d.thumb ? 56 : 44} />
                        <span style={{ position: 'absolute', right: 6, bottom: 4, fontSize: 11, fontWeight: 500, color: '#0E5C63', background: '#fff', border: '1px solid #DDE2E8', borderRadius: 6, padding: '1px 6px' }}>{d.has_design ? 'Open 3D mockup' : 'View in 3D'}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 500, fontSize: 14 }}>{d.item}</span>
                        <span style={{ fontSize: 12, color: '#4B5563' }}>{d.detail}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#1B2430', paddingTop: 4 }}>{naira(d.price)}</span>
                      </div>
                    </a>
                    <UseDesign customerId={c.id} item={d.item} detail={d.detail} price={d.price} fromOrder={d.order_id} fromLine={d.line_id} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {owedOrders.length > 0 && <Link href={`/orders/${[...owedOrders].sort((x, y) => (x.due || '').localeCompare(y.due || ''))[0].id}/payment`} style={{ ...btnSm, alignSelf: 'flex-start', minHeight: 48, padding: '0 22px', fontSize: 14, color: '#FFFFFF', background: '#0E5C63', border: 0, borderRadius: 8 }}>Record a payment</Link>}
        </div>

        <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={tile}>
            <h2 style={h2}>Contact</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px 16px', fontSize: 14 }}>
              {contact.map(([k, v]) => <div key={k as string} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontSize: 12, color: '#4B5563' }}>{k}</span><span style={{ fontWeight: 500, overflowWrap: 'anywhere' }}>{v || '—'}</span></div>)}
              {c.payment_terms && <div style={{ display: 'flex', flexDirection: 'column', gap: 2, gridColumn: '1 / -1' }}><span style={{ fontSize: 12, color: '#4B5563' }}>Payment terms</span><span style={{ fontWeight: 500 }}>{c.payment_terms}{c.deposit_pct ? ` · ${c.deposit_pct}% deposit before cutting` : ''}</span></div>}
            </div>
          </div>
          {notes.length > 0 && (
            <div style={tile}>
              <h2 style={h2}>Notes for next time</h2>
              <ul style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, lineHeight: 1.45 }}>{notes.map((n: string, i: number) => <li key={i}>{n}</li>)}</ul>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
