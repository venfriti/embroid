'use client';
export function PrintBtns({ pdf = true }: { pdf?: boolean }) {
  const b = { minHeight: 48, padding: '0 18px', display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 600, borderRadius: 12, cursor: 'pointer' } as const;
  return (<>
    <button type="button" onClick={() => window.print()} style={{ ...b, color: '#0E5C63', background: '#fff', border: '1px solid #0E5C63' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 9V4h10v5M7 17H5v-6h14v6h-2M7 14h10v6H7z" /></svg>Print</button>
    {pdf && <button type="button" onClick={() => window.print()} style={{ ...b, padding: '0 20px', color: '#fff', background: '#0E5C63', border: 0 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></svg>Download PDF</button>}
  </>);
}
