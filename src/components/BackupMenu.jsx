import { useEffect, useRef, useState } from 'react';
import { Download, Upload, HardDrive } from 'lucide-react';
import { exportBackup, importBackup, storageEstimate } from '@/api/localDb';
import { downloadBlob } from '@/lib/files';

const LAST_BACKUP_KEY = 'ashdod-closure:last-backup';

function readLastBackup() {
  try { return localStorage.getItem(LAST_BACKUP_KEY); } catch { return null; }
}

function formatMb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

// The standalone app stores data in this browser only; this menu moves it between devices.
export default function BackupMenu() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [usage, setUsage] = useState(null);
  const [lastBackup, setLastBackup] = useState(readLastBackup);
  const fileRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    storageEstimate().then(setUsage);
    const onDocClick = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleExport = async () => {
    setBusy(true);
    try {
      const data = await exportBackup();
      downloadBlob(
        new Blob([JSON.stringify(data)], { type: 'application/json' }),
        `ashdod-closure-backup-${new Date().toISOString().slice(0, 10)}.json`,
      );
      const now = new Date().toISOString();
      try { localStorage.setItem(LAST_BACKUP_KEY, now); } catch { /* storage unavailable */ }
      setLastBackup(now);
    } catch (err) {
      alert('שגיאה ביצירת הגיבוי: ' + err.message);
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const data = JSON.parse(await file.text());
      const replace = window.confirm('למחוק את הנתונים הקיימים בדפדפן זה לפני הייבוא?\n\nאישור = החלפה מלאה\nביטול = מיזוג עם הנתונים הקיימים');
      const count = await importBackup(data, replace ? 'replace' : 'merge');
      alert(`יובאו ${count} רשומות בהצלחה`);
      window.location.reload();
    } catch (err) {
      alert('שגיאה בייבוא: ' + (err instanceof SyntaxError ? 'הקובץ אינו קובץ גיבוי תקין' : err.message));
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  const daysSinceBackup = lastBackup ? Math.floor((Date.now() - new Date(lastBackup)) / 86400000) : null;
  const needsBackup = daysSinceBackup === null || daysSinceBackup >= 7;

  return (
    <div ref={rootRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        disabled={busy}
        aria-expanded={open}
        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-700 text-sm text-blue-200 hover:text-white transition-all disabled:opacity-50"
      >
        <HardDrive className="w-4 h-4" />
        <span className="hidden sm:inline">גיבוי נתונים</span>
        {needsBackup && <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-amber-400" title="מומלץ לגבות" />}
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-72 bg-white text-gray-800 rounded-xl shadow-lg border border-gray-200 p-2 z-[1000]">
          <p className="text-xs text-gray-500 px-2 py-1.5 leading-relaxed">
            הנתונים נשמרים בדפדפן זה בלבד. כדאי לייצא גיבוי באופן קבוע ולשמור אותו במקום בטוח.
          </p>
          <p className={`text-xs px-2 pb-1.5 ${needsBackup ? 'text-amber-600' : 'text-green-600'}`}>
            {lastBackup ? `גיבוי אחרון: ${new Date(lastBackup).toLocaleDateString('he-IL')}` : 'עדיין לא בוצע גיבוי'}
            {usage?.usage ? ` · בשימוש ${formatMb(usage.usage)}` : ''}
          </p>
          <button type="button" onClick={handleExport} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100">
            <Download className="w-4 h-4" /> ייצוא גיבוי לקובץ
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100">
            <Upload className="w-4 h-4" /> ייבוא גיבוי מקובץ
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImport} />
        </div>
      )}
    </div>
  );
}
