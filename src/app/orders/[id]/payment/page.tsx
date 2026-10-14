import { notFound } from 'next/navigation';
import { getCtx } from '@/lib/auth';
import { order, orders, naira, today } from '@/lib/q';
import { PaymentScreen } from '@/components/PaymentScreen';
import { Link, h1, day, daysFrom } from '@/components/ui';

export default async function Pay({ params }: { params: Promise<{ id: string }> }) {
  const { mode, user } = await getCtx(); const { id } = await params; const o = await order(mode, id); if (!o) notFound();
  const os = (await orders(mode, 'WHERE o.customer_id=?', [o.customer_id])).filter(x => x.balance > 0 && x.stage !== 'Draft');
  const rest = os.filter(x => x.id !== o.id).sort((a, b) => (a.due || '').localeCompare(b.due || ''));
  const list = [...os.filter(x => x.id === o.id), ...rest].map(x => ({ id: x.id, name: x.name, due: x.due, invoice_no: x.invoice_no, balance: x.balance, paid: x.paid, total: x.total, late: !!x.due && daysFrom(x.due) < 0, dueText: x.due ? (daysFrom(x.due) < 0 ? `Overdue ${day(x.due)}` : `Due ${day(x.due)}`) : 'No due date' }));
  const owed = os.reduce((s, x) => s + x.balance, 0);
  return (
    <main className="page" style={{ maxWidth: 'none', padding: '20px 32px 48px', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Link href={`/orders/${o.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>{o.name} · {o.customer}
        </Link>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <h1 style={{ ...h1, fontSize: 30 }}>Record a payment</h1>
          <span style={{ fontSize: 15, color: '#4B5563' }}>{o.customer} owes {naira(owed)} across {os.length} {os.length === 1 ? 'order' : 'orders'}. This order owes {naira(o.balance)}.</span>
        </div>
      </div>
      <PaymentScreen customerId={o.customer_id} customerName={o.customer} thisId={o.id} orders={list} today={today()} by={user?.name || 'Front desk'} back={`/orders/${o.id}`} />
    </main>
  );
}
