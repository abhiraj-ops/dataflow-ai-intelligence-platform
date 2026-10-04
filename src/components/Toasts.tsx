import { useStore } from '@/store/useStore';
import { cn } from '@/lib/cn';

export function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="no-print fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <button key={t.id} onClick={() => dismissToast(t.id)} className={cn('liquid-glass px-4 py-3 text-left text-sm animate-fade-in',
          t.tone === 'success' && 'border-neon-green/30',
          t.tone === 'error' && 'border-neon-pink/40',
          t.tone === 'warn' && 'border-yellow-400/30')}>
          <span className="font-semibold text-white">{t.title}</span>
          {t.body && <span className="mt-0.5 block text-xs text-white/55">{t.body}</span>}
        </button>
      ))}
    </div>
  );
}
