import { notFound } from 'next/navigation';
import { getCtx } from '@/lib/auth';
import { order, lines, garmentList, stock, fmtDate } from '@/lib/q';
import { SheetView } from '@/components/SheetView';
import { PrintBtns } from '@/components/DocBits';
import { Link, h1 } from '@/components/ui';

const parse = (s?: string | null) => (s || '').split(',').map(x => x.trim().split(':')).filter(p => p.length === 2).map(([a, b]) => [a.trim(), Number(b)] as [string, number]);

export default async function Sheet({ params }: { params: Promise<{ id: string }> }) {
  const { mode } = await getCtx(); const { id } = await params; const o = await order(mode, id); if (!o) notFound();
  const ls = (await lines(mode, o.id)) as any[]; const gs = await garmentList(mode); const by = new Map(gs.map(g => [g.name, g])); const st = await stock(mode);
  const need: Record<string, number> = {};
  for (const l of ls) for (const r of by.get(l.item)?.stock_per_piece || []) need[r.item] = (need[r.item] || 0) + r.qty * l.qty;
  const mats = (pred: (t: string) => boolean) => Object.entries(need).map(([name, q]) => { const s = st.find(x => x.name === name); return { name, qty: Math.round(q * 100) / 100, unit: s?.unit || '', type: s?.type || '', short: s && s.available < 0 ? Math.min(Math.round(q * 100) / 100, Math.round(-s.available * 100) / 100) : 0 }; }).filter(m => pred(m.type));
  const pull = mats(t => t === 'Fabric'), trims = mats(t => t !== 'Fabric');
  const slines = ls.map(l => { const g = by.get(l.item); return { thumb: l.thumb, id: l.id, line_no: l.line_no, item: l.item, detail: l.detail, qty: l.qty, unit_price: l.unit_price, decor_price: l.decor_price, sizes: parse(l.sizes), placements: (g?.placements || []).map((p: any, i: number) => ({ no: p.no || i + 1, what: p.what, place: p.place, method: p.method })),
    short: (g?.stock_per_piece || []).filter(r => { const s = st.find(x => x.name === r.item); return s && s.type !== 'Fabric' && s.available < 0; }).map(r => `${r.item} short by ${-st.find(x => x.name === r.item)!.available}. Order more.`) }; });
  return (
    <main className="page" style={{ maxWidth: 'none', padding: '20px 32px 48px', gap: 14 }}>
      <div className="noprint" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link href={`/orders/${o.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>{o.name} · {o.customer}</Link>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}><h1 style={h1}>Production sheet</h1><span style={{ fontSize: 15, color: '#4B5563' }}>What the workshop needs to make this order. No prices on it.</span></div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}><PrintBtns /></div>
      </div>
      <SheetView orderId={o.id} name={o.name} customer={o.customer} invoice={o.invoice_no || 'Draft'} due={o.due ? fmtDate(o.due).replace(/ \d{4}$/, '') : '—'} pieces={o.pieces} lineCount={o.line_count} stage={o.stage} lines={slines} pull={pull} trims={trims} note={o.note || ''} />
    </main>
  );
}
