import { SetupTabs } from '@/components/SetupBits';
import { h1 } from '@/components/ui';
export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="page" style={{ maxWidth: 'none', padding: '16px 32px 48px', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}><h1 style={h1}>Setup</h1><span style={{ fontSize: 15, color: '#4B5563' }}>Prices, garments and house colours</span></div>
      <SetupTabs />
      {children}
    </main>
  );
}
