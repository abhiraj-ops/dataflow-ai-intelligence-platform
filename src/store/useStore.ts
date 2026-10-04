import { create } from 'zustand';
import type { ChartConfig, ChatMessage, DataRow, PipelineStep, Toast } from '@/types';
import { MOCK_DATASET } from '@/data/mockDataset';
import { answerQuery } from '@/utils/aiResponses';

export type ExplorerTab = 'grid' | 'charts' | 'stats';
export type SectionId =
  | 'dashboard'
  | 'ingest'
  | 'explorer'
  | 'ai'
  | 'predict'
  | 'pipeline'
  | 'prepare'
  | 'export'
  | 'settings';

interface DataState {
  rows: DataRow[];
  sourceName: string;
  chat: ChatMessage[];
  charts: ChartConfig[];
  pipeline: PipelineStep[];
  section: SectionId;
  explorerTab: ExplorerTab;
  toasts: Toast[];
  processingSpeed: number;
  theme: 'dark' | 'light' | 'auto';

  setSection: (s: SectionId) => void;
  setExplorerTab: (t: ExplorerTab) => void;
  setRows: (rows: DataRow[], name?: string) => void;
  applyRows: (fn: (rows: DataRow[]) => DataRow[], label: string) => void;
  ask: (text: string) => void;
  clearChat: () => void;
  setCharts: (c: ChartConfig[]) => void;
  setPipeline: (p: PipelineStep[]) => void;
  pushToast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  setTheme: (t: 'dark' | 'light' | 'auto') => void;
}

let toastSeq = 0;

const defaultCharts: ChartConfig[] = [
  { id: 'c1', kind: 'bar', xKey: 'region', yKey: 'revenue', agg: 'SUM', scheme: 'neon', title: 'Revenue by Region' },
  { id: 'c2', kind: 'line', xKey: 'date', yKey: 'revenue', agg: 'SUM', scheme: 'neon', title: 'Revenue Trend' },
  { id: 'c3', kind: 'scatter', xKey: 'units', yKey: 'revenue', agg: 'SUM', scheme: 'neon', title: 'Units vs Revenue' },
  { id: 'c4', kind: 'heatmap', xKey: 'region', yKey: 'revenue', agg: 'AVG', scheme: 'viridis', title: 'Avg Revenue Heatmap' },
];

const defaultPipeline: PipelineStep[] = [
  { id: 'p1', kind: 'source', label: 'Data Source', detail: 'CSV · 120 rows', config: { source: 'CSV' } },
  { id: 'p2', kind: 'transform', label: 'Filter', detail: 'revenue > 0', config: { op: 'Filter' } },
  { id: 'p3', kind: 'analyze', label: 'Statistics', detail: 'Descriptives + correlation', config: { op: 'Statistics' } },
  { id: 'p4', kind: 'export', label: 'Export', detail: 'CSV download', config: { op: 'Download' } },
];

const seedChat: ChatMessage[] = [
  {
    id: 'seed-1',
    role: 'assistant',
    text: 'Connected to **india_d2c_weekly_sales.csv** — 120 weeks of grocery sales across 8 Indian metros, all values in ₹. Ask about top products, festive spikes, outliers or demand drivers.',
    timestamp: new Date().toISOString(),
    confidence: 98,
    followUps: ['Show top 10 by revenue', 'What drives revenue?', 'Trend analysis for date'],
  },
];

export const useStore = create<DataState>((set, get) => ({
  rows: MOCK_DATASET,
  sourceName: 'india_d2c_weekly_sales.csv',
  chat: seedChat,
  charts: defaultCharts,
  pipeline: defaultPipeline,
  section: 'dashboard',
  explorerTab: 'grid',
  toasts: [],
  processingSpeed: 48210,
  theme: 'dark',

  setSection: (section) => set({ section }),
  setExplorerTab: (explorerTab) => set({ explorerTab }),
  setRows: (rows, name) =>
    set((s) => ({
      rows,
      sourceName: name ?? s.sourceName,
      processingSpeed: 38000 + Math.floor(Math.random() * 25000),
    })),
  applyRows: (fn, label) => {
    const next = fn(get().rows);
    set({ rows: next, processingSpeed: 38000 + Math.floor(Math.random() * 25000) });
    get().pushToast({ title: 'Transformation applied', body: `${label} → ${next.length} rows`, tone: 'success' });
  },
  ask: (text) => {
    const q = text.trim();
    if (!q) return;
    const user: ChatMessage = { id: `u${Date.now()}`, role: 'user', text: q, timestamp: new Date().toISOString() };
    set((s) => ({ chat: [...s.chat, user] }));
    // Simulated streaming delay for realism
    setTimeout(() => {
      const reply = answerQuery(q, get().rows);
      set((s) => ({ chat: [...s.chat, reply] }));
    }, 450);
  },
  clearChat: () => set({ chat: [] }),
  setCharts: (charts) => set({ charts }),
  setPipeline: (pipeline) => set({ pipeline }),
  pushToast: (t) => {
    const id = `t${Date.now()}_${toastSeq++}`;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => get().dismissToast(id), 4200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setTheme: (theme) => set({ theme }),
}));
