import { useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer,
  Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ArrowDownToLine, Download } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { AggType, ChartConfig, ColorScheme } from '@/types';
import { aggregate, allStats, columnStats, correlationMatrix, fmtCol, inferType, isNumeric, numericKeys, SCHEME_COLORS } from '@/utils/dataProcessing';
import { download, toCSV } from '@/utils/exportHelpers';
import { Badge, Card, SectionTitle } from './Common';
import { cn } from '@/lib/cn';

const AGGS: AggType[] = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];
const SCHEMES: ColorScheme[] = ['neon', 'grayscale', 'viridis'];

function ChartBlock({ cfg, onChange }: { cfg: ChartConfig; onChange: (c: ChartConfig) => void }) {
  const { rows } = useStore();
  const cols = rows.length ? Object.keys(rows[0]) : [];
  const nums = numericKeys(rows);
  const data: Array<Record<string, string | number>> = useMemo(() => {
    if (cfg.kind === 'scatter') {
      return rows.slice(0, 60).map((r) => ({ x: Number(r[cfg.xKey] ?? 0), y: Number(r[cfg.yKey] ?? 0), name: String(r.productName) }));
    }
    if (cfg.kind === 'line') {
      const agg = aggregate(rows, cfg);
      // preserve date order for line
      const order = new Map(rows.map((r) => [String(r[cfg.xKey]), 0]));
      const keys = [...order.keys()];
      return agg.sort((a, b) => keys.indexOf(a.name) - keys.indexOf(b.name));
    }
    return aggregate(rows, cfg);
  }, [rows, cfg]);
  const colors = SCHEME_COLORS[cfg.scheme];

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={cfg.title}
          onChange={(e) => onChange({ ...cfg, title: e.target.value })}
          className="w-44 bg-transparent font-heading text-sm font-bold outline-none focus:border-b focus:border-neon-cyan/50"
          aria-label="Chart title"
        />
        <span className="ml-auto flex gap-1">
          {(['bar', 'line', 'scatter', 'heatmap'] as const).map((k) => (
            <button key={k} onClick={() => onChange({ ...cfg, kind: k })} className={cn('rounded-full px-2.5 py-1 font-mono text-[11px]', cfg.kind === k ? 'bg-neon-cyan/15 text-neon-cyan' : 'text-white/40 hover:text-white')}>
              {k}
            </button>
          ))}
        </span>
      </div>
      <div className="mt-2 h-56">
        <ResponsiveContainer width="100%" height="100%">
          {cfg.kind === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" tick={false} axisLine={false} tickLine={false} />
              <YAxis width={48} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Bar>
            </BarChart>
          ) : cfg.kind === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" tick={false} axisLine={false} tickLine={false} />
              <YAxis width={48} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={2.5} dot={false} />
            </LineChart>
          ) : cfg.kind === 'scatter' ? (
            <ScatterChart>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="x" name={cfg.xKey} axisLine={false} tickLine={false} />
              <YAxis dataKey="y" name={cfg.yKey} width={48} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 12 }} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={data} fill={colors[1]} />
            </ScatterChart>
          ) : (
            <BarChart data={data} layout="vertical">
              <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={90} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {data.map((d, i) => {
                  const vals = data.map((x) => Number(x.value ?? 0));
                  const max = Math.max(...vals, 1);
                  const t = Number(d.value ?? 0) / max;
                  return <Cell key={i} fill={colors[Math.min(colors.length - 1, Math.floor(t * colors.length))]} />;
                })}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <label className="text-[11px] text-white/45">X <select value={cfg.xKey} onChange={(e) => onChange({ ...cfg, xKey: e.target.value })} className="input-glass mt-1 !py-1.5 text-xs">{cols.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="text-[11px] text-white/45">Y <select value={cfg.yKey} onChange={(e) => onChange({ ...cfg, yKey: e.target.value })} className="input-glass mt-1 !py-1.5 text-xs">{cfg.kind === 'scatter' ? nums.map((c) => <option key={c}>{c}</option>) : cols.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="text-[11px] text-white/45">Agg <select value={cfg.agg} onChange={(e) => onChange({ ...cfg, agg: e.target.value as AggType })} className="input-glass mt-1 !py-1.5 text-xs">{AGGS.map((a) => <option key={a}>{a}</option>)}</select></label>
        <label className="text-[11px] text-white/45">Scheme <select value={cfg.scheme} onChange={(e) => onChange({ ...cfg, scheme: e.target.value as ColorScheme })} className="input-glass mt-1 !py-1.5 text-xs">{SCHEMES.map((s) => <option key={s}>{s}</option>)}</select></label>
      </div>
      <div className="mt-2 flex gap-2">
        <button className="chip" onClick={() => download(`${cfg.title.replace(/\s+/g, '-').toLowerCase()}.csv`, toCSV(rows), 'text/csv')}><Download className="h-3 w-3" /> CSV</button>
        <button className="chip" onClick={() => download(`${cfg.title.replace(/\s+/g, '-').toLowerCase()}.json`, JSON.stringify(data, null, 2), 'application/json')}><ArrowDownToLine className="h-3 w-3" /> JSON</button>
        <span className="ml-auto font-mono text-[10px] text-white/30">PNG/SVG via screenshot · data export live</span>
      </div>
    </Card>
  );
}

export function DataExplorer() {
  const { rows, explorerTab, setExplorerTab, charts, setCharts } = useStore();
  const [sortKey, setSortKey] = useState('id');
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const pageSize = 10;

  const cols = rows.length ? Object.keys(rows[0]).filter((c) => !hidden.has(c)) : [];
  const filtered = useMemo(() => {
    const f = filter.toLowerCase();
    const r = f ? rows.filter((row) => Object.values(row).some((v) => String(v).toLowerCase().includes(f))) : [...rows];
    return r.sort((a, b) => {
      const av = a[sortKey] as string | number;
      const bv = b[sortKey] as string | number;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sortDir;
      return String(av).localeCompare(String(bv)) * sortDir;
    });
  }, [rows, filter, sortKey, sortDir]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const stats = useMemo(() => allStats(rows), [rows]);
  const corr = useMemo(() => correlationMatrix(rows), [rows]);

  return (
    <section aria-label="Data explorer">
      <SectionTitle eyebrow="02 · Explore" title="Advanced Data Explorer" sub="Sortable grid, configurable visual analytics, and auto-computed statistics." />
      <div className="mb-4 flex gap-2" role="tablist" aria-label="Explorer tabs">
        {([['grid', 'Data Grid'], ['charts', 'Visual Analytics'], ['stats', 'Statistical Summary']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={explorerTab === id} onClick={() => setExplorerTab(id)}
            className={cn('rounded-full px-4 py-2 text-sm font-medium transition', explorerTab === id ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30' : 'text-white/55 border border-white/10 hover:text-white')}>
            {label}
          </button>
        ))}
      </div>

      {explorerTab === 'grid' && (
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <input value={filter} onChange={(e) => { setFilter(e.target.value); setPage(0); }} placeholder="Filter rows…" className="input-glass max-w-xs" aria-label="Filter rows" />
            <span className="font-mono text-xs text-white/40">{filtered.length} / {rows.length} rows · {selected.size} selected</span>
            <span className="ml-auto flex flex-wrap gap-1">
              {rows.length ? Object.keys(rows[0]).map((c) => (
                <button key={c} title={`Toggle ${c}`} onClick={() => setHidden((h) => { const n = new Set(h); if (n.has(c)) n.delete(c); else n.add(c); return n; })}
                  className={cn('rounded-full border px-2 py-0.5 font-mono text-[10px]', hidden.has(c) ? 'border-white/10 text-white/30 line-through' : 'border-neon-cyan/25 text-neon-cyan/80')}>
                  {c}
                </button>
              )) : null}
            </span>
          </div>
          <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
            <table className="data-table min-w-[820px]">
              <thead>
                <tr>
                  <th><input type="checkbox" aria-label="Select all on page" checked={pageRows.every((r) => selected.has(Number(r.id)))} onChange={(e) => {
                    const n = new Set(selected);
                    pageRows.forEach((r) => { if (e.target.checked) n.add(Number(r.id)); else n.delete(Number(r.id)); });
                    setSelected(n);
                  }} /></th>
                  {cols.map((c) => (
                    <th key={c}>
                      <button onClick={() => { if (sortKey === c) setSortDir((d) => (d === 1 ? -1 : 1)); else { setSortKey(c); setSortDir(1); } }} className="flex items-center gap-1 hover:text-white" title={`Sort by ${c}`}>
                        {c} {sortKey === c ? (sortDir === 1 ? '▲' : '▼') : ''}
                      </button>
                      <span className="mt-0.5 inline-block"><Badge tone="mono">{inferType(c, rows[0]?.[c])}</Badge></span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.id}>
                    <td><input type="checkbox" aria-label={`Select row ${r.id}`} checked={selected.has(Number(r.id))} onChange={() => setSelected((s) => { const n = new Set(s); const id = Number(r.id); if (n.has(id)) n.delete(id); else n.add(id); return n; })} /></td>
                    {cols.map((c) => <td key={c}>{isNumeric(r[c]) ? fmtCol(c, Number(r[c])) : String(r[c])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <button className="chip" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>← Prev</button>
            <span className="font-mono text-xs text-white/45">Page {page + 1} / {pages}</span>
            <button className="chip" disabled={page + 1 >= pages} onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}>Next →</button>
          </div>
        </Card>
      )}

      {explorerTab === 'charts' && (
        <div className="grid gap-4 md:grid-cols-2">
          {charts.map((c) => (
            <ChartBlock key={c.id} cfg={c} onChange={(next) => setCharts(charts.map((x) => (x.id === c.id ? next : x)))} />
          ))}
        </div>
      )}

      {explorerTab === 'stats' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="font-heading font-bold">Descriptive statistics</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="data-table min-w-[560px]">
                <thead><tr><th>Column</th><th>Mean</th><th>Median</th><th>σ</th><th>Min</th><th>Max</th><th>Missing</th></tr></thead>
                <tbody>
                  {stats.map((s) => (
                    <tr key={s.key}><td className="!text-neon-cyan">{s.key}</td><td>{fmtCol(s.key, s.mean)}</td><td>{fmtCol(s.key, s.median)}</td><td>{fmtCol(s.key, s.std)}</td><td>{fmtCol(s.key, s.min)}</td><td>{fmtCol(s.key, s.max)}</td><td>{s.missing}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-white/70">Distribution — {stats[0]?.key}</h4>
              <DistMini rows={rows} k={stats[0]?.key ?? 'revenue'} />
            </div>
          </Card>
          <Card>
            <h3 className="font-heading font-bold">Correlation matrix</h3>
            <p className="mt-1 text-xs text-white/45">Pearson r across numeric columns. Strong pairs drive the “What drives X?” answers.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="border-collapse">
                <thead><tr><th className="p-1" />{corr.keys.map((k) => <th key={k} className="p-1 font-mono text-[10px] text-white/45">{k.slice(0, 8)}</th>)}</tr></thead>
                <tbody>
                  {corr.matrix.map((row, i) => (
                    <tr key={corr.keys[i]}>
                      <td className="p-1 font-mono text-[10px] text-white/45">{corr.keys[i].slice(0, 8)}</td>
                      {row.map((v, j) => (
                        <td key={j} title={`${corr.keys[i]} × ${corr.keys[j]} = ${v}`} className="p-1">
                          <span className="block h-9 w-12 rounded-lg border border-white/10 text-center font-mono text-[11px] leading-9"
                            style={{ background: `rgba(0,217,255,${Math.abs(v) * 0.55})`, color: Math.abs(v) > 0.5 ? '#000' : '#fff' }}>{v.toFixed(2)}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <MissingPanel />
          </Card>
        </div>
      )}
    </section>
  );
}

function DistMini({ rows, k }: { rows: ReturnType<typeof useStore.getState>['rows']; k: string }) {
  const s = columnStats(rows, k);
  const bins = 12;
  const counts = new Array(bins).fill(0) as number[];
  const span = Math.max(s.max - s.min, 1);
  rows.forEach((r) => {
    const v = r[k];
    if (typeof v === 'number') counts[Math.min(bins - 1, Math.floor(((v - s.min) / span) * bins))]++;
  });
  const max = Math.max(...counts, 1);
  return (
    <div className="mt-2 flex h-20 items-end gap-1" aria-hidden>
      {counts.map((c, i) => (
        <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-neon-purple/60 to-neon-cyan/80" style={{ height: `${(c / max) * 100}%` }} />
      ))}
    </div>
  );
}

function MissingPanel() {
  const { rows } = useStore();
  const cols = rows.length ? Object.keys(rows[0]) : [];
  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-white/70">Missing value analysis</h4>
      <div className="mt-2 space-y-1.5">
        {cols.map((c) => {
          const miss = rows.filter((r) => r[c] === null || r[c] === undefined || r[c] === '').length;
          const pct = (miss / Math.max(rows.length, 1)) * 100;
          return (
            <div key={c} className="flex items-center gap-2 text-xs">
              <span className="w-32 truncate font-mono text-white/55">{c}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-neon-green" style={{ width: `${100 - pct}%` }} />
              </div>
              <span className="font-mono text-white/40">{miss} missing</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
