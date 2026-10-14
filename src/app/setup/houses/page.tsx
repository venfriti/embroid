import { getCtx } from '@/lib/auth';
import { all } from '@/lib/db';
import { customers, stock } from '@/lib/q';
import { CrestForm, DeleteBtn, HouseForm } from '@/components/Forms';
import { ListPicker } from '@/components/SetupBits';

export default async function Houses({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { mode } = await getCtx(); const cs = (await customers(mode)).filter((x: any) => x.kind === 'school');
  const sp = await searchParams; const cust = cs.find((x: any) => x.id === sp.c) || cs[0];
  if (!cust) return <p style={{ color: '#4B5563' }}>Add a school customer first. Houses and crests belong to a school.</p>;
  const hs = await all<any>(mode, 'SELECT * FROM houses WHERE customer_id=?', [cust.id]), cr = await all<any>(mode, 'SELECT * FROM crests WHERE customer_id=?', [cust.id]);
  const st = await stock(mode); const by = (n: string) => st.find(s => s.name === n);
  const onHand = (n: string) => { const s = by(n); return s ? { text: `${s.on_hand}${s.unit === 'metres' ? ' m' : ''} on hand`, short: s.available < 0 } : { text: '', short: false }; };
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, flexWrap: 'wrap' }}>
        <ListPicker label="School" value={cust.id} base="/setup/houses" options={cs.map((x: any) => [x.id, x.name] as [string, string])} />
        <span style={{ fontSize: 15, color: '#3F4A58', paddingBottom: 12 }}>{hs.length} {hs.length === 1 ? 'house' : 'houses'} · {cr.length} {cr.length === 1 ? 'crest' : 'crests'} · artwork saved for reorders</span>
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1.5 1 560px', minWidth: 0, background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', background: '#EEF1F4', fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#4B5563' }}><span style={{ flex: '0 0 48px' }} /><span style={{ flex: '0 0 110px' }}>House</span><span style={{ flex: 1 }}>Jersey cloth</span><span style={{ flex: 1 }}>House badge</span><span style={{ flex: '0 0 80px' }} /></div>
          {hs.length === 0 && <div style={{ padding: 18, color: '#4B5563' }}>No houses yet.</div>}
          {hs.map((h: any) => { const j = onHand(h.jersey), b = onHand(h.badge); return (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 18px', borderTop: '1px solid #E8ECF0' }}>
              <span style={{ flex: '0 0 34px', width: 34, height: 34, borderRadius: 9, background: h.colour, marginRight: 14 }} />
              <b style={{ flex: '0 0 110px', fontSize: 16 }}>{h.house}</b>
              <span style={{ flex: 1 }}><div>{h.jersey}</div>{j.text && <div style={{ fontSize: 14, color: j.short ? '#8A1C13' : '#4B5563' }}>{j.text}</div>}</span>
              <span style={{ flex: 1 }}><div>{h.badge}</div>{b.text && <div style={{ fontSize: 14, color: b.short ? '#8A1C13' : '#4B5563' }}>{b.text}{b.short ? ' · short for open orders' : ''}</div>}</span>
              <span style={{ flex: '0 0 80px', textAlign: 'right' }}><DeleteBtn table="house" id={h.id} label={h.house} /></span>
            </div>); })}
          <HouseForm customerId={cust.id} />
        </div>
        <div style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fff', border: '1px solid #DDE2E8', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px 6px', fontSize: 13, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#4B5563' }}>Crests</div>
            {cr.length === 0 && <div style={{ padding: '6px 20px 14px', color: '#4B5563' }}>No crests yet.</div>}
            {cr.map((c: any) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 20px', borderTop: '1px solid #E8ECF0' }}>
                <span style={{ flex: '0 0 66px', width: 66, height: 66, borderRadius: 10, border: '1px solid #DDE2E8', background: '#F4F6F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="34" height="40" viewBox="0 0 34 40" aria-hidden="true"><path d="M17 2l14 5v12c0 9-6 15-14 19C9 34 3 28 3 19V7z" fill="#0E5C63" /><path d="M17 12v14M10 19h14" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></svg></span>
                <span style={{ flex: 1 }}><b style={{ fontSize: 17 }}>{c.name}</b><div style={{ fontSize: 15, color: '#3F4A58' }}>{c.used_on}</div>{c.badge && <div style={{ fontSize: 14, color: '#4B5563' }}>{c.badge}{by(c.badge) ? ` · ${by(c.badge)!.on_hand} on hand` : ''}</div>}</span>
                <DeleteBtn table="crest" id={c.id} label={c.name} />
              </div>))}
            <CrestForm customerId={cust.id} />
          </div>
          <div style={{ background: '#E5EFF1', borderRadius: 14, padding: '14px 18px', fontSize: 16, lineHeight: 1.4, color: '#3F4A58' }}>Each house badge is a stock item. Choosing a house on an order reserves that house&apos;s jersey and badge by itself.</div>
        </div>
      </div>
    </>
  );
}
