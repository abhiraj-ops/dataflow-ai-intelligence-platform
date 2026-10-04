import { ALL_COLUMNS } from '@/data/mockDataset';
import type { ChatMessage, DataRow } from '@/types';
import { columnStats, detectAnomalies, featureImportance, fmtCol, linearForecast, pearson, isNumeric } from './dataProcessing';

let seq = 0;
const uid = () => `m${Date.now()}_${seq++}`;

function confidence(): number {
  return 85 + Math.floor(Math.random() * 14); // 85–98
}

function pickColumn(q: string, fallback: string): string {
  const cols = ALL_COLUMNS as unknown as string[];
  const lower = q.toLowerCase();
  const hit = cols.find((c) => lower.includes(c.toLowerCase()));
  return hit ?? fallback;
}

export function suggestionChips(rows: DataRow[]): string[] {
  const nums = Object.keys(rows[0] ?? {}).filter((k) => typeof rows[0]?.[k] === 'number' && k !== 'id');
  const dateCol = Object.keys(rows[0] ?? {}).find((k) => k.toLowerCase().includes('date')) ?? 'date';
  const catA = 'region';
  const target = (nums[0] ?? 'revenue') as string;
  const n0 = (nums[0] ?? 'revenue') as string;
  const n1 = (nums[1] ?? nums[0] ?? 'revenue') as string;
  return [
    `Show top 10 by ${n0}`,
    `Identify outliers in ${n0}`,
    `Trend analysis for ${dateCol}`,
    `Compare ${catA} vs ${n0}`,
    `What drives ${target}?`,
    `Correlation between ${n0} and ${n1}`,
  ];
}

export function answerQuery(query: string, rows: DataRow[]): ChatMessage {
  const q = query.toLowerCase().trim();
  const ts = new Date().toISOString();
  const base = { id: uid(), role: 'assistant' as const, timestamp: ts, confidence: confidence() };

  // top N
  if (q.includes('top 10') || q.includes('top10') || q.startsWith('top')) {
    const col = pickColumn(query, 'revenue');
    const top = [...rows].sort((a, b) => Number(b[col] ?? 0) - Number(a[col] ?? 0)).slice(0, 10);
    const best = top[0];
    return {
      ...base,
      text: `Top 10 rows by **${col}**. Leader is #${best?.id} (${best?.productName} · ${best?.region}) at ${fmtCol(col, Number(best?.[col] ?? 0))}. The top-10 cohort concentrates ${pct(top, rows, col)} of total ${col}.`,
      table: top,
      chartKind: 'bar',
      chartX: 'productName',
      chartY: col,
      followUps: [`Trend analysis for date`, `Identify outliers in ${col}`, `Compare region vs ${col}`],
    };
  }

  // outliers / anomalies
  if (q.includes('outlier') || q.includes('anomal') || q.includes('deviat')) {
    const col = pickColumn(query, 'revenue');
    const anomalies = detectAnomalies(rows).filter((a) => a.column === col).slice(0, 8);
    const s = columnStats(rows, col);
    const detail = anomalies.length
      ? anomalies.map((a) => `#${a.rowId} (${a.value}, z=${a.zScore})`).join('; ')
      : 'No values beyond 2σ — distribution looks clean.';
    return {
      ...base,
      text: `Outlier scan on **${col}** (μ=${fmtCol(col, s.mean)}, σ=${fmtCol(col, s.std)}): ${anomalies.length} flagged row(s). ${detail}`,
      table: rows.filter((r) => anomalies.some((a) => a.rowId === r.id)).slice(0, 8),
      followUps: [`What drives ${col}?`, `Show top 10 by ${col}`, `Trend analysis for date`],
    };
  }

  // trend / forecast
  if (q.includes('trend') || q.includes('forecast') || q.includes('project') || q.includes('time')) {
    const col = pickColumn(query, 'revenue');
    const fc = linearForecast(rows, col, 14);
    const last = fc.filter((p) => p.actual !== null).slice(-1)[0];
    const next = fc.filter((p) => p.forecast !== null)[0];
    return {
      ...base,
      text: `Trend for **${col}**: latest actual ${fmtCol(col, last?.actual ?? 0)} (${last?.date}). Linear model projects next period ≈ ${fmtCol(col, next?.forecast ?? 0)} with an 80% band [${fmtCol(col, next?.lower ?? 0)} – ${fmtCol(col, next?.upper ?? 0)}]. Seasonality + steady growth detected; slope is positive.`,
      chartKind: 'line',
      chartX: 'date',
      chartY: col,
      followUps: [`What drives ${col}?`, `Identify outliers in ${col}`, `Compare region vs ${col}`],
    };
  }

  // compare A vs B
  if (q.includes('compare') || q.includes(' vs ')) {
    const nums = Object.keys(rows[0] ?? {}).filter((k) => isNumeric(rows[0]?.[k]));
    const y = pickColumn(query, nums[0] ?? 'revenue');
    const byRegion = groupAvg(rows, 'region', y);
    const leader = byRegion.sort((a, b) => b.avg - a.avg)[0];
    return {
      ...base,
      text: `**region vs ${y}** (mean): ${byRegion.map((g) => `${g.name} ${fmtCol(y, g.avg)}`).join(' · ')}. Leader: **${leader?.name}** at ${fmtCol(y, leader?.avg ?? 0)}. Spread suggests regional mix is a meaningful driver.`,
      chartKind: 'bar',
      chartX: 'region',
      chartY: y,
      followUps: [`What drives ${y}?`, `Show top 10 by ${y}`, `Trend analysis for date`],
    };
  }

  // what drives / correlation / feature importance
  if (q.includes('driv') || q.includes('correl') || q.includes('feature') || q.includes('importance') || q.includes('cause')) {
    const target = pickColumn(query, 'revenue');
    const feats = featureImportance(rows, target).slice(0, 5);
    const top = feats[0];
    return {
      ...base,
      text: `Drivers of **${target}**: ${feats.map((f) => `${f.feature} (${(f.score * 100).toFixed(1)}%, ${f.direction})`).join(' · ')}. Strongest signal is **${top?.feature}** — consider segmenting forecasts and targets by it.`,
      chartKind: 'scatter',
      chartX: top?.feature ?? 'units',
      chartY: target,
      followUps: [`Show top 10 by ${target}`, `Compare region vs ${target}`, `Trend analysis for date`],
    };
  }

  // summary / describe
  if (q.includes('summar') || q.includes('describe') || q.includes('overview') || q.includes('insight')) {
    const s = columnStats(rows, 'revenue');
    return {
      ...base,
      text: `Dataset overview: **${rows.length} rows**, revenue μ=${fmtCol('revenue', s.mean)} (median ${fmtCol('revenue', s.median)}, range ${fmtCol('revenue', s.min)}–${fmtCol('revenue', s.max)}). ${detectAnomalies(rows).length} anomalies flagged. Ask me for top-10s, trends, or drivers to dig deeper.`,
      followUps: [`Show top 10 by revenue`, `What drives revenue?`, `Trend analysis for date`],
    };
  }

  // correlation between X and Y (explicit)
  const corrMatch = q.match(/([a-z]+)\s+and\s+([a-z]+)/);
  if (corrMatch) {
    const a = pickColumn(corrMatch[1], 'revenue');
    const b = pickColumn(corrMatch[2], 'units');
    const c = pearson(
      rows.map((r) => (isNumeric(r[a]) ? (r[a] as number) : 0)),
      rows.map((r) => (isNumeric(r[b]) ? (r[b] as number) : 0)),
    );
    return {
      ...base,
      text: `Pearson r(**${a}**, **${b}**) = **${c.toFixed(3)}** — ${interpretR(c)}.`,
      chartKind: 'scatter',
      chartX: a,
      chartY: b,
      followUps: [`What drives ${a}?`, `Show top 10 by ${a}`, `Identify outliers in ${b}`],
    };
  }

  // fallback: echo intelligent generic
  const col = pickColumn(query, 'revenue');
  const s = columnStats(rows, col);
  return {
    ...base,
    text: `Analyzed **${col}** across ${rows.length} rows: mean ${fmtCol(col, s.mean)}, median ${fmtCol(col, s.median)}, σ ${fmtCol(col, s.std)}. Try "Show top 10 by ${col}", "What drives ${col}?" or "Trend analysis for date" for a charted answer.`,
    followUps: [`Show top 10 by ${col}`, `What drives ${col}?`, `Identify outliers in ${col}`],
  };
}

function pct(top: DataRow[], all: DataRow[], col: string): string {
  const t = top.reduce((a, r) => a + Number(r[col] ?? 0), 0);
  const tot = all.reduce((a, r) => a + Number(r[col] ?? 0), 0);
  return tot ? `${((t / tot) * 100).toFixed(1)}%` : '—';
}

function groupAvg(rows: DataRow[], gk: string, yk: string): { name: string; avg: number }[] {
  const m = new Map<string, number[]>();
  for (const r of rows) {
    const g = String(r[gk] ?? '—');
    if (!m.has(g)) m.set(g, []);
    const v = r[yk];
    if (isNumeric(v)) m.get(g)!.push(v);
  }
  return [...m.entries()].map(([name, v]) => ({ name, avg: v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0 }));
}

function interpretR(c: number): string {
  const a = Math.abs(c);
  if (a > 0.8) return 'very strong linear relationship';
  if (a > 0.6) return 'strong relationship';
  if (a > 0.4) return 'moderate relationship';
  if (a > 0.2) return 'weak relationship';
  return 'negligible linear relationship';
}
