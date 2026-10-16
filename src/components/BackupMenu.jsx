import { useEffect, useRef, useState } from 'react';
import { exportBackup, importBackup, storageEstimate } from '@/api/localDb';
import { downloadBlob } from '@/lib/files';

const LAST_BACKUP_KEY = 'ashdod-closure:last-backup';

function readLastBackup() {
  try { return localStorage.getItem(LAST_BACKUP_KEY); } catch { return null; }
}

const formatMb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)}MB`;

export function useNeedsBackup() {
  const last = readLastBackup();
  const days = last ? Math.floor((Date.now() - new Date(last)) / 86400000) : null;
  return days === null || days >= 7;
}

// Backup controls, shown inside the settings drawer. Data lives in this browser only.
export default function BackupControls() {
  const [busy, setBusy] = useState(false);
  const [usage, setUsage] = useState(null);
  const [lastBackup, setLastBackup] = useState(readLastBackup);
  const fileRef = useRef(null);

  useEffect(() => { storageEstimate().then(setUsage); }, []);

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
    }
  };

  const days = lastBackup ? Math.floor((Date.now() - new Date(lastBackup)) / 86400000) : null;
  const needsBackup = days === null || days >= 7;

  return (
    <div className="space-y-2">
      <p className="text-xs text-blue-500 leading-relaxed">
        הנתונים נשמרים בדפדפן זה בלבד. כדאי לייצא גיבוי באופן קבוע ולשמור אותו במקום בטוח.
      </p>
      <p className={`text-xs font-mono ${needsBackup ? 'text-amber-700' : 'text-green-700'}`}>
        {lastBackup ? `גיבוי אחרון: ${new Date(lastBackup).toLocaleDateString('he-IL')}` : 'עדיין לא בוצע גיבוי'}
        {usage?.usage ? ` · בשימוש ${formatMb(usage.usage)}` : ''}
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={handleExport} className="px-3 py-2 rounded-lg text-sm bg-blue-800 text-white hover:bg-blue-700 disabled:opacity-50">ייצוא גיבוי לקובץ</button>
        <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded-lg text-sm border border-blue-200 hover:bg-blue-50 disabled:opacity-50">ייבוא גיבוי מקובץ</button>
      </div>
      <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImport} data-testid="backup-file" />
    </div>
  );
}
