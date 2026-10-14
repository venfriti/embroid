import { getCtx } from '@/lib/auth';
import { garmentList, stock } from '@/lib/q';
import { first } from '@/lib/db';
import { GarmentForm } from '@/components/Forms';
import { Link } from '@/components/ui';

export default async function Garments({ searchParams }: { searchParams: Promise<{ g?: string; new?: string }> }) {
  const { mode } = await getCtx(); const sp = await searchParams;
  const gs = await garmentList(mode); const cur = sp.new ? null : gs.find(g => g.name === sp.g) || gs[0] || null;
  const st = await stock(mode); const names = st.map((s: any) => s.name);
  const meta = Object.fromEntries(st.map((s: any) => [s.name, { type: s.type, unit: s.unit }]));
  const price = cur ? ((await first<any>(mode, 'SELECT standard FROM prices WHERE item=?', [cur.name]))?.standard ?? null) : null;
  const row = (on: boolean) => ({ display: 'block', minHeight: 44, padding: '12px 16px', textDecoration: 'none', fontSize: 16, color: on ? '#0A4449' : '#1B2430', fontWeight: on ? 700 : 500, background: on ? '#E3EEF0' : '#fff', borderLeft: on ? '4px solid #0E5C63' : '4px solid transparent', borderBottom: '1px solid #E8ECF0' } as const);
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ flex: '0 0 280px', background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, overflow: 'hidden' }}>
        {gs.map(g => <Link key={g.name} href={`/setup/garments?g=${encodeURIComponent(g.name)}`} style={row(cur?.name === g.name)}>{g.name}</Link>)}
        <Link href="/setup/garments?new=1" style={{ display: 'block', padding: '12px 16px', fontWeight: 600, fontSize: 16, textDecoration: 'underline' }}>+ New garment</Link>
      </div>
      <GarmentForm key={cur?.name || 'new'} g={cur} stockNames={names} stockMeta={meta} price={price} />
    </div>
  );
}
