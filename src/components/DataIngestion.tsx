import { useRef, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Database, FileSpreadsheet, FileJson, ImagePlus, Table2, UploadCloud } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { DataRow } from '@/types';
import { fmtCol, validateRows } from '@/utils/dataProcessing';
import { Badge, Card, SectionTitle } from './Common';

function coerceRows(raw: Record<string, unknown>[]): DataRow[] {
  return raw.slice(0, 500).map((r, i) => {
    const get = (keys: string[], fb: unknown) => {
      for (const k of keys) {
        if (r[k] !== undefined && r[k] !== '') return r[k];
      }
      return fb;
    };
    const num = (v: unknown, fb: number) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fb;
    };
    return {
      id: num(get(['id', 'ID'], i + 1), i + 1),
      date: String(get(['date', 'Date', 'day'], `2024-01-${String((i % 28) + 1).padStart(2, '0')}`)),
      productName: String(get(['productName', 'product', 'name'], 'Unlabelled SKU')),
      region: String(get(['region', 'Region', 'geo'], 'Mumbai')),
      revenue: num(get(['revenue', 'Revenue', 'sales'], 0), 0),
      units: num(get(['units', 'Units', 'qty'], 0), 0),
      customersAcquired: num(get(['customersAcquired', 'customers', 'acquired'], 0), 0),
      conversionRate: num(get(['conversionRate', 'conversion'], 0), 0),
      churnRate: num(get(['churnRate', 'churn'], 0), 0),
      customerSatisfaction: num(get(['customerSatisfaction', 'csat', 'satisfaction'], 75), 75),
      marketingSpend: num(get(['marketingSpend', 'marketing', 'spend'], 0), 0),
      websiteTraffic: num(get(['websiteTraffic', 'traffic', 'visitors'], 0), 0),
    } as DataRow;
  });
}

export function DataIngestion() {
  const { rows, sourceName, setRows, pushToast } = useStore();
  const [db, setDb] = useState('PostgreSQL');
  const fileRef = useRef<HTMLInputElement>(null);
  const { warnings, errors } = validateRows(rows);
  const preview = rows.slice(0, 10);
  const cols = rows.length ? Object.keys(rows[0]) : [];

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const f = files[0];
    try {
      if (/\.(csv|txt)$/i.test(f.name)) {
        const text = await f.text();
        const parsed = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true });
        setRows(coerceRows(parsed.data), f.name);
        pushToast({ title: 'CSV ingested', body: `${parsed.data.length} rows from ${f.name}`, tone: 'success' });
      } else if (/\.jsonl?$/i.test(f.name)) {
        const text = await f.text();
        let data: Record<string, unknown>[];
        try {
          const j = JSON.parse(text);
          data = Array.isArray(j) ? j : [j];
        } catch {
          data = text.split('\n').filter(Boolean).map((l) => JSON.parse(l));
        }
        setRows(coerceRows(data), f.name);
        pushToast({ title: 'JSON ingested', body: `${data.length} records from ${f.name}`, tone: 'success' });
      } else if (/\.(xlsx|xls)$/i.test(f.name)) {
        const buf = await f.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
        setRows(coerceRows(json), f.name);
        pushToast({ title: 'Spreadsheet ingested', body: `${json.length} rows from ${f.name}`, tone: 'success' });
      } else if (/\.(png|jpe?g|webp)$/i.test(f.name)) {
        // Mock OCR: fabricate rows from image
        pushToast({ title: 'OCR complete (mock)', body: `${f.name} → 12 rows extracted`, tone: 'info' });
      } else {
        pushToast({ title: 'Unsupported file', body: f.name, tone: 'error' });
      }
    } catch (e) {
      pushToast({ title: 'Parse failed', body: String(e), tone: 'error' });
    }
  };

  return (
    <section aria-label="Data ingestion">
      <SectionTitle eyebrow="01 · Ingest" title="Multi-Source Data Ingestion Hub" sub="Drop CSV, JSON, Excel or images. Connect a warehouse, preview instantly, validate automatically." />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <button
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void handleFiles(e.dataTransfer.files);
            }}
            className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-neon-cyan/30 bg-neon-cyan/[0.03] px-6 py-10 text-center transition hover:border-neon-cyan/60 hover:bg-neon-cyan/[0.06]"
          >
            <UploadCloud className="h-8 w-8 text-neon-cyan" aria-hidden />
            <p className="mt-3 font-heading font-bold">Drag & drop files here</p>
            <p className="mt-1 text-xs text-white/45">CSV · JSON/JSONL · XLSX/XLS · PNG/JPG (OCR mock) · up to 500 rows</p>
            <span className="chip mt-4">Browse files</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".csv,.json,.jsonl,.xlsx,.xls,.png,.jpg,.jpeg,.webp"
            onChange={(e) => void handleFiles(e.target.files)}
            aria-label="Upload dataset file"
          />
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {[
              { icon: Table2, label: 'CSV structured' },
              { icon: FileJson, label: 'JSON nested' },
              { icon: FileSpreadsheet, label: 'Excel sheets' },
              { icon: ImagePlus, label: 'Image + OCR' },
            ].map((z) => (
              <span key={z.label} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-white/60">
                <z.icon className="h-4 w-4 text-neon-purple" /> {z.label}
              </span>
            ))}
          </div>
          <div className="mt-4">
            <label className="label" htmlFor="db-select">Database connection (mock)</label>
            <div className="flex gap-2">
              <select id="db-select" value={db} onChange={(e) => setDb(e.target.value)} className="input-glass">
                <option>PostgreSQL</option>
                <option>MongoDB</option>
                <option>MySQL</option>
              </select>
              <button
                className="chip shrink-0"
                onClick={() => pushToast({ title: `${db} connected (mock)`, body: 'schema: india_d2c_weekly · 120 rows', tone: 'success' })}
              >
                <Database className="h-3.5 w-3.5" /> Connect
              </button>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading font-bold">Live Preview — {sourceName}</h3>
            <span className="ml-auto font-mono text-xs text-white/40">{rows.length} rows</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Validation">
            <Badge tone="ok">✅ Format Valid</Badge>
            {warnings.slice(0, 2).map((w) => (
              <Badge key={w} tone="warn">⚠️ {w}</Badge>
            ))}
            {errors.map((e) => (
              <Badge key={e} tone="err">🔴 {e}</Badge>
            ))}
            {!warnings.length && !errors.length && <Badge tone="ok">No issues detected</Badge>}
          </div>
          <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
            <table className="data-table min-w-[640px]">
              <thead>
                <tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {preview.map((r) => (
                  <tr key={r.id}>{cols.map((c) => <td key={c}>{typeof r[c] === 'number' ? fmtCol(c, r[c]) : String(r[c])}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 font-mono text-[11px] text-white/35">Showing first 10 of {rows.length} rows · auto-mapped to canonical schema</p>
        </Card>
      </div>
    </section>
  );
}
