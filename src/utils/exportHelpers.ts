import type { DataRow } from '@/types';

export function toCSV(rows: DataRow[]): string {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n');
}

export function toSQLInserts(rows: DataRow[], table = 'insights'): string {
  if (!rows.length) return `-- no rows`;
  const keys = Object.keys(rows[0]);
  const lit = (v: unknown) =>
    typeof v === 'number' ? String(v) : `'${String(v ?? '').replace(/'/g, "''")}'`;
  return rows
    .map((r) => `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map((k) => lit(r[k])).join(', ')});`)
    .join('\n');
}

export function curlExample(): string {
  return `curl -X GET "https://api.dataflow.inc/v1/datasets/active/rows?limit=50" \\\n  -H "Authorization: Bearer <YOUR_API_KEY>" \\\n  -H "Content-Type: application/json"`;
}

export function download(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
