import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SettingsDrawer from './SettingsDrawer';
import { useNeedsBackup } from './BackupMenu';
import { useInstallPrompt, DEV_CHAT_URL } from '@/lib/settings';

const NAV_ITEMS = [
  { path: '/', label: 'בית', end: true },
  { path: '/policy', label: 'מסמך המדיניות' },
  { path: '/learn', label: 'משחק המדיניות' },
  { path: '/map', label: 'מפת סגירות' },
  { path: '/owner', label: 'בעל עסק' },
  { path: '/architect', label: 'עירייה' },
  { path: '/residents', label: 'תושב' },
];

const barBtn = 'flex-none whitespace-nowrap px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-[13px] font-medium transition border';

export default function Layout() {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const needsBackup = useNeedsBackup();
  const { canInstall, install } = useInstallPrompt();

  useEffect(() => { setSettingsOpen(false); window.scrollTo(0, 0); }, [location.pathname]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      window.prompt('העתיקו את הקישור:', window.location.href);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

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
            <div className="flex items-center gap-1.5 min-w-0">
              <button type="button" onClick={copyLink} className={`${barBtn} border-blue-700 text-blue-100 hover:bg-blue-800`}>
                {copied ? 'הקישור הועתק' : 'העתקת קישור'}
              </button>
              <a href={DEV_CHAT_URL} target="_blank" rel="noreferrer" className={`${barBtn} border-blue-700 text-blue-100 hover:bg-blue-800 hidden sm:inline-block`}>
                שיחת הפיתוח
              </a>
              {canInstall && (
                <button type="button" onClick={install} className={`${barBtn} border-transparent bg-white text-blue-900 hover:bg-blue-100`}>
                  התקנת האפליקציה
                </button>
              )}
              <button
                type="button"
                onClick={() => setSettingsOpen(o => !o)}
                aria-expanded={settingsOpen}
                className={`${barBtn} relative ${settingsOpen ? 'bg-white text-blue-900 border-white' : 'border-blue-700 text-blue-100 hover:bg-blue-800'}`}
              >
                הגדרות
                {needsBackup && <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-blue-900" title="מומלץ לגבות" />}
              </button>
            </div>
          </div>
          <nav className="max-w-7xl mx-auto flex gap-1 px-4 pb-2.5 overflow-x-auto min-w-0 [scrollbar-width:none]">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `relative flex-none px-3 py-1.5 rounded-lg text-sm transition ${isActive ? 'text-blue-950' : 'text-blue-200 hover:text-white hover:bg-white/5'}`}
              >
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-lg bg-white shadow" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                    <span className="relative">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
            <a href={DEV_CHAT_URL} target="_blank" rel="noreferrer" className="sm:hidden flex-none px-3 py-1.5 rounded-lg text-sm text-blue-300">שיחת הפיתוח</a>
          </nav>
        </div>
        <AnimatePresence>
          {settingsOpen && <SettingsDrawer onClose={() => setSettingsOpen(false)} />}
        </AnimatePresence>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 py-6 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
