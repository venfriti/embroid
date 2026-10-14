'use client';
import { Link } from './ui';
export function PrintBtn() {
  return <button type="button" onClick={() => window.print()} style={{ minHeight: 48, padding: '0 20px', display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 600, color: '#fff', background: '#0E5C63', border: 0, borderRadius: 12, cursor: 'pointer' }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 9V4h10v5M7 17H5v-6h14v6h-2M7 14h10v6H7z" /></svg>Print / Save as PDF</button>;
}
export function ExcelBtn({ rows, name }: { rows: (string | number)[][]; name: string }) {
  const go = () => {
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = name + '.csv'; a.click();
  };
  return <button type="button" onClick={go} style={{ minHeight: 48, padding: '0 18px', display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 600, color: '#0E5C63', background: '#fff', border: '1px solid #0E5C63', borderRadius: 12, cursor: 'pointer' }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></svg>Export to Excel</button>;
}
export function ReportHead({ title, sub, children }: { title: string; sub: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Link href="/reports" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>Reports</Link>
        <h1 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{title}</h1>
        <span style={{ fontSize: 15, color: '#4B5563' }}>{sub}</span>
      </div>
      <div className="noprint" style={{ display: 'flex', gap: 12 }}>{children}</div>
    </div>
  );
}
