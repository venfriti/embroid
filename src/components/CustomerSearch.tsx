'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Initial } from './ui';

type Match = { id: string; name: string; kind: string; phone: string | null };

export function CustomerSearch({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const onChange = (v: string) => {
    setValue(v);
    if (timer.current) clearTimeout(timer.current);
    const term = v.trim();
    if (!term) { setMatches(null); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      const r = await fetch(`/api/customers?q=${encodeURIComponent(term)}`);
      const j: any = await r.json().catch(() => null);
      setMatches(j?.ok ? j.customers : []);
      setOpen(true);
    }, 200);
  };

  return (
    <div ref={boxRef} style={{ flex: '1 1 480px', minWidth: 0, position: 'relative' }}>
      <label htmlFor="customer-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Search customers</label>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3F4A58" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ position: 'absolute', left: 20, top: 20 }}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
      <input id="customer-search" name="q" value={value} onChange={e => onChange(e.target.value)} onFocus={() => matches && setOpen(true)} autoComplete="off" type="search" placeholder="Search school or customer name" style={{ width: '100%', boxSizing: 'border-box', height: 64, padding: '0 20px 0 56px', fontSize: 20, color: '#1B2430', background: '#FFFFFF', border: '2px solid #0E5C63', borderRadius: 14 }} />
      {open && matches && (
        <div role="listbox" style={{ position: 'absolute', zIndex: 10, top: 72, left: 0, right: 0, background: '#FFFFFF', border: '1px solid #DDE2E8', borderRadius: 12, boxShadow: '0 8px 24px rgba(27,36,48,.12)', overflow: 'hidden' }}>
          {matches.length === 0 && <div style={{ padding: '14px 18px', color: '#4B5563' }}>Nobody matches “{value.trim()}”. <Link href="/customers/new" style={{ fontWeight: 600 }}>Add them as a new customer</Link></div>}
          {matches.map((m, i) => (
            <Link key={m.id} href={`/customers/${m.id}`} role="option" style={{ width: '100%', boxSizing: 'border-box', minHeight: 56, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', textDecoration: 'none', background: '#FFFFFF', borderBottom: i === matches.length - 1 ? 0 : '1px solid #E8ECF0', color: '#1B2430' }}>
              <Initial name={m.name} kind={m.kind.toLowerCase()} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{m.name}</span>
                <span style={{ fontSize: 13, color: '#4B5563' }}>{m.kind}{m.phone ? ` · ${m.phone}` : ''}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
