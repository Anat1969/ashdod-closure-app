import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SettingsDrawer from './SettingsDrawer';
import { useNeedsBackup } from './BackupMenu';
import { seedOnce, demoCount } from '@/lib/demoData';

const NAV_ITEMS = [
  { path: '/', label: 'בית', end: true },
  { path: '/guidelines', label: 'הנחיות ויזואליות' },
  { path: '/policy', label: 'מסמך המדיניות' },
  { path: '/map', label: 'מפת סגירות' },
  { path: '/owner', label: 'בעל עסק' },
  { path: '/architect', label: 'עירייה' },
  { path: '/residents', label: 'תושב' },
];

export default function Layout() {
  const location = useLocation();
  const [systemOpen, setSystemOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [demo, setDemo] = useState(0);
  const needsBackup = useNeedsBackup();

  useEffect(() => {
    seedOnce().catch(() => {}).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    setSystemOpen(false);
    window.scrollTo(0, 0);
    if (ready) demoCount().then(setDemo).catch(() => {});
  }, [location.pathname, ready]);

  return (
    <div dir="rtl" className="min-h-screen grid grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr]">
      <header className="sticky top-0 z-[1100] ink shadow-[0_10px_30px_-12px_rgba(14,16,20,.6)]">
        <div className="blueprint">
          <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 pt-3 pb-2 min-w-0">
            <Link to="/" className="flex items-center gap-3 min-w-0 group" data-testid="home-link">
              <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="h-9 w-9 flex-none rounded-lg shadow-lg transition group-hover:scale-105" />
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-semibold leading-tight truncate">מנהל סגירות אשדוד</div>
                <div className="label !text-blue-300 hidden sm:block !normal-case">סגירות חורף ועונתיות · מדיניות 202411</div>
              </div>
            </Link>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setSystemOpen(o => !o)}
              aria-expanded={systemOpen}
              className={`relative flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition border ${systemOpen ? 'bg-white text-blue-900 border-white' : 'border-blue-600 text-blue-100 hover:bg-blue-800'}`}
            >
              מערכת
              {needsBackup && <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-blue-900" title="מומלץ לגבות" />}
            </button>
          </div>
          <nav className="max-w-7xl mx-auto flex gap-1 px-4 pb-2.5 overflow-x-auto min-w-0 [scrollbar-width:none]">
            {NAV_ITEMS.map(item => (
              <NavLink key={item.path} to={item.path} end={item.end}
                className={({ isActive }) => `relative flex-none px-3 py-1.5 rounded-lg text-sm transition ${isActive ? 'text-blue-950' : 'text-blue-200 hover:text-white hover:bg-white/5'}`}>
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-lg bg-white shadow" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                    <span className="relative">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
        <AnimatePresence>
          {systemOpen && <SettingsDrawer onClose={() => setSystemOpen(false)} />}
        </AnimatePresence>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 py-6 min-w-0">
        {demo > 0 && (
          <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-900" data-testid="demo-banner">
            מוצגים {demo} רשומות הדגמה כדי להמחיש את המערכת. אפשר להסיר אותן בכפתור "מערכת".
          </div>
        )}
        {ready ? (
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        ) : <div className="py-24 text-center text-blue-400">טוען...</div>}
      </main>
    </div>
  );
}
