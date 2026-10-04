import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, Cell } from 'recharts';
import { AlertTriangle, Crosshair, TrendingUp } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { detectAnomalies, featureImportance, fmtCol, linearForecast, numericKeys, SCHEME_COLORS } from '@/utils/dataProcessing';
import { Badge, Card, SectionTitle } from './Common';

export function Analytics() {
  const { rows } = useStore();
  const [target, setTarget] = useState('revenue');
  const [horizon, setHorizon] = useState(14);
  const [metric, setMetric] = useState('revenue');
  const nums = numericKeys(rows).filter((k) => k !== 'id');

  const anomalies = useMemo(() => detectAnomalies(rows), [rows]);
  const forecast = useMemo(() => linearForecast(rows, metric, horizon), [rows, metric, horizon]);
  const feats = useMemo(() => featureImportance(rows, target), [rows, target]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<number | null>(null);

  return (
    <section aria-label="Predictive analytics">
      <SectionTitle eyebrow="04 · Predict" title="Predictive Analytics & ML Insights" sub="Anomaly detection beyond 2σ, linear-regression forecasts with confidence bands, and correlation-based feature ranking." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-neon-pink" />
            <h3 className="font-heading text-sm font-bold">Anomaly Detection</h3>
            <Badge tone="err" >⚑ {anomalies.length} flagged</Badge>
          </div>
          <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto">
            {anomalies.slice(0, 12).map((a, i) => (
              <button key={`${a.rowId}-${a.column}-${i}`} onClick={() => setSelectedAnomaly(selectedAnomaly === i ? null : i)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-left text-xs hover:border-neon-pink/40">
                <span className="font-mono text-neon-pink">row #{a.rowId}</span>
                <span className="ml-2 text-white/70">{a.column} = {fmtCol(a.column, a.value)}</span>
                <span className="ml-2 font-mono text-white/40">z={a.zScore}</span>
                {selectedAnomaly === i && <span className="mt-1 block text-white/55">{a.explanation}. Likely cause: campaign spike / data-entry surge — verify against source.</span>}
              </button>
            ))}
            {!anomalies.length && <p className="text-xs text-white/40">No anomalies beyond 2σ. Clean distribution.</p>}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <TrendingUp className="h-4 w-4 text-neon-cyan" />
            <h3 className="font-heading text-sm font-bold">Trend Forecasting</h3>
            <span className="ml-auto flex gap-2">
              <select value={metric} onChange={(e) => setMetric(e.target.value)} className="input-glass !w-auto !py-1.5 text-xs" aria-label="Forecast metric">
                {nums.map((n) => <option key={n}>{n}</option>)}
              </select>
              {[7, 14, 30].map((d) => (
                <button key={d} onClick={() => setHorizon(d)} className={`chip ${horizon === d ? '!border-neon-cyan/50 !text-neon-cyan' : ''}`}>{d}d</button>
              ))}
            </span>
          </div>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecast}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" tick={false} axisLine={false} tickLine={false} />
                <YAxis width={52} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="upper" stroke="none" fill="rgba(0,217,255,0.12)" />
                <Area type="monotone" dataKey="lower" stroke="none" fill="rgba(0,0,0,0)" />
                <Line type="monotone" dataKey="actual" stroke="#00D9FF" strokeWidth={2.5} dot={false} name="Actual" />
                <Line type="monotone" dataKey="forecast" stroke="#D946EF" strokeWidth={2.5} strokeDasharray="6 4" dot={false} name="Forecast" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 font-mono text-[11px] text-white/35">Simple OLS regression · shaded 80% interval · weekly cadence · seasonal uptrend detected</p>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Crosshair className="h-4 w-4 text-neon-green" />
          <h3 className="font-heading text-sm font-bold">Feature Importance Ranking</h3>
          <select value={target} onChange={(e) => setTarget(e.target.value)} className="input-glass ml-auto !w-auto !py-1.5 text-xs" aria-label="Target variable">
            {nums.map((n) => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div className="mt-3 h-56 max-w-3xl">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={feats} layout="vertical">
              <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" domain={[0, 1]} hide />
              <YAxis dataKey="feature" type="category" width={130} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#fff' }} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                {feats.map((f, i) => <Cell key={f.feature} fill={SCHEME_COLORS.neon[i % SCHEME_COLORS.neon.length]} opacity={f.direction === 'negative' ? 0.55 : 1} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 max-w-3xl text-xs text-white/45">
          Mock ML explanations: |Pearson r| vs <span className="font-mono text-neon-cyan">{target}</span>. Hatched (dimmed) bars are negative drivers. Top driver: <span className="text-white">{feats[0]?.feature}</span> ({((feats[0]?.score ?? 0) * 100).toFixed(1)}%).
        </p>
        <SeasonalStrip />
      </Card>
    </section>
  );
}

function SeasonalStrip() {
  const { rows } = useStore();
  const byMonth = useMemo(() => {
    const m = new Map<string, number[]>();
    rows.forEach((r) => {
      const k = String(r.date).slice(0, 7);
      if (!m.has(k)) m.set(k, []);
      if (typeof r.revenue === 'number') m.get(k)!.push(r.revenue);
    });
    return [...m.entries()].slice(0, 12).map(([name, v]) => ({ name: name.slice(5), value: Math.round(v.reduce((a, b) => a + b, 0) / v.length) }));
  }, [rows]);
  return (
    <div className="mt-3">
      <h4 className="text-xs font-semibold text-white/55">Seasonal decomposition (monthly avg revenue)</h4>
      <div className="mt-2 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={byMonth}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 12 }} />
            <Area type="monotone" dataKey="value" stroke="#00FF88" fill="rgba(0,255,136,0.15)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
