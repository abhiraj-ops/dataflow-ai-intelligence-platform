import { ArrowUpRight, IndianRupee, MapPin, Package, Percent } from 'lucide-react';
import { useStore, type SectionId } from '@/store/useStore';
import { fmtINRCompact, fmtIndianCompact } from '@/utils/dataProcessing';
import { Button } from './Common';

const NAV: { id: SectionId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'ingest', label: 'Ingest' },
  { id: 'explorer', label: 'Explore' },
  { id: 'ai', label: 'AI Chat' },
  { id: 'predict', label: 'Predict' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'prepare', label: 'Prepare' },
  { id: 'export', label: 'Export' },
  { id: 'settings', label: 'Settings' },
];

export function Header() {
  const { rows, sourceName, section, setSection } = useStore();
  const revenue = rows.reduce((a, r) => a + (typeof r.revenue === 'number' ? r.revenue : 0), 0);
  const units = rows.reduce((a, r) => a + (typeof r.units === 'number' ? r.units : 0), 0);
  const metros = new Set(rows.map((r) => String(r.region))).size;
  const convVals = rows.map((r) => r.conversionRate).filter((v): v is number => typeof v === 'number');
  const avgConv = convVals.length ? convVals.reduce((a, b) => a + b, 0) / convVals.length : 0;

  const kpis = [
    { icon: IndianRupee, label: 'Lifetime Revenue', value: fmtINRCompact(revenue), sub: `${rows.length} weeks · all-India` },
    { icon: Package, label: 'Units Sold', value: fmtIndianCompact(units), sub: 'across 8 grocery SKUs' },
    { icon: MapPin, label: 'Metros Covered', value: String(metros), sub: 'Mumbai · Delhi NCR · Bengaluru +5' },
    { icon: Percent, label: 'Avg Conversion', value: `${avgConv.toFixed(1)}%`, sub: 'visitors → buyers' },
  ];

  return (
    <header className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 pt-6 md:px-6">
        <nav aria-label="Primary" className="liquid-glass flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="mr-2 flex items-center gap-2 font-heading text-sm font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple text-black">◈</span>
            DataFlow
          </span>
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setSection(n.id)}
              aria-current={section === n.id ? 'page' : undefined}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                section === n.id
                  ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30'
                  : 'text-white/55 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {n.label}
            </button>
          ))}
          <span className="ml-auto flex items-center gap-2 text-xs text-white/60">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute h-full w-full animate-ping rounded-full bg-neon-green opacity-60" />
              <span className="h-2.5 w-2.5 rounded-full bg-neon-green" />
            </span>
            System Ready
          </span>
        </nav>

        {section === 'dashboard' && (
          <div className="data-grid py-10 text-center md:py-14">
            <p className="eyebrow">Weekly D2C sales · 8 Indian metros · All values in ₹</p>
            <h1 className="mx-auto mt-3 max-w-3xl font-heading text-4xl font-bold leading-tight md:text-6xl">
              Ask your sales data anything.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm text-white/60 md:text-base">
              {rows.length} weeks of grocery orders across Mumbai, Delhi NCR, Bengaluru and five more
              metros. Top products, festive spikes and next month&apos;s demand — answered in plain English.
            </p>
            <p className="mx-auto mt-3 font-mono text-xs text-white/35">
              {sourceName} · lifetime revenue {fmtINRCompact(revenue)}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 no-print">
              <Button onClick={() => setSection('ai')}>
                Start Analyzing <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-10 grid gap-4 text-left sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((k) => (
                <div key={k.label} className="data-card">
                  <k.icon className="h-5 w-5 text-neon-cyan" aria-hidden />
                  <p className="mt-3 font-heading text-3xl font-bold">{k.value}</p>
                  <p className="mt-1 text-sm font-medium text-white/80">{k.label}</p>
                  <p className="text-xs text-white/40">{k.sub}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
