import { useState } from 'react';
import { KeyRound, Keyboard } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button, Card, Modal, SectionTitle } from './Common';

export function Settings() {
  const { theme, setTheme, pushToast } = useStore();
  const [retention, setRetention] = useState('90 days');
  const [alerts, setAlerts] = useState(true);
  const [reports, setReports] = useState(false);
  const [keysOpen, setKeysOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <section aria-label="Settings">
      <SectionTitle eyebrow="08 · Configure" title="Settings & Configuration" sub="Keys, retention, notifications, theme and shortcuts." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="flex items-center gap-2 font-heading text-sm font-bold"><KeyRound className="h-4 w-4 text-neon-cyan" /> API Key Management</h3>
          <div className="mt-3 space-y-2 font-mono text-xs">
            {[['Production', 'sk-live-••••••••••••4f2a'], ['Analytics', 'sk-anly-••••••••••••9c17']].map(([n, k]) => (
              <div key={n} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                <span className="text-white/60">{n}</span>
                <span className="ml-auto text-white/80">{k}</span>
                <button className="chip !py-0.5" onClick={() => setKeysOpen(true)}>Rotate</button>
              </div>
            ))}
          </div>
          <label className="label mt-4" htmlFor="retention">Data retention policy</label>
          <select id="retention" value={retention} onChange={(e) => setRetention(e.target.value)} className="input-glass">
            <option>30 days</option><option>90 days</option><option>365 days</option>
          </select>
          <div className="mt-4 space-y-2 text-sm">
            <label className="flex items-center gap-2 text-white/70"><input type="checkbox" checked={alerts} onChange={(e) => setAlerts(e.target.checked)} className="accent-cyan-400" /> Anomaly alerts</label>
            <label className="flex items-center gap-2 text-white/70"><input type="checkbox" checked={reports} onChange={(e) => setReports(e.target.checked)} className="accent-cyan-400" /> Scheduled reports</label>
          </div>
        </Card>
        <Card>
          <h3 className="font-heading text-sm font-bold">Appearance & Shortcuts</h3>
          <p className="label mt-3">Theme</p>
          <div className="flex gap-2" role="radiogroup" aria-label="Theme">
            {(['dark', 'light', 'auto'] as const).map((t) => (
              <button key={t} role="radio" aria-checked={theme === t} onClick={() => { setTheme(t); pushToast({ title: `Theme: ${t}`, body: t === 'light' ? 'Light glass applied to chrome (canvas stays cinematic)' : 'Cinematic dark applied', tone: 'info' }); }}
                className={`chip ${theme === t ? '!border-neon-cyan/50 !text-neon-cyan' : ''}`}>{t[0].toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
          <Button variant="outline" className="mt-4" onClick={() => setShortcutsOpen(true)}><Keyboard className="h-4 w-4" /> Keyboard shortcuts</Button>
          <p className="mt-3 font-mono text-[11px] text-white/35">Retention: {retention} · Alerts {alerts ? 'on' : 'off'} · Reports {reports ? 'on' : 'off'}</p>
        </Card>
      </div>
      <Modal open={keysOpen} onClose={() => setKeysOpen(false)} title="Rotate API key">
        <p className="text-sm text-white/60">Rotation is mocked — a new masked key would be issued and the old one revoked after 24h.</p>
        <div className="mt-4 flex gap-2"><Button onClick={() => { setKeysOpen(false); pushToast({ title: 'Key rotated (mock)', body: 'sk-live-••••••••••••77b0', tone: 'success' }); }}>Confirm rotation</Button><Button variant="ghost" onClick={() => setKeysOpen(false)}>Cancel</Button></div>
      </Modal>
      <Modal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} title="Keyboard shortcuts">
        <ul className="space-y-2 font-mono text-xs text-white/65">
          {[['/', 'Focus AI input'], ['1–8', 'Jump between sections'], ['e', 'Export CSV'], ['?', 'Open this reference'], ['Esc', 'Close dialogs']].map(([k, v]) => (
            <li key={k} className="flex gap-3"><kbd className="rounded border border-white/15 bg-white/5 px-2 py-0.5">{k}</kbd><span>{v}</span></li>
          ))}
        </ul>
      </Modal>
    </section>
  );
}
