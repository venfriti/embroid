import { getCtx } from '@/lib/auth';
import { stock } from '@/lib/q';
import { DeliveryForm, NewStockItemForm } from '@/components/Forms';
import { Link, h1 } from '@/components/ui';

export default async function Add() {
  const { mode } = await getCtx(); const items = await stock(mode);
  return (
    <main className="page" style={{ maxWidth: 'none', padding: '20px 32px 48px', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Link href="/stock" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>Back to stock</Link>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}><h1 style={{ ...h1, fontSize: 30 }}>Add stock</h1><span style={{ fontSize: 15, color: '#4B5563' }}>Record what came in, one line per item.</span></div>
      </div>
      <DeliveryForm items={items.map(i => ({ id: i.id, name: i.name, unit: i.unit, on_hand: i.on_hand, reserved: i.reserved, cost: i.cost }))} />
      <div style={{ marginTop: 14 }}><h2 style={{ margin: '0 0 10px', fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 600, fontSize: 20 }}>Not on the list yet?</h2><NewStockItemForm /></div>
    </main>
  );
}
