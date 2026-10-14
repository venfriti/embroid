import { getCtx } from '@/lib/auth';
import { all } from '@/lib/db';
import { order, customer, lines, garmentList, stock, priceFor, fmtDate } from '@/lib/q';
import { DraftBuilder } from '@/components/DraftBuilder';
import NotesPanel from '@/components/NotesPanel';

export default async function Builder({ id }: { id: string }) {
  const { mode } = await getCtx(); const o = (await order(mode, id))!; const c = await customer(mode, o.customer_id);
  const ls = await lines(mode, id); const gs = await garmentList(mode); const st = await stock(mode);
  const items = await all<any>(mode, 'SELECT item FROM prices ORDER BY item');
  const prices: Record<string, number> = {};
  for (const i of items) prices[i.item] = (await priceFor(mode, o.customer_id, i.item)) ?? 0;
  const garments: Record<string, any> = {};
  for (const g of gs) garments[g.name] = { name: g.name, sizes: g.sizes || [], placements: g.placements || [], recipe: (g.stock_per_piece || []).map(r => { const s = st.find(x => x.name === r.item); return { item: r.item, qty: r.qty, unit: s?.unit || '', onHand: s?.on_hand ?? 0, avail: s?.available ?? 0 }; }) };
  const noteRows = await all<any>(mode, 'SELECT * FROM notes WHERE order_id=? ORDER BY created_at DESC', [o.id]);
  const orderNotes = await Promise.all(noteRows.map(async n => ({ ...n, attachments: await all<any>(mode, 'SELECT * FROM note_attachments WHERE note_id=? ORDER BY created_at', [n.id]), events: await all<any>(mode, 'SELECT id,action,body,detail,at,by FROM note_events WHERE note_id=? ORDER BY id', [n.id]) })));
  return (
    <main className="page" style={{ padding: '24px 32px 48px', gap: 18 }}>
      <DraftBuilder orderId={id} customerId={o.customer_id} customer={o.customer} name={o.name} due={o.due ? fmtDate(o.due) : ''} lines={ls as any} garments={garments} prices={prices} />
      <section style={{ maxWidth: 850, width: '100%', display: 'flex', flexDirection: 'column', gap: 12, background: '#fff', border: '1px solid #DDE2E8', borderRadius: 10, padding: 16 }}>
        <h2 style={{ margin: 0, fontSize: 15, color: '#3F4A58' }}>Contact and order notes <span style={{ fontWeight: 400 }}>({orderNotes.filter(n => !n.removed_at).length})</span></h2>
        <div style={{ fontSize: 14, display: 'flex', flexWrap: 'wrap', gap: 12 }}><a href={`/customers/${o.customer_id}`}>{c?.name || o.customer}</a>{c?.contact && <span>{c.contact}</span>}{c?.phone && <a href={`tel:${c.phone}`}>{c.phone}</a>}{c?.email && <a href={`mailto:${c.email}`}>{c.email}</a>}</div>
        <NotesPanel scope="order" owner={o.id} notes={orderNotes} demo={mode === 'demo'} />
      </section>
    </main>
  );
}
