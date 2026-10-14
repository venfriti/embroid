import { all, first, Mode } from './db';
export const naira = (n: number) => '₦' + Math.round(n).toLocaleString('en-NG');
export const STAGES = ['Draft', 'Confirmed', 'In production', 'Ready', 'Collected'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDate = (s?: string | null) => s ? `${+s.slice(8, 10)} ${MON[+s.slice(5, 7) - 1]} ${s.slice(0, 4)}` : '';
export const today = () => new Date().toISOString().slice(0, 10);
export const nid = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
export const kindName = (k: string) => k === 'school' ? 'School' : k === 'individual' ? 'Individual' : 'Business';

const ORDER_SQL = `SELECT o.*, c.name customer,
 (SELECT COALESCE(SUM(qty*(unit_price+decor_price)),0) FROM order_lines WHERE order_id=o.id) subtotal,
 (SELECT COALESCE(SUM(qty),0) FROM order_lines WHERE order_id=o.id) pieces,
 (SELECT COUNT(*) FROM order_lines WHERE order_id=o.id) line_count,
 (SELECT COALESCE(SUM(amount),0) FROM payments WHERE order_id=o.id) paid
 FROM orders o JOIN customers c ON c.id=o.customer_id`;
const fin = (o: any) => o && ({ ...o, total: o.subtotal - o.discount, balance: o.subtotal - o.discount - o.paid });

export const orders = async (m: Mode, where = '', args: any[] = []) => (await all(m, `${ORDER_SQL} ${where} ORDER BY o.due`, args)).map(fin);
export const order = async (m: Mode, id: string) => fin(await first(m, `${ORDER_SQL} WHERE o.id=?`, [id]));
/** Lines without the heavy design JSON: `design` is 1/0 (a mockup is saved) and `thumb` is its small preview picture. */
export const lines = (m: Mode, id: string) => all<any>(m, "SELECT id, order_id, line_no, item, detail, qty, unit_price, decor_price, sizes, (design IS NOT NULL AND design!='null') design, json_extract(design,'$.thumb') thumb FROM order_lines WHERE order_id=? ORDER BY line_no", [id]);
/** Named, priced decorations per line (badges and lettering), read from the saved design JSON. Only lines with a decor_price are fetched. */
export async function decorations(m: Mode, orderId: string): Promise<Record<number, { name: string; price: number }[]>> {
  const rows = await all<any>(m, 'SELECT id, design FROM order_lines WHERE order_id=? AND decor_price>0', [orderId]);
  const out: Record<number, { name: string; price: number }[]> = {};
  for (const r of rows) {
    if (!r.design) continue;
    try {
      const d = JSON.parse(r.design); const items = d?.byG?.[d.g];
      if (Array.isArray(items)) out[r.id] = items.filter((it: any) => (Number(it.price) || 0) > 0)
        .map((it: any) => ({ name: it.kind === 'text' ? `"${it.text}" lettering` : it.name, price: Number(it.price) || 0 }));
    } catch { /* a line with unreadable design JSON just shows no decoration breakdown */ }
  }
  return out;
}
export const payments = (m: Mode, id: string) => all(m, 'SELECT * FROM payments WHERE order_id=? ORDER BY date', [id]);
export const changes = (m: Mode, id: string) => all(m, 'SELECT * FROM order_changes WHERE order_id=? ORDER BY date DESC, id DESC', [id]);
export const stageLog = (m: Mode, id: string) => all(m, 'SELECT * FROM stage_log WHERE order_id=? ORDER BY id DESC LIMIT 6', [id]);
export const customers = (m: Mode, term = '') => all(m, `SELECT c.*, (SELECT COUNT(*) FROM orders o WHERE o.customer_id=c.id AND o.stage!='Collected') open_orders FROM customers c WHERE c.name LIKE ?1 OR c.short_name LIKE ?1 OR c.phone LIKE ?1 ORDER BY c.name`, [`%${term}%`]);
export const customer = (m: Mode, id: string) => first<any>(m, 'SELECT * FROM customers WHERE id=?', [id]);
export const owed = async (m: Mode) => {
  const by: Record<string, any> = {};
  for (const o of (await orders(m)).filter(o => o.balance > 0 && o.stage !== 'Draft')) {
    const b = (by[o.customer_id] ||= { id: o.customer_id, name: o.customer, open: 0, owed: 0, oldest: null as string | null });
    b.open++; b.owed += o.balance; if (o.due && (!b.oldest || o.due < b.oldest)) b.oldest = o.due;
  }
  return Object.values(by).sort((a: any, b: any) => (a.oldest || '').localeCompare(b.oldest || ''));
};

// Garments and what each piece takes from stock.
export type Garment = { name: string; kind?: string; cloth?: string; sizes?: number[]; placements?: any[]; stock_per_piece?: { item: string; qty: number }[]; note?: string };
export const garmentList = async (m: Mode): Promise<Garment[]> => (await all(m, 'SELECT json FROM garments ORDER BY rowid')).map((r: any) => JSON.parse(r.json));

/** Stock with the reserved figure. The demo shows fixed sample numbers. Real data works it out from open orders and each garment's recipe. */
export async function stock(m: Mode) {
  const items = await all<any>(m, 'SELECT * FROM stock_items');
  let reserved: Record<string, number> = {};
  if (m === 'live') {
    const g = await garmentList(m); const byName = new Map(g.map(x => [x.name, x]));
    const open = await all<any>(m, "SELECT l.item, SUM(l.qty) qty FROM order_lines l JOIN orders o ON o.id=l.order_id WHERE o.stage IN ('Confirmed','In production','Ready') GROUP BY l.item");
    const byId = new Map(items.map(i => [i.name, i.id]));
    for (const r of open) for (const rc of byName.get(r.item)?.stock_per_piece || []) { const id = byId.get(rc.item); if (id) reserved[id] = (reserved[id] || 0) + r.qty * rc.qty; }
  }
  return items.map(s => { const r = m === 'live' ? Math.round((reserved[s.id] || 0) * 100) / 100 : s.reserved; return { ...s, reserved: r, available: Math.round((s.on_hand - r) * 100) / 100 }; }).sort((a, b) => a.available - b.available || a.name.localeCompare(b.name));
}
export const stockItem = async (m: Mode, id: string) => (await stock(m)).find(s => s.id === id) || null;
export const movements = (m: Mode, id: string) => all(m, 'SELECT * FROM stock_movements WHERE item_id=? ORDER BY date DESC, id DESC', [id]);
export const priceFor = async (m: Mode, customerId: string, item: string) => {
  const o = await first<any>(m, 'SELECT price FROM price_overrides WHERE customer_id=? AND item=?', [customerId, item]);
  if (o) return o.price as number;
  return ((await first<any>(m, 'SELECT standard FROM prices WHERE item=?', [item]))?.standard ?? null) as number | null;
};
