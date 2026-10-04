import type { AggType, Anomaly, ChartConfig, ColumnStats, DataRow, FeatureScore, ForecastPoint } from '@/types';

export function isNumeric(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export function numericKeys(rows: DataRow[]): string[] {
  if (!rows.length) return [];
  return Object.keys(rows[0]).filter((k) => rows.some((r) => isNumeric(r[k])));
}

export function inferType(key: string, sample: unknown): 'INT' | 'STRING' | 'FLOAT' | 'BOOLEAN' | 'DATE' {
  if (typeof sample === 'boolean') return 'BOOLEAN';
  if (typeof sample === 'number') return Number.isInteger(sample) ? 'INT' : 'FLOAT';
  if (typeof sample === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(sample)) return 'DATE';
    return 'STRING';
  }
  if (key.toLowerCase().includes('date')) return 'DATE';
  return 'STRING';
}

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base] + (sorted[base + 1] !== undefined ? rest * (sorted[base + 1] - sorted[base]) : 0);
}

export function columnStats(rows: DataRow[], key: string): ColumnStats {
  const vals = rows.map((r) => r[key]).filter(isNumeric) as number[];
  const missing = rows.length - vals.length;
  if (!vals.length) {
    return { key, count: 0, missing, mean: 0, median: 0, std: 0, min: 0, max: 0 };
  }
  const sorted = [...vals].sort((a, b) => a - b);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
  return {
    key,
    count: vals.length,
    missing,
    mean,
    median: quantile(sorted, 0.5),
    std: Math.sqrt(variance),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

export function allStats(rows: DataRow[]): ColumnStats[] {
  return numericKeys(rows).map((k) => columnStats(rows, k));
}

export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}

export function correlationMatrix(rows: DataRow[]): { keys: string[]; matrix: number[][] } {
  const keys = numericKeys(rows);
  const cols = keys.map((k) => rows.map((r) => r[k]).filter(isNumeric) as number[]);
  const matrix = keys.map((_, i) => keys.map((_, j) => +pearson(cols[i], cols[j]).toFixed(3)));
  return { keys, matrix };
}

export function detectAnomalies(rows: DataRow[], threshold = 2): Anomaly[] {
  const out: Anomaly[] = [];
  for (const key of numericKeys(rows)) {
    const s = columnStats(rows, key);
    if (s.std === 0) continue;
    for (const row of rows) {
      const v = row[key];
      if (!isNumeric(v)) continue;
      const z = (v - s.mean) / s.std;
      if (Math.abs(z) > threshold) {
        out.push({
          rowId: row.id as number,
          column: key,
          value: v,
          zScore: +z.toFixed(2),
          explanation: `${key} = ${fmtCol(key, v)} deviates ${Math.abs(z).toFixed(1)}σ ${z > 0 ? 'above' : 'below'} mean (${fmtCol(key, s.mean)})`,
        });
      }
    }
  }
  return out.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore)).slice(0, 24);
}

export function linearForecast(rows: DataRow[], yKey: string, days = 14): ForecastPoint[] {
  const sorted = [...rows].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const ys = sorted.map((r) => (isNumeric(r[yKey]) ? (r[yKey] as number) : 0));
  const n = ys.length;
  const xs = ys.map((_, i) => i);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = my - slope * mx;
  // residual std for confidence band
  const resid = ys.map((y, i) => y - (slope * i + intercept));
  const std = Math.sqrt(resid.reduce((a, b) => a + b * b, 0) / Math.max(n, 1));

  const lastDate = new Date(String(sorted[sorted.length - 1]?.date ?? new Date().toISOString()));
  const hist: ForecastPoint[] = sorted.map((r, i) => ({
    date: String(r.date),
    actual: ys[i],
    forecast: null,
    lower: null,
    upper: null,
  }));
  const future: ForecastPoint[] = [];
  for (let k = 1; k <= days; k++) {
    const d = new Date(lastDate);
    d.setDate(d.getDate() + k * 7);
    const f = slope * (n + k - 1) + intercept;
    future.push({
      date: d.toISOString().slice(0, 10),
      actual: null,
      forecast: Math.max(0, Math.round(f)),
      lower: Math.max(0, Math.round(f - 1.28 * std)),
      upper: Math.round(f + 1.28 * std),
    });
  }
  return [...hist.slice(-24), ...future];
}

export function featureImportance(rows: DataRow[], target: string): FeatureScore[] {
  const keys = numericKeys(rows).filter((k) => k !== target && k !== 'id');
  const t = rows.map((r) => (isNumeric(r[target]) ? (r[target] as number) : 0));
  return keys
    .map((k) => {
      const c = pearson(
        rows.map((r) => (isNumeric(r[k]) ? (r[k] as number) : 0)),
        t,
      );
      return { feature: k, score: +Math.abs(c).toFixed(3), direction: (c >= 0 ? 'positive' : 'negative') as 'positive' | 'negative' };
    })
    .sort((a, b) => b.score - a.score);
}

export function aggregate(rows: DataRow[], cfg: ChartConfig): { name: string; value: number }[] {
  const groups = new Map<string, number[]>();
  for (const r of rows) {
    const g = String(r[cfg.xKey] ?? '—');
    const v = cfg.agg === 'COUNT' ? 1 : isNumeric(r[cfg.yKey]) ? (r[cfg.yKey] as number) : 0;
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(v);
  }
  const out = [...groups.entries()].map(([name, vals]) => {
    let value = 0;
    const agg: AggType = cfg.agg;
    if (agg === 'COUNT') value = vals.length;
    else if (agg === 'SUM') value = vals.reduce((a, b) => a + b, 0);
    else if (agg === 'AVG') value = vals.reduce((a, b) => a + b, 0) / vals.length;
    else if (agg === 'MIN') value = Math.min(...vals);
    else value = Math.max(...vals);
    return { name, value: +value.toFixed(2) };
  });
  return out.sort((a, b) => b.value - a.value).slice(0, 12);
}

export function validateRows(rows: DataRow[]): { warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];
  if (!rows.length) {
    errors.push('Dataset is empty');
    return { warnings, errors };
  }
  for (const key of Object.keys(rows[0])) {
    const missing = rows.filter((r) => r[key] === null || r[key] === undefined || r[key] === '').length;
    if (missing > 0) warnings.push(`${missing} missing value(s) in "${key}"`);
  }
  const ids = rows.map((r) => r.id);
  if (new Set(ids).size !== ids.length) errors.push('Duplicate id values detected');
  return { warnings, errors };
}

export function fmtNum(n: number | string): string {
  const v = typeof n === 'string' ? Number(n) : n;
  if (!Number.isFinite(v)) return String(n);
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(v);
}

const MONEY_COLUMNS = new Set(['revenue', 'marketingSpend']);

/** Format a cell value with ₹ for money columns, Indian digit grouping otherwise. */
export function fmtCol(key: string, n: number | string): string {
  const v = typeof n === 'string' ? Number(n) : n;
  if (!Number.isFinite(v)) return String(n);
  const grouped = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(v);
  return MONEY_COLUMNS.has(key) ? `₹${grouped}` : grouped;
}

/** Compact Indian-style count: Cr / L / K (no currency symbol). */
export function fmtIndianCompact(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (n >= 1e7) return `${(n / 1e7).toFixed(1)} Cr`;
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)} L`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}

/** Compact Indian-style rupees: ₹60.2 Cr, ₹4.8 L. */
export function fmtINRCompact(n: number): string {
  return `₹${fmtIndianCompact(n)}`;
}

export function fmtCompact(n: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export const SCHEME_COLORS: Record<string, string[]> = {
  neon: ['#00D9FF', '#D946EF', '#00FF88', '#FF006E', '#FFB800', '#7C6CFF'],
  grayscale: ['#FAFAFA', '#CFCFCF', '#9A9A9A', '#6B6B6B', '#454545', '#2A2A2A'],
  viridis: ['#440154', '#3B528B', '#21918C', '#5DC863', '#FDE725', '#F1644C'],
};
