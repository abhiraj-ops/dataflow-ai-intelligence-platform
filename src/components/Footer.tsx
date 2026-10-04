import { ArrowUpRight, Github, Linkedin, Twitter } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from './Common';

export function CTASection() {
  const { setSection } = useStore();
  return (
    <section aria-label="Call to action" className="liquid-glass-neon mt-10 overflow-hidden px-6 py-12 text-center">
      <h2 className="mx-auto max-w-2xl font-heading text-3xl font-bold md:text-4xl">Bring your own CSV. Get answers in minutes.</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm text-white/55 md:text-base">
        Upload a sales export and ask about top products, festive-season spikes or next month&apos;s
        demand in plain English. No dashboards to build.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={() => setSection('ai')}>Start Analyzing <ArrowUpRight className="h-4 w-4" /></Button>
      </div>
    </section>
  );
}

export function FooterBar() {
  return (
    <footer className="mt-8 border-t border-white/10 py-6">
      <div className="flex flex-col items-center gap-3 text-xs text-white/40 md:flex-row">
        <span>© 2026 DataFlow Analytics · Bengaluru, India. All rights reserved.</span>
        <nav className="flex gap-4 md:mx-auto" aria-label="Footer">
          {['Docs', 'API Reference', 'Blog', 'Community'].map((l) => (
            <a key={l} href="#" onClick={(e) => e.preventDefault()} className="hover:text-neon-cyan">{l}</a>
          ))}
        </nav>
        <span className="flex gap-3">
          <a href="#" onClick={(e) => e.preventDefault()} aria-label="GitHub" className="hover:text-white"><Github className="h-4 w-4" /></a>
          <a href="#" onClick={(e) => e.preventDefault()} aria-label="Twitter" className="hover:text-white"><Twitter className="h-4 w-4" /></a>
          <a href="#" onClick={(e) => e.preventDefault()} aria-label="LinkedIn" className="hover:text-white"><Linkedin className="h-4 w-4" /></a>
        </span>
      </div>
    </footer>
  );
}
