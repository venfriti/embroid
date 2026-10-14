import { notFound } from 'next/navigation';
import { getCtx } from '@/lib/auth';
import { order, lines, changes, garmentList, stock, naira, fmtDate } from '@/lib/q';
import { LinesEditor } from '@/components/LinesEditor';
import { Link, h1 } from '@/components/ui';

export default async function Lines({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ line?: string }> }) {
  const { mode } = await getCtx(); const { id } = await params; const sp = await searchParams;
  const o = await order(mode, id); if (!o) notFound();
  const ls = await lines(mode, o.id), cs = await changes(mode, o.id);
  const gs = await garmentList(mode), st = await stock(mode);
  const needs: Record<number, any[]> = {};
  for (const l of ls) needs[l.id] = (gs.find(g => g.name === l.item)?.stock_per_piece || []).map(r => { const s = st.find(x => x.name === r.item); return { item: r.item, per: r.qty, unit: s?.unit || '', avail: s?.available ?? 0 }; });
  const confirmed = o.stage !== 'Draft';
  const wasRe = /^(.*?) (\d+) → (\d+)/;
  const changed: Record<number, number> = {};
  for (const c of cs as any[]) { const m = wasRe.exec(c.change || ''); if (m) { const l = ls.find(x => x.item === m[1]); if (l && changed[l.id] == null) changed[l.id] = Number(m[2]); } }
  const short = (d?: string | null) => fmtDate(d).replace(/ \d{4}$/, '');
  return (
    <main className="page" style={{ maxWidth: 'none', padding: '20px 32px 48px', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link href={`/orders/${o.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 500, textDecoration: 'none', minHeight: 32 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>Back to order
          </Link>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
            <h1 style={h1}>{o.name}</h1>
            <span style={{ fontSize: 15, color: '#4B5563' }}>{o.customer}{o.placed ? ` · placed ${short(o.placed)}` : ''}{o.due ? ` · due ${short(o.due)}` : ''}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#0A4449', background: '#DCEBED', padding: '2px 8px', borderRadius: 6 }}>{o.stage}</span>
          <Link href={`/orders/${o.id}/sheet`} style={{ minHeight: 48, padding: '0 20px', display: 'inline-flex', alignItems: 'center', fontSize: 15, fontWeight: 600, color: '#0E5C63', background: '#FFFFFF', border: '2px solid #0E5C63', borderRadius: 8, textDecoration: 'none' }}>Print production sheet</Link>
        </div>
      </div>
      <LinesEditor key={sp.line || 'none'} orderId={o.id} confirmed={confirmed} lines={ls as any} selected={sp.line ? Number(sp.line) : undefined} needs={needs} subtotal={o.subtotal} changed={changed} orderStage={o.stage}
        log={(cs as any[]).map(c => ({ id: c.id, change: c.change, amount: c.amount, by: c.by, reason: c.reason, date: fmtDate(c.date) }))} />
    </main>
  );
}
