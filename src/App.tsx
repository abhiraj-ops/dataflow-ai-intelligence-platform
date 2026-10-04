import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Background } from '@/components/Background';
import { Header } from '@/components/Header';
import { DataIngestion } from '@/components/DataIngestion';
import { DataExplorer } from '@/components/DataExplorer';
import { ChatInterface } from '@/components/ChatInterface';
import { Analytics } from '@/components/Analytics';
import { Pipeline } from '@/components/Pipeline';
import { Prepare } from '@/components/Prepare';
import { ExportPanel } from '@/components/ExportPanel';
import { Settings } from '@/components/Settings';
import { CTASection, FooterBar } from '@/components/Footer';
import { Toasts } from '@/components/Toasts';

export default function App() {
  const { section, theme } = useStore();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.style.background = theme === 'light' ? '#f4f6f8' : '#0a0a0a';
    document.body.style.color = theme === 'light' ? '#0a0a0a' : '#ffffff';
    return () => {
      document.body.style.background = '';
      document.body.style.color = '';
    };
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/') {
        const el = document.querySelector<HTMLInputElement>('input[aria-label="Ask a data question"]');
        if (el && document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
          useStore.getState().setSection('ai');
          setTimeout(() => el.focus(), 50);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const showAll = section === 'dashboard';

  return (
    <div className="min-h-screen font-body">
      <Background />
      <Header />
      <main className="mx-auto max-w-7xl space-y-10 px-4 pb-4 md:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
          >
            {(showAll || section === 'ingest') && <DataIngestion />}
            {(showAll || section === 'explorer') && <div className={showAll ? 'mt-10' : ''}><DataExplorer /></div>}
            {(showAll || section === 'ai') && <div className={showAll ? 'mt-10' : ''}><ChatInterface /></div>}
            {(showAll || section === 'predict') && <div className={showAll ? 'mt-10' : ''}><Analytics /></div>}
            {(showAll || section === 'pipeline') && <div className={showAll ? 'mt-10' : ''}><Pipeline /></div>}
            {(showAll || section === 'prepare') && <div className={showAll ? 'mt-10' : ''}><Prepare /></div>}
            {(showAll || section === 'export') && <div className={showAll ? 'mt-10' : ''}><ExportPanel /></div>}
            {(showAll || section === 'settings') && <div className={showAll ? 'mt-10' : ''}><Settings /></div>}
          </motion.div>
        </AnimatePresence>
        <CTASection />
        <FooterBar />
      </main>
      <Toasts />
    </div>
  );
}
