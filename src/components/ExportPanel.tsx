import { useState } from 'react';
import { Copy, FileDown, Link2, Mail } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { allStats, detectAnomalies, fmtCol } from '@/utils/dataProcessing';
import { curlExample, download, toCSV, toSQLInserts } from '@/utils/exportHelpers';
import { Button, Card, Modal, SectionTitle } from './Common';

export function ExportPanel() {
  const { rows, sourceName, pushToast } = useStore();
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const shareUrl = `https://dataflow.inc/share/${sourceName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-readonly`;

  const stats = allStats(rows);
  const anomalies = detectAnomalies(rows);

  const reportHtml = `<!doctype html><html><head><meta charset="utf-8"><title>DataFlow Report — ${sourceName}</title></head><body style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:32px"><h1>DataFlow Intelligence Report</h1><p>Source: ${sourceName} · ${rows.length} rows · ${new Date().toLocaleString()}</p><h2>Key stats</h2><ul>${stats.map((s) => `<li>${s.key}: mean ${fmtCol(s.key, s.mean)}, σ ${fmtCol(s.key, s.std)}, range ${fmtCol(s.key, s.min)}–${fmtCol(s.key, s.max)}</li>`).join('')}</ul><h2>Anomalies (${anomalies.length})</h2><ul>${anomalies.slice(0, 8).map((a) => `<li>row #${a.rowId} — ${a.explanation}</li>`).join('')}</ul></body></html>`;

  return (
    <section aria-label="Sharing and export">
      <SectionTitle eyebrow="07 · Share" title="Sharing & Export Module" sub="One-click reports, read-only share links, processed downloads, SQL and API handoff." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-heading font-bold">Generate Report</h3>
          <p className="mt-1 text-sm text-white/50">HTML/PDF snapshot with charts, insights and summary statistics.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => setReportOpen(true)}><FileDown className="h-4 w-4" /> Preview Report</Button>
            <Button variant="outline" onClick={() => download('dataflow-report.html', reportHtml, 'text/html')}>Download HTML</Button>
          </div>
          <h3 className="mt-6 font-heading font-bold">Share Link</h3>
          <div className="mt-2 flex gap-2">
            <input readOnly value={shareUrl} className="input-glass font-mono !text-xs" aria-label="Shareable URL" onFocus={(e) => e.target.select()} />
            <button className="chip shrink-0" onClick={() => { void navigator.clipboard?.writeText(shareUrl).catch(() => undefined); pushToast({ title: 'Link copied', body: shareUrl, tone: 'success' }); }}>
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs font-semibold text-white/60">Team Invite (mock)</p>
            <div className="mt-2 flex gap-2">
              <input placeholder="teammate@company.com" className="input-glass" aria-label="Invite email" id="invite-email" />
              <button className="chip shrink-0" onClick={() => pushToast({ title: 'Invite sent (mock)', body: 'Read-only dashboard access', tone: 'success' })}><Mail className="h-3.5 w-3.5" /> Invite</button>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-heading font-bold">Export Options</h3>
          <div className="mt-3 grid gap-2">
            <button className="chip justify-start" onClick={() => download('processed.csv', toCSV(rows), 'text/csv')}><FileDown className="h-3.5 w-3.5" /> Processed CSV ({rows.length} rows)</button>
            <button className="chip justify-start" onClick={() => download('processed.json', JSON.stringify(rows, null, 2), 'application/json')}><FileDown className="h-3.5 w-3.5" /> Processed JSON</button>
            <button className="chip justify-start" onClick={() => download('inserts.sql', toSQLInserts(rows.slice(0, 100)), 'text/sql')}><FileDown className="h-3.5 w-3.5" /> SQL INSERTs (first 100)</button>
            <button className="chip justify-start" onClick={() => { void navigator.clipboard?.writeText(curlExample()).catch(() => undefined); pushToast({ title: 'cURL copied', body: 'Mock API endpoint ready', tone: 'success' }); }}><Link2 className="h-3.5 w-3.5" /> Copy API endpoint (cURL)</button>
          </div>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-neon-cyan/90">{curlExample()}</pre>
        </Card>
      </div>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share dashboard">
        <p className="text-sm text-white/60">Read-only live dashboard link with current filters applied.</p>
      </Modal>
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report preview">
        <div className="max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
          <h4 className="font-heading font-bold">DataFlow Intelligence Report</h4>
          <p className="mt-1 font-mono text-xs text-white/45">{sourceName} · {rows.length} rows</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-white/70">
            {stats.map((s) => <li key={s.key}>{s.key}: mean {fmtCol(s.key, s.mean)}, σ {fmtCol(s.key, s.std)}</li>)}
          </ul>
          <p className="mt-3 text-white/70">{anomalies.length} anomalies flagged · forecast slope positive · top driver {stats[0]?.key}.</p>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => download('dataflow-report.html', reportHtml, 'text/html')}>Download</Button>
          <Button variant="ghost" onClick={() => setReportOpen(false)}>Close</Button>
        </div>
      </Modal>
    </section>
  );
}
