import { requireLive } from '@/lib/auth';
import { batch, run, first } from '@/lib/db';
/** One endpoint for the setup screens: prices, price overrides, garments, houses, crests. */
export async function POST(req: Request) {
  const g = await requireLive(); if ('res' in g) return g.res;
  const b = (await req.json() as any);
  switch (b.kind) {
    case 'price': {
      const item = String(b.item || '').trim(), price = Math.floor(Number(b.price));
      if (!item || !(price >= 0)) return Response.json({ error: 'Item and price are needed' }, { status: 400 });
      if (b.customer_id) {
        const std = await first<any>('live', 'SELECT standard FROM prices WHERE item=?', [item]);
        if (std && std.standard === price) await run('live', 'DELETE FROM price_overrides WHERE customer_id=? AND item=?', [b.customer_id, item]);
        else await run('live', 'INSERT INTO price_overrides(customer_id,item,price,reason) VALUES(?,?,?,?) ON CONFLICT(customer_id,item) DO UPDATE SET price=excluded.price, reason=excluded.reason', [b.customer_id, item, price, b.reason || null]);
      } else await run('live', 'INSERT INTO prices(item,standard) VALUES(?,?) ON CONFLICT(item) DO UPDATE SET standard=excluded.standard', [item, price]);
      return Response.json({ ok: true });
    }
    case 'garment': {
      const name = String(b.name || '').trim(); if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });
      const rec = (b.recipe || []).filter((r: any) => r.item && Number(r.qty) > 0).map((r: any) => ({ item: String(r.item), qty: Number(r.qty) }));
      const json = JSON.stringify({ name, kind: b.kind_of || null, cloth: b.cloth || null, sizes: (b.sizes || []).map(Number), placements: b.placements || [], stock_per_piece: rec });
      await run('live', 'INSERT INTO garments(name,json) VALUES(?,?) ON CONFLICT(name) DO UPDATE SET json=excluded.json', [name, json]);
      return Response.json({ ok: true });
    }
    case 'house': {
      if (!b.customer_id || !String(b.house || '').trim()) return Response.json({ error: 'School and house name are needed' }, { status: 400 });
      await run('live', 'INSERT INTO houses(customer_id,house,colour,jersey,badge) VALUES(?,?,?,?,?)', [b.customer_id, b.house, b.colour || '#888888', b.jersey || null, b.badge || null]);
      return Response.json({ ok: true });
    }
    case 'crest': {
      if (!b.customer_id || !String(b.name || '').trim()) return Response.json({ error: 'School and crest name are needed' }, { status: 400 });
      await run('live', 'INSERT INTO crests(customer_id,name,used_on,badge) VALUES(?,?,?,?)', [b.customer_id, b.name, b.used_on || null, b.badge || null]);
      return Response.json({ ok: true });
    }
    case 'delete': {
      const t = { house: 'houses', crest: 'crests' }[b.table as string]; if (!t) return Response.json({ error: 'Unknown' }, { status: 400 });
      await run('live', `DELETE FROM ${t} WHERE id=?`, [Number(b.id)]); return Response.json({ ok: true });
    }
  }
  return Response.json({ error: 'Unknown request' }, { status: 400 });
}
