import { getCtx, requireLive } from '@/lib/auth';
import { first, batch } from '@/lib/db';
import { naira, today } from '@/lib/q';

/** Sums the price typed on each decoration (badge/text) for the garment this design is actually on. */
function decorTotal(design: any): number {
  if (!design || !design.byG || !design.g) return 0;
  const items = design.byG[design.g];
  if (!Array.isArray(items)) return 0;
  return Math.max(0, Math.round(items.reduce((s: number, it: any) => s + (Number(it?.price) || 0), 0)));
}

function validDesign(d: any): boolean {
  if (d === null) return true;
  if (!d || typeof d !== 'object' || Array.isArray(d) || !['tee', 'shorts', 'trousers', 'ankara'].includes(d.g) || !d.byG || typeof d.byG !== 'object' || Array.isArray(d.byG)) return false;
  const hex = (v: any) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
  const finite = (v: any) => typeof v === 'number' && Number.isFinite(v);
  for (const [garment, items] of Object.entries(d.byG)) {
    if (!['tee', 'shorts', 'trousers', 'ankara'].includes(garment) || !Array.isArray(items) || items.length > 100) return false;
    for (const x of items as any[]) {
      if (!x || typeof x !== 'object' || !['badge', 'text'].includes(x.kind) || typeof x.name !== 'string' || x.name.length > 100 ||
          !Number.isSafeInteger(x.id) || !finite(x.x) || x.x < 0 || x.x > 1024 || !finite(x.y) || x.y < 0 || x.y > 1024 ||
          !finite(x.size) || x.size < 30 || x.size > 360 || !finite(x.rot) || Math.abs(x.rot) > 360 || !Number.isSafeInteger(x.price) || x.price < 0 || x.price > 100000000 ||
          !hex(x.c1) || !hex(x.c2) || (x.text !== undefined && (typeof x.text !== 'string' || x.text.length > 100)) ||
          (x.shape !== undefined && !['shield', 'round', 'star', 'laurel'].includes(x.shape)) ||
          (x.font !== undefined && !['block', 'script', 'serif', 'varsity'].includes(x.font)) ||
          (x.side !== undefined && !['front', 'back'].includes(x.side))) return false;
      if (x.pos !== undefined && (!x.pos || !finite(x.pos.x) || Math.abs(x.pos.x) > 10 || !finite(x.pos.y) || Math.abs(x.pos.y) > 10 || !finite(x.pos.z) || Math.abs(x.pos.z) > 10)) return false;
      if (x.nrm !== undefined && (!x.nrm || !finite(x.nrm.x) || Math.abs(x.nrm.x) > 1.1 || !finite(x.nrm.y) || Math.abs(x.nrm.y) > 1.1 || !finite(x.nrm.z) || Math.abs(x.nrm.z) > 1.1)) return false;
    }
  }
  if (d.gcol !== undefined) {
    if (!d.gcol || typeof d.gcol !== 'object' || Array.isArray(d.gcol)) return false;
    for (const [garment, colour] of Object.entries(d.gcol)) {
      if (!['tee', 'shorts', 'trousers', 'ankara'].includes(garment) || !colour || typeof colour !== 'object' ||
          typeof (colour as any).n !== 'string' || (colour as any).n.length > 40 || !hex((colour as any).c)) return false;
    }
  }
  if (d.ank !== undefined) {
    const a = d.ank;
    if (!a || typeof a !== 'object' || Array.isArray(a) || Object.keys(a).some(k => !['pat', 'cw', 'shape', 'w', 'scale', 'angle', 'collar', 'cuffs', 'pocket'].includes(k)) ||
        (a.pat !== undefined && !['diag', 'fans', 'blooms', 'zig', 'kente', 'rings'].includes(a.pat)) ||
        (a.cw !== undefined && (!Number.isInteger(a.cw) || a.cw < 0 || a.cw > 5)) ||
        (a.shape !== undefined && !['strip', 'bib', 'yoke', 'side', 'flap'].includes(a.shape)) ||
        (a.w !== undefined && (!finite(a.w) || a.w < 0 || a.w > 200)) ||
        (a.scale !== undefined && (!finite(a.scale) || a.scale < 0 || a.scale > 2)) ||
        (a.angle !== undefined && (!finite(a.angle) || Math.abs(a.angle) > 360)) ||
        ['collar', 'cuffs', 'pocket'].some(k => a[k] !== undefined && typeof a[k] !== 'boolean')) return false;
  }
  if (d.nextId !== undefined && (!Number.isSafeInteger(d.nextId) || d.nextId < 0)) return false;
  if (d.thumb !== undefined && (typeof d.thumb !== 'string' || d.thumb.length > 300000 || !d.thumb.startsWith('data:image/jpeg;base64,'))) return false;
  return true;
}

/** Save the studio mockup for a line. Stored as JSON on the line so reorders and the production sheet can reuse it.
 * Each decoration's price rolls up into decor_price, which the invoice adds on top of the line's unit price. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  const g = await requireLive(); if ('res' in g) return g.res;
  const { id, lineId } = await params; const b = (await req.json() as any);
  const design = b.design ?? null;
  // Older saved mockups predate decoration pricing. Treat their missing prices as zero.
  if (design?.byG && typeof design.byG === 'object' && !Array.isArray(design.byG)) {
    for (const items of Object.values(design.byG)) if (Array.isArray(items)) for (const item of items) if (item && item.price === undefined) item.price = 0;
  }
  if (!validDesign(design)) return Response.json({ error: 'That mockup has invalid design data' }, { status: 400 });
  const txt = JSON.stringify(design);
  if (txt.length > 900000) return Response.json({ error: 'That design is too large to save' }, { status: 413 });
  const o = await first<any>('live', 'SELECT * FROM orders WHERE id=?', [id]);
  const l = await first<any>('live', 'SELECT * FROM order_lines WHERE id=? AND order_id=?', [Number(lineId), id]);
  if (!o || !l) return Response.json({ error: 'Line not found' }, { status: 404 });
  const decor = decorTotal(b.design);
  const confirmed = o.stage !== 'Draft';
  const delta = decor - l.decor_price;
  if (confirmed && delta !== 0 && !String(b.reason || '').trim()) return Response.json({ error: 'Say why the decoration price is changing', reason_needed: true }, { status: 400 });
  const stmts: any[] = [['UPDATE order_lines SET design=?, decor_price=? WHERE id=? AND order_id=?', [txt, decor, Number(lineId), id]]];
  if (confirmed && delta !== 0) {
    stmts.push(['INSERT INTO order_changes(order_id,date,by,change,amount,reason) VALUES(?,?,?,?,?,?)', [id, today(), g.ctx.user?.name, `${l.item} decoration ${naira(l.decor_price)} → ${naira(decor)}`, delta * l.qty, b.reason]]);
  }
  stmts.push(['UPDATE orders SET updated=? WHERE id=?', [new Date().toISOString(), id]]);
  await batch('live', stmts);
  return Response.json({ ok: true, decor_price: decor });
}

/** Read one line with its saved mockup. Open to demo visitors too (they see sample data). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  const { mode } = await getCtx(); const { id, lineId } = await params;
  const l = await first<any>(mode, 'SELECT l.item, l.detail, l.qty, l.design, o.name order_name, o.stage order_stage, c.name customer FROM order_lines l JOIN orders o ON o.id=l.order_id JOIN customers c ON c.id=o.customer_id WHERE l.id=? AND l.order_id=?', [Number(lineId), id]);
  if (!l) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ ...l, mode, design: l.design ? JSON.parse(l.design) : null });
}
