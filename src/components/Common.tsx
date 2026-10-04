import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('liquid-glass p-5', className)}>{children}</div>;
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'neon' | 'outline' | 'ghost' | 'danger';
}

export function Button({ variant = 'neon', className, children, ...rest }: BtnProps) {
  const styles =
    variant === 'neon'
      ? 'bg-neon-cyan text-black font-semibold shadow-neon-cyan hover:brightness-110'
      : variant === 'outline'
        ? 'border border-white/25 text-white hover:border-neon-cyan/60 hover:text-neon-cyan'
        : variant === 'danger'
          ? 'border border-neon-pink/40 text-neon-pink hover:bg-neon-pink/10'
          : 'text-white/60 hover:text-white hover:bg-white/5';
  return (
    <button
      className={cn('inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm transition active:scale-[0.98] disabled:opacity-50', styles, className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Badge({ tone = 'info', children }: { tone?: 'info' | 'ok' | 'warn' | 'err' | 'mono'; children: ReactNode }) {
  const map: Record<string, string> = {
    info: 'border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan',
    ok: 'border-neon-green/30 bg-neon-green/10 text-neon-green',
    warn: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-300',
    err: 'border-neon-pink/40 bg-neon-pink/10 text-neon-pink',
    mono: 'border-white/10 bg-white/[0.05] text-white/60 font-mono',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', map[tone])}>
      {children}
    </span>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="liquid-glass-neon relative w-full max-w-lg p-6 animate-fade-in">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold">{title}</h3>
          <button onClick={onClose} aria-label="Close dialog" className="rounded-full border border-white/10 px-3 py-1 text-white/60 hover:text-white">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function LoadingSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-white/50" role="status" aria-label={label}>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-neon-cyan" />
      <span className="text-sm">{label}…</span>
    </div>
  );
}

export function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-1 font-heading text-2xl font-bold md:text-3xl">{title}</h2>
      {sub && <p className="mt-2 max-w-2xl text-sm text-white/50">{sub}</p>}
    </div>
  );
}
