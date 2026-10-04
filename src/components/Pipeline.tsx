import { useState } from 'react';
import { ArrowRight, CalendarClock, Eye, Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { PipelineKind, PipelineStep } from '@/types';
import { Badge, Card, Modal, SectionTitle } from './Common';

const KIND_COLOR: Record<PipelineKind, string> = {
  source: 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10',
  transform: 'text-neon-purple border-neon-purple/30 bg-neon-purple/10',
  enrich: 'text-neon-green border-neon-green/30 bg-neon-green/10',
  analyze: 'text-yellow-300 border-yellow-400/30 bg-yellow-400/10',
  export: 'text-neon-pink border-neon-pink/30 bg-neon-pink/10',
};

const PRESETS: { kind: PipelineKind; label: string; detail: string }[] = [
  { kind: 'source', label: 'Data Source', detail: 'CSV · API · DB' },
  { kind: 'transform', label: 'Filter', detail: 'revenue > 0' },
  { kind: 'transform', label: 'Aggregate', detail: 'SUM by region' },
  { kind: 'transform', label: 'Join', detail: 'merge datasets' },
  { kind: 'enrich', label: 'Compute Column', detail: 'revenue per unit' },
  { kind: 'enrich', label: 'Fill Nulls', detail: 'mean imputation' },
  { kind: 'analyze', label: 'Statistics', detail: 'descriptives' },
  { kind: 'analyze', label: 'Regression', detail: 'forecast 14d' },
  { kind: 'export', label: 'Export', detail: 'CSV download' },
];

export function Pipeline() {
  const { pipeline, setPipeline, rows, applyRows, pushToast } = useStore();
  const [open, setOpen] = useState(false);
  const [cron, setCron] = useState('0 9 * * MON');

  const add = (p: (typeof PRESETS)[number]) => {
    const step: PipelineStep = { id: `p${Date.now()}`, kind: p.kind, label: p.label, detail: p.detail, config: { op: p.label } };
    setPipeline([...pipeline, step]);
    setOpen(false);
  };

  const runStep = (s: PipelineStep) => {
    if (s.label === 'Filter') applyRows((r) => r.filter((x) => Number(x.revenue) > 0), 'Filter revenue > 0');
    else if (s.label === 'Fill Nulls' || s.label === 'Enrich') pushToast({ title: 'Enrich (mock)', body: 'Nulls filled · revenue_per_unit computed', tone: 'info' });
    else if (s.label === 'Aggregate') pushToast({ title: 'Aggregate (mock)', body: 'Grouped SUM by region → 5 rows', tone: 'info' });
    else pushToast({ title: `${s.label} executed`, body: s.detail, tone: 'success' });
  };

  return (
    <section aria-label="Pipeline builder">
      <SectionTitle eyebrow="05 · Automate" title="Data Pipeline & Workflow Automation" sub="Compose source → transform → enrich → analyze → export. Preview live state at every step." />
      <Card>
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2">
          {pipeline.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`min-w-44 rounded-2xl border px-4 py-3 ${KIND_COLOR[s.kind]}`}>
                <p className="font-mono text-[10px] uppercase tracking-widest opacity-70">{s.kind} · step {i + 1}</p>
                <p className="font-heading text-sm font-bold text-white">{s.label}</p>
                <p className="text-xs text-white/55">{s.detail}</p>
                <div className="mt-2 flex gap-1.5">
                  <button className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-white/70 hover:text-white" onClick={() => runStep(s)}><Eye className="mr-1 inline h-3 w-3" />Run</button>
                  <button className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-white/70 hover:text-neon-pink" aria-label={`Delete ${s.label}`}
                    onClick={() => setPipeline(pipeline.filter((x) => x.id !== s.id))}><Trash2 className="inline h-3 w-3" /></button>
                </div>
              </div>
              {i < pipeline.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-neon-cyan" aria-hidden />}
            </div>
          ))}
          <button onClick={() => setOpen(true)} className="flex min-w-36 flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 px-4 py-6 text-white/55 hover:border-neon-cyan/50 hover:text-neon-cyan">
            <Plus className="h-5 w-5" /> Add Step
          </button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="data-table min-w-[420px]">
              <thead><tr><th>id</th><th>product</th><th>region</th><th>revenue</th><th>units</th></tr></thead>
              <tbody>
                {rows.slice(0, 5).map((r) => (
                  <tr key={r.id}><td>{r.id}</td><td className="!font-body !text-white/80">{String(r.productName).slice(0, 18)}</td><td className="!font-body">{r.region}</td><td>{r.revenue}</td><td>{r.units}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="flex items-center gap-2 font-heading text-sm font-bold"><CalendarClock className="h-4 w-4 text-neon-purple" /> Schedule Runs (cron mock)</p>
            <div className="mt-2 flex gap-2">
              <input value={cron} onChange={(e) => setCron(e.target.value)} className="input-glass font-mono" aria-label="Cron expression" />
              <button className="chip shrink-0" onClick={() => pushToast({ title: 'Schedule saved (mock)', body: `Pipeline runs on "${cron}"`, tone: 'success' })}>Save</button>
            </div>
            <p className="mt-2 font-mono text-[11px] text-white/35">e.g. 0 9 * * MON → Mondays 09:00 · 0 2 * * * → daily 02:00</p>
          </div>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Insert pipeline step">
        <div className="grid gap-2">
          {PRESETS.map((p) => (
            <button key={`${p.kind}-${p.label}`} onClick={() => add(p)} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-left hover:border-neon-cyan/40">
              <Badge tone="mono">{p.kind}</Badge>
              <span className="text-sm font-semibold">{p.label}</span>
              <span className="ml-auto font-mono text-xs text-white/40">{p.detail}</span>
            </button>
          ))}
        </div>
      </Modal>
    </section>
  );
}
