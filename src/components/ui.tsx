import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

export const H: CSSProperties = { fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" };
export const h1: CSSProperties = { margin: 0, ...H, fontWeight: 700, fontSize: 40, lineHeight: 1.1, letterSpacing: '-0.02em' };
export const h2: CSSProperties = { margin: 0, ...H, fontWeight: 600, fontSize: 20 };
export const eyebrow: CSSProperties = { fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0E5C63' };
export const lede: CSSProperties = { margin: 0, fontSize: 17, lineHeight: 1.5, color: '#3F4A58', maxWidth: 620 };
export const card: CSSProperties = { background: '#FFFFFF', border: '1px solid #DDE2E8', borderRadius: 14 };
export const btnPri: CSSProperties = { minHeight: 48, padding: '0 22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 16, fontWeight: 600, color: '#fff', background: '#0E5C63', border: 0, borderRadius: 12, textDecoration: 'none', cursor: 'pointer' };
export const btnOut: CSSProperties = { ...btnPri, color: '#0E5C63', background: '#fff', border: '2px solid #0E5C63' };
export const btnSm: CSSProperties = { flex: '0 0 auto', minHeight: 44, padding: '0 18px', fontSize: 15, fontWeight: 600, color: '#0E5C63', background: '#FFFFFF', border: '2px solid #0E5C63', borderRadius: 10, display: 'inline-flex', alignItems: 'center', textDecoration: 'none', cursor: 'pointer' };

export const Eyebrow = ({ children }: { children: ReactNode }) => <span style={eyebrow}>{children}</span>;
export const Pill = ({ children, bg = '#FDE9B0', color = '#5A3A00' }: { children: ReactNode; bg?: string; color?: string }) =>
  <span style={{ fontSize: 12, fontWeight: 600, color, background: bg, padding: '2px 8px', borderRadius: 999 }}>{children}</span>;
export const Chev = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3F4A58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>;
export const Overdue = ({ children }: { children: ReactNode }) =>
  <span style={{ flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#8A1C13', background: '#FDECEA', border: '1px solid #E8A29B', padding: '4px 10px', borderRadius: 999 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17.4v.1" /></svg>{children}</span>;
export const DueSoon = ({ children }: { children: ReactNode }) =>
  <span style={{ flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#FFFFFF', background: '#1B2430', padding: '4px 10px', borderRadius: 999 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>{children}</span>;
const AV = [['#E3EEF0', '#0E5C63'], ['#F3E6D8', '#7A3E0C']];
export const Initial = ({ name, kind }: { name: string; kind?: string }) => {
  const [bg, fg] = AV[kind === 'individual' ? 1 : 0];
  const ch = (name.replace(/^(mrs?\.?|ms\.?|dr\.?|st\.?)\s+/i, '')[0] || name[0] || '?').toUpperCase();
  return <span style={{ flex: '0 0 auto', width: 40, height: 40, borderRadius: 10, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>{ch}</span>;
};
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const day = (s?: string | null) => { if (!s) return ''; const d = new Date(s + 'T00:00:00Z'); return `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MN[d.getUTCMonth()]}`; };
export const daysFrom = (s: string) => Math.round((Date.parse(s + 'T00:00:00Z') - Date.parse(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')) / 86400000);
export const ago = (iso?: string | null) => {
  if (!iso) return '';
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (m < 60) return `${Math.max(m, 1)} min ago`; const h = Math.round(m / 60); if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.round(h / 24); return d === 1 ? 'yesterday' : `${d} days ago`;
};
export const DueBadge = ({ due }: { due?: string | null }) => {
  if (!due) return null; const n = daysFrom(due);
  if (n < 0) return <Overdue>Overdue {day(due)}</Overdue>;
  if (n <= 3) return <DueSoon>{n === 0 ? 'Due today' : `Due in ${n} day${n === 1 ? '' : 's'}`}</DueSoon>;
  return <span style={{ flex: '0 0 auto', fontSize: 14, color: '#4B5563' }}>Due {day(due)}</span>;
};
const badge = (bg: string, color: string, icon: React.ReactNode, text: string) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color, background: bg, padding: '3px 10px', borderRadius: 999 }}>{icon}{text}</span>;
export const Pay = ({ o }: { o: any }) => o.paid <= 0 && o.total > 0
  ? badge('#FBE0DC', '#8A1C13', <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2.6" /></svg>, 'Unpaid')
  : o.balance > 0
    ? badge('#FDE9B0', '#5A3A00', <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2.6" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" /></svg>, 'Partial')
    : badge('#DDF2E3', '#14532D', <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>, 'Paid');

export const stripe = (o: any) => o.paid <= 0 && o.total > 0 ? '#C0392B' : o.balance > 0 ? '#B77900' : '#2F855A';
const COLOURS: [RegExp, string][] = [[/red/i, '#B3261E'], [/blue/i, '#2F5DA8'], [/green/i, '#2E7D4F'], [/yellow|gold/i, '#E8A317'], [/navy/i, '#1F2A44'], [/grey|gray/i, '#6B7684'], [/white/i, '#E5E7EB'], [/black/i, '#1B2430'], [/maroon|burgundy/i, '#7A1F2B']];
export const colourOf = (t: string) => COLOURS.find(([r]) => r.test(t))?.[1] || '#0E5C63';
export function Silhouette({ item, detail, size = 68 }: { item: string; detail?: string | null; size?: number }) {
  const c = colourOf((detail || '') + ' ' + item); const t = (item || '').toLowerCase();
  if (/pinafore|skirt|dress/.test(t)) return <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"><path d="M22 6h20l2 14 8 36H12l8-36z" fill={c} /></svg>;
  if (/trouser|short/.test(t)) return <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"><path d="M16 8h32l3 48H35l-3-30-3 30H13z" fill={c} /></svg>;
  if (!/tee|shirt|polo|vest|top|blazer|sweater|jersey|jacket|uniform|robe/.test(t)) return <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"><rect x="14" y="22" width="36" height="20" rx="4" fill={c} opacity=".85" /><circle cx="22" cy="32" r="3" fill="#fff" /></svg>;
  return <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"><path d="M22 8L8 16l6 11 6-4v33h24V23l6 4 6-11-14-8c-2 5-6 8-10 8s-8-3-10-8z" fill={c} /><circle cx="38" cy="25" r="3.6" fill="#FFFFFF" /></svg>;
}


export { Link };
