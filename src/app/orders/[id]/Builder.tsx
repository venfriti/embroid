import { getCtx } from '@/lib/auth';
import { all } from '@/lib/db';
import { order, lines, garmentList, stock, priceFor, fmtDate } from '@/lib/q';
import { DraftBuilder } from '@/components/DraftBuilder';

export default async function Builder({ id }: { id: string }) {
  const { mode } = await getCtx(); const o = (await order(mode, id))!;
  const ls = await lines(mode, id); const gs = await garmentList(mode); const st = await stock(mode);
  const items = await all<any>(mode, 'SELECT item FROM prices ORDER BY item');
  const prices: Record<string, number> = {};
  for (const i of items) prices[i.item] = (await priceFor(mode, o.customer_id, i.item)) ?? 0;
  const garments: Record<string, any> = {};
  for (const g of gs) garments[g.name] = { name: g.name, sizes: g.sizes || [], placements: g.placements || [], recipe: (g.stock_per_piece || []).map(r => { const s = st.find(x => x.name === r.item); return { item: r.item, qty: r.qty, unit: s?.unit || '', onHand: s?.on_hand ?? 0, avail: s?.available ?? 0 }; }) };
  return (
    <main className="page" style={{ padding: '24px 32px 48px', gap: 18 }}>
      <DraftBuilder orderId={id} customerId={o.customer_id} customer={o.customer} name={o.name} due={o.due ? fmtDate(o.due) : ''} lines={ls as any} garments={garments} prices={prices} />
    </main>
  );
}
