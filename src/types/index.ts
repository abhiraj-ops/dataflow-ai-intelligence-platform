// ── Core data model ─────────────────────────────────────────────
export interface DataRow {
  id: number;
  date: string;
  productName: string;
  region: string;
  revenue: number;
  units: number;
  customersAcquired: number;
  conversionRate: number;
  churnRate: number;
  [key: string]: string | number;
}

export type ColumnType = 'INT' | 'STRING' | 'FLOAT' | 'BOOLEAN' | 'DATE';

export interface ColumnMeta {
  key: string;
  label: string;
  type: ColumnType;
}

export interface ColumnStats {
  key: string;
  count: number;
  missing: number;
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
}

export interface Anomaly {
  rowId: number;
  column: string;
  value: number;
  zScore: number;
  explanation: string;
}

export interface ForecastPoint {
  date: string;
  actual: number | null;
  forecast: number | null;
  lower: number | null;
  upper: number | null;
}

export interface FeatureScore {
  feature: string;
  score: number;
  direction: 'positive' | 'negative';
}

// ── Chat ────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  confidence?: number;
  table?: DataRow[];
  chartKind?: 'bar' | 'line' | 'scatter';
  chartX?: string;
  chartY?: string;
  followUps?: string[];
}

// ── Pipeline ────────────────────────────────────────────────────
export type PipelineKind = 'source' | 'transform' | 'enrich' | 'analyze' | 'export';

export interface PipelineStep {
  id: string;
  kind: PipelineKind;
  label: string;
  detail: string;
  config: Record<string, string>;
}

// ── Charts ──────────────────────────────────────────────────────
export type AggType = 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
export type ColorScheme = 'neon' | 'grayscale' | 'viridis';
export type ChartKind = 'bar' | 'line' | 'scatter' | 'heatmap';

export interface ChartConfig {
  id: string;
  kind: ChartKind;
  xKey: string;
  yKey: string;
  agg: AggType;
  scheme: ColorScheme;
  title: string;
}

// ── Misc ────────────────────────────────────────────────────────
export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export interface Toast {
  id: string;
  title: string;
  body?: string;
  tone: 'info' | 'success' | 'warn' | 'error';
}
