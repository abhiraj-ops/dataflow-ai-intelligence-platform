import { useState } from 'react';
import { Eraser, Replace, SplitSquareHorizontal } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { isNumeric, numericKeys } from '@/utils/dataProcessing';
import { Card, SectionTitle } from './Common';

export function Prepare() {
  const { rows, applyRows } = useStore();
  const nums = numericKeys(rows).filter((k) => k !== 'id');
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [nullMode, setNullMode] = useState('Drop rows');
  const [outMode, setOutMode] = useState('Remove');
  const [normMode, setNormMode] = useState('Min-Max');

  return (
    <section aria-label="Data preparation">
      <SectionTitle eyebrow="06 · Prepare" title="Advanced Filters & Data Preparation" sub="Regex find/replace, null handling, outlier treatment, type conversion, dedupe and normalization." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h3 className="flex items-center gap-2 font-heading text-sm font-bold"><Replace className="h-4 w-4 text-neon-cyan" /> Find & Replace (regex)</h3>
          <label className="label mt-3" htmlFor="find">Pattern</label>
          <input id="find" value={find} onChange={(e) => setFind(e.target.value)} placeholder="e.g. ^AI\s*" className="input-glass font-mono" />
          <label className="label mt-2" htmlFor="rep">Replacement</label>
          <input id="rep" value={replace} onChange={(e) => setReplace(e.target.value)} placeholder="e.g. AI-" className="input-glass font-mono" />
          <button className="chip mt-3" onClick={() => {
            if (!find) return;
            try {
              const rx = new RegExp(find, 'g');
              applyRows((r) => r.map((row) => ({ ...row, productName: String(row.productName).replace(rx, replace), region: String(row.region).replace(rx, replace) })), `Replace /${find}/`);
            } catch { /* invalid regex ignored */ }
          }}>Apply to text columns</button>
        </Card>

        <Card>
          <h3 className="flex items-center gap-2 font-heading text-sm font-bold"><Eraser className="h-4 w-4 text-neon-green" /> Nulls · Outliers · Types</h3>
          <label className="label mt-3" htmlFor="nullmode">Null handling</label>
          <select id="nullmode" value={nullMode} onChange={(e) => setNullMode(e.target.value)} className="input-glass">
            <option>Drop rows</option><option>Forward fill</option><option>Mean imputation</option><option>Custom value: 0</option>
          </select>
          <label className="label mt-2" htmlFor="outmode">Outlier treatment (&gt;2σ)</label>
          <select id="outmode" value={outMode} onChange={(e) => setOutMode(e.target.value)} className="input-glass">
            <option>Remove</option><option>Cap</option><option>Winsorize</option>
          </select>
          <button className="chip mt-3" onClick={() => {
            if (nullMode === 'Drop rows') applyRows((r) => r.filter((row) => Object.values(row).every((v) => v !== '' && v !== null && v !== undefined)), 'Drop null rows');
            else if (nullMode === 'Mean imputation') applyRows((r) => {
              const means = new Map(nums.map((k) => [k, r.reduce((a, x) => a + (isNumeric(x[k]) ? (x[k] as number) : 0), 0) / Math.max(r.length, 1)]));
              return r.map((row) => { const n = { ...row }; nums.forEach((k) => { if (!isNumeric(n[k])) n[k] = +(means.get(k) ?? 0).toFixed(2); }); return n; });
            }, 'Mean imputation');
            else if (nullMode.startsWith('Custom')) applyRows((r) => r.map((row) => { const n = { ...row }; Object.keys(n).forEach((k) => { if (n[k] === '' || n[k] == null) n[k] = 0; }); return n; }), 'Fill custom 0');
            else applyRows((r) => { let last = ''; return r.map((row) => { const n = { ...row }; Object.keys(n).forEach((k) => { if (n[k] === '' || n[k] == null) n[k] = last; last = String(n[k]); }); return n; }); }, 'Forward fill');
          }}>Apply null strategy</button>
          <button className="chip mt-2" onClick={() => {
            applyRows((r) => {
              if (outMode === 'Remove') {
                return r.filter((row) => nums.every((k) => {
                  const vals = r.map((x) => (isNumeric(x[k]) ? (x[k] as number) : 0));
                  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
                  const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length) || 1;
                  return Math.abs(((isNumeric(row[k]) ? (row[k] as number) : mean) - mean) / sd) <= 2;
                }));
              }
              return r.map((row) => {
                const n = { ...row };
                nums.forEach((k) => {
                  const vals = r.map((x) => (isNumeric(x[k]) ? (x[k] as number) : 0)).sort((a, b) => a - b);
                  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
                  const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length) || 1;
                  const v = isNumeric(n[k]) ? (n[k] as number) : mean;
                  const cap = mean + 2 * sd;
                  const floor = mean - 2 * sd;
                  if (v > cap || v < floor) n[k] = outMode === 'Cap' ? Math.min(Math.max(v, floor), cap) : +(mean + Math.sign(v - mean) * 2 * sd).toFixed(2);
                });
                return n;
              });
            }, `Outliers: ${outMode}`);
          }}>Apply outlier: {outMode}</button>
        </Card>

        <Card>
          <h3 className="flex items-center gap-2 font-heading text-sm font-bold"><SplitSquareHorizontal className="h-4 w-4 text-neon-purple" /> Dedupe · Normalize</h3>
          <label className="label mt-3" htmlFor="norm">Normalization</label>
          <select id="norm" value={normMode} onChange={(e) => setNormMode(e.target.value)} className="input-glass">
            <option>Min-Max</option><option>Z-score</option><option>Percentile</option>
          </select>
          <button className="chip mt-3" onClick={() => {
            applyRows((r) => {
              const mins = new Map(nums.map((k) => [k, Math.min(...r.map((x) => (isNumeric(x[k]) ? (x[k] as number) : 0)))]));
              const maxs = new Map(nums.map((k) => [k, Math.max(...r.map((x) => (isNumeric(x[k]) ? (x[k] as number) : 0)))]));
              const means = new Map(nums.map((k) => [k, r.reduce((a, x) => a + (isNumeric(x[k]) ? (x[k] as number) : 0), 0) / r.length]));
              return r.map((row) => {
                const n = { ...row };
                nums.forEach((k) => {
                  const v = isNumeric(n[k]) ? (n[k] as number) : 0;
                  if (normMode === 'Min-Max') { const span = (maxs.get(k) ?? 1) - (mins.get(k) ?? 0) || 1; n[k] = +((v - (mins.get(k) ?? 0)) / span).toFixed(4); }
                  else if (normMode === 'Z-score') { const z = (v - (means.get(k) ?? 0)) / 10000; n[k] = Number(z.toFixed(4)); }
                  else { const le = r.filter((x) => (isNumeric(x[k]) ? (x[k] as number) : 0) <= v).length; n[k] = +(le / r.length).toFixed(4); }
                });
                return n;
              });
            }, `Normalize ${normMode}`);
          }}>Apply {normMode}</button>
          <button className="chip mt-2" onClick={() => applyRows((r) => [...new Map(r.map((x) => [JSON.stringify(x), x])).values()], 'Deduplicate')}>Remove exact duplicates</button>
          <p className="mt-3 font-mono text-[11px] text-white/35">Type conversion auto-applied on ingest · dates parsed · categories binned by region/product</p>
        </Card>
      </div>
    </section>
  );
}
