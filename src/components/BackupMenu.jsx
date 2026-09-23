import { useRef, useState } from 'react';
import { Download, Upload, HardDrive } from 'lucide-react';
import { exportBackup, importBackup } from '@/api/localDb';

// The standalone app stores data in this browser only; this menu moves it between devices.
export default function BackupMenu() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const handleExport = async () => {
    setBusy(true);
    try {
      const data = await exportBackup();
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ashdod-closure-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
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
      alert('שגיאה בייבוא: ' + err.message);
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={busy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-700 text-sm text-blue-200 hover:text-white transition-all disabled:opacity-50"
      >
        <HardDrive className="w-4 h-4" />
        <span className="hidden sm:inline">גיבוי נתונים</span>
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-64 bg-white text-gray-800 rounded-xl shadow-lg border border-gray-200 p-2 z-[1000]">
          <p className="text-xs text-gray-500 px-2 py-1.5 leading-relaxed">
            הנתונים נשמרים בדפדפן זה בלבד. כדאי לייצא גיבוי באופן קבוע.
          </p>
          <button onClick={handleExport} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100">
            <Download className="w-4 h-4" /> ייצוא גיבוי לקובץ
          </button>
          <button onClick={() => fileRef.current?.click()} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100">
            <Upload className="w-4 h-4" /> ייבוא גיבוי מקובץ
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImport} />
        </div>
      )}
    </div>
  );
}
