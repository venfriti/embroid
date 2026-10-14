import { getCtx } from '@/lib/auth';
import { all } from '@/lib/db';
import { customers } from '@/lib/q';
import { NewPriceForm } from '@/components/Forms';
import { ListPicker, PricesEditor } from '@/components/SetupBits';

export default async function Prices({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { mode } = await getCtx(); const c = (await searchParams).c;
  const cs = await customers(mode); const cust = cs.find((x: any) => x.id === c);
  const std = await all<any>(mode, 'SELECT * FROM prices ORDER BY rowid');
  const ov = cust ? await all<any>(mode, 'SELECT * FROM price_overrides WHERE customer_id=?', [cust.id]) : [];
  const rows = std.map((p: any) => { const o = ov.find((x: any) => x.item === p.item); return { item: p.item, standard: p.standard, price: o?.price ?? p.standard, reason: o?.reason || '' }; });
  const short = cust ? (cust.short_name || cust.name.split(' ')[0]) : undefined;
  return (
    <>
      <PricesEditor key={(cust?.id || 'std') + rows.map(r => r.price).join(',')} rows={rows} customerId={cust?.id} shortName={short} picker={<ListPicker label="Price list" value={cust?.id || ''} base="/setup" options={[['', 'Standard price list'], ...cs.map((x: any) => [x.id, x.name] as [string, string])]} />} />
      {!cust && <div style={{ background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, overflow: 'hidden', maxWidth: 760 }}><NewPriceForm /></div>}
    </>
  );
}
