import { useState } from 'react';
import { motion } from 'framer-motion';
import BackupControls from './BackupMenu';
import { useSettings, setSettings } from '@/lib/settings';
import { BASE_MAPS, refreshOsmVenues } from '@/lib/map';
import { loadDemoData, removeDemoData } from '@/lib/demoData';
import { clearRecords } from '@/api/localDb';

function Section({ title, children }) {
  return (
    <section className="paper rounded-xl p-4 space-y-3 min-w-0">
      <h3 className="label">{title}</h3>
      {children}
    </section>
  );
}

const chip = (active) => `px-3 py-1.5 rounded-lg text-sm border transition ${active ? 'bg-blue-900 text-white border-blue-900 shadow' : 'border-blue-200 text-blue-800 hover:bg-blue-50'}`;

// Technical controls live here, under the top bar, not on the pages.
export default function SettingsDrawer({ onClose }) {
  const settings = useSettings();
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    setMsg('');
    try { setMsg(await fn()); } catch (err) { setMsg(err.message); } finally { setBusy(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22 }}
      className="absolute inset-x-0 top-full bg-blue-50/95 backdrop-blur border-b border-blue-200 text-blue-900 shadow-2xl max-h-[75vh] overflow-y-auto"
      data-testid="settings-drawer"
    >
      <div className="max-w-7xl mx-auto p-4 grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Section title="גיבוי נתונים">
          <BackupControls />
        </Section>

        <Section title="מפת בסיס">
          <div className="flex flex-wrap gap-2">
            {Object.entries(BASE_MAPS).map(([key, b]) => (
              <button key={key} type="button" className={chip(settings.baseMap === key)} onClick={() => setSettings({ baseMap: key })}>{b.label}</button>
            ))}
          </div>
          <p className="text-xs text-blue-500">מפות חינמיות ללא מפתח: OpenStreetMap, CARTO ו-Esri.</p>
        </Section>

        <Section title="שכבת עסקי מזון מ-OSM">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip(settings.showOsm)} onClick={() => setSettings({ showOsm: !settings.showOsm })}>
              {settings.showOsm ? 'מוצגת על המפה' : 'מוסתרת'}
            </button>
            <button type="button" disabled={busy} className={chip(false)} onClick={() => run(async () => {
              const d = await refreshOsmVenues();
              return `עודכנו ${d.venues.length} עסקים מ-OSM`;
            })}>רענון מ-OSM</button>
          </div>
          <p className="text-xs text-blue-500">בתי אוכל, קפה ומזנונים באשדוד מתוך OpenStreetMap (Overpass API, חינמי).</p>
        </Section>

        <Section title="נתוני הדגמה וניקוי">
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} className={chip(false)} onClick={() => run(async () => `נטענו ${await loadDemoData()} בקשות הדגמה`)}>טעינת נתוני הדגמה</button>
            <button type="button" disabled={busy} className={chip(false)} onClick={() => run(async () => `הוסרו ${await removeDemoData()} בקשות הדגמה`)}>הסרת נתוני הדגמה</button>
            <button type="button" disabled={busy} className="px-3 py-1.5 rounded-lg text-sm border border-red-300 text-red-700 hover:bg-red-50" onClick={() => {
              if (window.confirm('למחוק את כל הבקשות מהדפדפן הזה? מומלץ לייצא גיבוי קודם.')) run(async () => { await clearRecords(); return 'כל הנתונים נמחקו'; });
            }}>מחיקת כל הנתונים</button>
          </div>
        </Section>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-blue-700 min-h-[1.25rem]" role="status">{msg}</p>
        <div className="flex gap-2">
          {msg && <button type="button" onClick={() => window.location.reload()} className="text-sm underline text-blue-700">רענון התצוגה</button>}
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm bg-blue-900 text-white">סגירת ההגדרות</button>
        </div>
      </div>
    </motion.div>
  );
}
