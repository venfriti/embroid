// Turns data/seed/uniform_app_dummy_data.json into data/demo-seed.sql (the sample data for the public demo).
// Load it with:  npx wrangler d1 execute DEMO_DB --remote --file=data/demo-seed.sql   (or --local)
import fs from 'fs';
const D = JSON.parse(fs.readFileSync('data/seed/uniform_app_dummy_data.json', 'utf8'));
const q = v => v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : "'" + String(v).replace(/'/g, "''") + "'";
const out = [];
const ins = (t, o) => out.push(`INSERT INTO ${t}(${Object.keys(o).join(',')}) VALUES(${Object.values(o).map(q).join(',')});`);
// start clean so the file can be re-run
for (const t of ['customers','orders','order_lines','payments','order_changes','stage_log','stock_items','stock_movements','prices','price_overrides','garments','houses','crests']) out.push(`DELETE FROM ${t};`);
out.push("DELETE FROM sqlite_sequence;");

for (const c of D.customers) ins('customers', { id: c.id, name: c.name, kind: c.kind, contact: c.contact, phone: c.phone, email: c.email, address: c.address, payment_terms: c.payment_terms, deposit_pct: c.deposit_pct, created: '2026-08-01' });
const NOW = '2026-10-14T09:00:00Z';
const ago = (min) => new Date(Date.parse(NOW) - min * 60000).toISOString();
// Orders that were only described by a balance on the screens get plain lines that add up to the right money.
const extra = [
  { id: 'o2', c: 'c1', name: 'Sports day kit', inv: 'INV-2026-0151', due: '2026-10-30', stage: 'Confirmed', paid: 0, upd: ago(60 * 24 * 12), lines: [["Sports day tee", 'Mixed houses', 20, 1000]] },
  { id: 'o3', c: 'c1', name: 'Prefect blazers', inv: 'INV-2026-0152', due: '2026-10-05', stage: 'Confirmed', paid: 0, upd: ago(60 * 24 * 9), lines: [['Prefect blazer', 'Navy · school crest', 11, 10000]] },
  { id: 'o4', c: 'c1', name: 'Staff polos', inv: 'INV-2026-0153', due: '2026-11-13', stage: 'Confirmed', paid: 0, upd: ago(60 * 24 * 6), lines: [['Staff polo', 'Navy · school crest', 18, 5000]] },
  { id: 'o5', c: 'c3', name: 'Term uniforms', inv: 'INV-2026-0139', due: '2026-10-09', stage: 'In production', paid: 0, upd: ago(60 * 24 * 8), lines: [['Term uniform set', 'Mixed sizes', 21, 10000]] },
  { id: 'o6', c: 'c4', name: 'Staff and prefect wear', inv: 'INV-2026-0150', due: '2026-10-16', stage: 'In production', paid: 35000, upd: ago(60 * 24 * 4), lines: [['Staff and prefect wear', 'Mixed', 7, 10000]] },
  { id: 'o7', c: 'c5', name: 'Wedding shirts', inv: 'INV-2026-0148', due: '2026-10-19', stage: 'In production', paid: 40000, upd: ago(60 * 24 * 7), lines: [['Ankara shirt', "Customer's fabric", 2, 34000]] },
  { id: 'o8', c: 'c2', name: 'Autumn 2025 uniforms', inv: 'INV-2025-0212', placed: '2025-09-10', due: '2025-09-24', stage: 'Collected', paid: 'all', upd: ago(60 * 24 * 400), lines: [["Boys' shirt", 'White · school crest', 30, 4500], ['Girls blouse', 'White · school crest', 30, 4500], ['Pinafore', 'Grey · crest', 20, 11000], ["Boys' shorts", 'Grey', 30, 2800], ['Tie', 'Striped', 60, 1200]] },
  { id: 'o9', c: 'c2', name: 'Spring blazers', inv: null, due: '2026-11-20', stage: 'Draft', paid: 0, upd: ago(60 * 24 * 2), lines: [['Blazer', 'Navy · crest', 12, 14000], ['Blazer', 'Navy · crest, large', 8, 15000], ['Tie', 'Striped', 40, 1200], ['Badge, sewn on', 'Crest', 20, 400], ['Name tag', 'Woven', 20, 150], ['Cap', 'Navy', 10, 1500]] },
  { id: 'o10', c: 'c1', name: 'House vests', inv: null, due: null, stage: 'Draft', paid: 0, upd: ago(12), lines: [["Boys' vest", 'Red house', 10, 2500], ["Girls' vest", 'Blue house', 10, 2500], ['Cap badge', 'Crest', 20, 150], ['Name tag', 'Woven', 20, 100]] },
  { id: 'o11', c: 'c5', name: 'Ankara set', inv: null, due: '2026-10-31', stage: 'Draft', paid: 0, upd: ago(60 * 24), lines: [['Ankara shirt', "Customer's fabric · chest pocket, side pockets", 1, 38000], ['Ankara trousers', "Customer's fabric · side pockets", 1, 30000]] },
];
for (const o of D.orders) {
  if (o.id === 'o1') { ins('orders', { id: 'o1', customer_id: o.customer_id, name: o.name, invoice_no: o.invoice_no, placed: o.placed, due: o.due, stage: o.stage, discount: o.discount, updated: ago(60 * 24 * 4) }); continue; }
}
for (const e of extra) {
  ins('orders', { id: e.id, customer_id: e.c, name: e.name, invoice_no: e.inv, placed: e.placed || (e.inv ? '2026-09-20' : null), due: e.due, stage: e.stage, discount: 0, updated: e.upd });
  let n = 1, tot = 0;
  for (const [item, detail, qty, price] of e.lines) { ins('order_lines', { order_id: e.id, line_no: n++, item, detail, qty, unit_price: price }); tot += qty * price; }
  const paid = e.paid === 'all' ? tot : e.paid;
  if (paid) ins('payments', { order_id: e.id, date: e.stage === 'Collected' ? '2025-09-24' : '2026-10-02', method: 'Transfer', amount: paid });
}
const sizes = { 1: '6:2,8:3,10:3,12:3,14:3,16:2', 2: '6:1,8:2,10:3,12:2,14:2,16:2', 3: '6:1,8:2,10:3,12:2,14:1,16:1', 4: '6:2,8:3,10:3,12:3,14:2,16:1' };
for (const l of D.order_lines) ins('order_lines', { order_id: l.order_id, line_no: l.line_no, item: l.item, detail: l.detail, qty: l.qty, unit_price: l.unit_price, sizes: sizes[l.line_no] || null });
for (const p of D.payments) ins('payments', { order_id: p.order_id, date: p.date, method: p.method, amount: p.amount });
for (const c of D.order_changes_after_confirming) ins('order_changes', { order_id: c.order_id, date: c.date, by: c.by, change: c.change, amount: c.amount, reason: c.reason });
for (const s of D.stock_items) ins('stock_items', { id: s.id, name: s.name, type: s.type, unit: s.unit, on_hand: s.on_hand, reserved: s.reserved ?? 0, supplier: s.supplier, cost: s.cost, warn_below: s.warn_below });
for (const m of D.stock_movements_grey_pleat) ins('stock_movements', { item_id: m.item_id, date: m.date, kind: m.kind, reference: m.reference, change: m.change, on_hand_after: m.on_hand_after });
for (const p of D.prices) { ins('prices', { item: p.item, standard: p.standard }); if (p.greenfield !== p.standard) ins('price_overrides', { customer_id: 'c1', item: p.item, price: p.greenfield, reason: p.item === "Girls' skirt" ? 'Agreed 8 Oct' : 'Bulk rate' }); }
for (const g of D.garments) ins('garments', { name: g.name, json: JSON.stringify(g) });
for (const h of D.houses_greenfield) ins('houses', { customer_id: 'c1', house: h.house, colour: h.colour, jersey: h.jersey, badge: h.badge });
for (const c of D.crests_greenfield) ins('crests', { customer_id: 'c1', name: c.name, used_on: c.used_on, badge: c.badge });
// Saved 3D mockups for a few demo lines (made in the studio; keyed "order:line_no"). Each carries a small preview picture.
// decor_price mirrors what the save-design API computes: the sum of each decoration's price, for the garment the design is actually on.
if (fs.existsSync('data/demo-designs.json')) {
  const designs = JSON.parse(fs.readFileSync('data/demo-designs.json', 'utf8'));
  for (const [k, d] of Object.entries(designs)) {
    const [oid, no] = k.split(':');
    const items = d.byG?.[d.g];
    const decor = Array.isArray(items) ? items.reduce((s, it) => s + (Number(it.price) || 0), 0) : 0;
    out.push(`UPDATE order_lines SET design=${q(JSON.stringify(d))}, decor_price=${q(decor)} WHERE order_id=${q(oid)} AND line_no=${Number(no)};`);
  }
}
fs.writeFileSync('data/demo-seed.sql', out.join('\n') + '\n');
console.log('wrote data/demo-seed.sql with', out.length, 'statements');
