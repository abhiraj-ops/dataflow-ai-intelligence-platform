import { useEffect, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { History, Mic, Paperclip, Send, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { suggestionChips } from '@/utils/aiResponses';
import { aggregate, fmtCol, SCHEME_COLORS } from '@/utils/dataProcessing';
import { Badge, Card, SectionTitle } from './Common';
import { cn } from '@/lib/cn';

export function ChatInterface() {
  const { rows, chat, ask, clearChat, pushToast } = useStore();
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chips = suggestionChips(rows);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.length]);

  const send = () => {
    if (!input.trim()) return;
    ask(input);
    setInput('');
  };

  return (
    <section aria-label="AI query engine">
      <SectionTitle eyebrow="03 · Conversational AI" title="Natural Language Query Engine" sub="Ask in plain English. Answers stream with charts, table snippets, confidence scores and follow-ups." />
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className={cn('lg:col-span-1', !showHistory && 'hidden lg:block')}>
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-neon-cyan" />
            <h3 className="font-heading text-sm font-bold">Chat History</h3>
            <button className="chip ml-auto !px-2" onClick={clearChat} title="Clear history"><Trash2 className="h-3 w-3" /></button>
          </div>
          <div className="mt-3 max-h-96 space-y-2 overflow-y-auto">
            {chat.filter((m) => m.role === 'user').length === 0 && <p className="text-xs text-white/35">No queries yet — try a suggestion chip.</p>}
            {chat.filter((m) => m.role === 'user').map((m) => (
              <button key={m.id} onClick={() => ask(m.text)} className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-left text-xs text-white/65 hover:border-neon-cyan/40 hover:text-white">
                <span className="block truncate">{m.text}</span>
                <span className="mt-0.5 block font-mono text-[10px] text-white/30">{new Date(m.timestamp).toLocaleTimeString()}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-sm font-bold">Main Chat Canvas</h3>
            <button className="chip ml-auto lg:hidden" onClick={() => setShowHistory((s) => !s)}>History</button>
          </div>
          <div className="mt-3 max-h-[420px] space-y-3 overflow-y-auto pr-1" aria-live="polite">
            {chat.map((m) => (
              <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  m.role === 'user' ? 'rounded-br-md bg-neon-cyan/15 border border-neon-cyan/25' : 'rounded-bl-md border border-white/10 bg-white/[0.03]')}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.chartKind && <MiniChart msgId={m.id} kind={m.chartKind} x={m.chartX ?? 'region'} y={m.chartY ?? 'revenue'} />}
                  {m.table && m.table.length > 0 && (
                    <div className="mt-2 overflow-x-auto rounded-lg border border-white/10">
                      <table className="data-table min-w-[420px] !text-xs">
                        <thead><tr>{Object.keys(m.table[0]).slice(0, 6).map((c) => <th key={c}>{c}</th>)}</tr></thead>
                        <tbody>{m.table.slice(0, 4).map((r) => <tr key={r.id}>{Object.keys(m.table![0]).slice(0, 6).map((c) => <td key={c}>{typeof r[c] === 'number' ? fmtCol(c, Number(r[c])) : String(r[c])}</td>)}</tr>)}</tbody>
                      </table>
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {typeof m.confidence === 'number' && <Badge tone="info">◆ {m.confidence}% confidence</Badge>}
                    <span className="font-mono text-[10px] text-white/30">{new Date(m.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {m.followUps && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.followUps.map((f) => (
                        <button key={f} onClick={() => ask(f)} className="rounded-full border border-neon-purple/30 bg-neon-purple/10 px-2.5 py-1 text-[11px] text-neon-purple hover:text-white">↪ {f}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Suggestions">
            {chips.map((c) => (
              <button key={c} onClick={() => ask(c)} className="chip !text-[11px]">{c}</button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button className="chip !px-3" title="Attach data" onClick={() => pushToast({ title: 'Attachment', body: 'Use Ingest hub to add datasets', tone: 'info' })}><Paperclip className="h-4 w-4" /></button>
            <button className="chip !px-3" title="Voice input (mock)" onClick={() => pushToast({ title: 'Voice input (mock)', body: "Speech-to-text isn't wired up in this build", tone: 'info' })}><Mic className="h-4 w-4" /></button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder='Ask anything — e.g. "What drives revenue?"'
              className="input-glass flex-1 !rounded-full"
              aria-label="Ask a data question"
            />
            <button onClick={send} aria-label="Send message" className="flex h-10 w-10 items-center justify-center rounded-full bg-neon-cyan text-black shadow-neon-cyan transition hover:brightness-110 active:scale-95">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </Card>
      </div>
    </section>
  );
}

function MiniChart({ msgId, kind, x, y }: { msgId: string; kind: 'bar' | 'line' | 'scatter'; x: string; y: string }) {
  const { rows } = useStore();
  const colors = SCHEME_COLORS.neon;
  if (kind === 'scatter') {
    const data = rows.slice(0, 40).map((r) => ({ x: Number(r[x] ?? 0), y: Number(r[y] ?? 0) }));
    return (
      <div className="mt-2 h-44" aria-label={`Scatter ${x} vs ${y}`}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="x" hide />
            <YAxis dataKey="y" width={36} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 12 }} />
            <Scatter data={data} fill={colors[1]} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }
  const data = aggregate(rows, { id: msgId, kind: kind === 'line' ? 'line' : 'bar', xKey: x, yKey: y, agg: 'SUM', scheme: 'neon', title: '' });
  return (
    <div className="mt-2 h-44" aria-label={`${kind} chart ${y} by ${x}`}>
      <ResponsiveContainer width="100%" height="100%">
        {kind === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={false} axisLine={false} tickLine={false} />
            <YAxis width={36} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 12 }} />
            <Line type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={2} dot={false} />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={false} axisLine={false} tickLine={false} />
            <YAxis width={36} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="value" radius={[5, 5, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
