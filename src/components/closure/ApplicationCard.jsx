import { useState } from 'react';
import StatusBadge from './StatusBadge';
import { X, MapPin, Phone, Mail, CheckCircle2, XCircle, RotateCcw, MessageSquare } from 'lucide-react';

const CHECKLIST_TYPE1 = [
  { id: 'c1_1', text: 'קיים היתר בנייה או אישור לשימוש חורגה' },
  { id: 'c1_2', text: 'מרחק מינימלי מ-1.5 מ\' ממדרכה ציבורית' },
  { id: 'c1_3', text: 'גובה מבנה עד 3 מ\' ממפלס הכניסה' },
  { id: 'c1_4', text: 'שטח הסגירה אינו חוסם יציאות חירום' },
  { id: 'c1_5', text: 'קיים ביטוח צד שלישי בתוקף' },
  { id: 'c1_6', text: 'החומרים בטוחים לאוכלוסייה' },
  { id: 'c1_7', text: 'הסגירה אינה מפריעה לנגישות לבעלי מוגבלויות' },
  { id: 'c1_8', text: 'התאורה מותאמת לשעות חשיכה' },
];

const CHECKLIST_TYPE2 = [
  { id: 'c2_1', text: 'קיים היתר בנייה מאושר' },
  { id: 'c2_2', text: 'מבנה עומד בתקנות כיבוי אש' },
  { id: 'c2_3', text: 'קיים חיבור חשמל תקני ומאושר' },
  { id: 'c2_4', text: 'הנגשה לאנשים עם מוגבלויות' },
  { id: 'c2_5', text: 'קיים ביטוח מבנה מקיף' },
  { id: 'c2_6', text: 'אין חריגה מקו הבניין המאושר' },
  { id: 'c2_7', text: 'מערכת ניקוז מים תקינה' },
  { id: 'c2_8', text: 'חומרי בנייה תקניים ומאושרים' },
  { id: 'c2_9', text: 'שלטי בטיחות מותקנים' },
];

export default function ApplicationCard({ app, onClose, onStatusChange }) {
  const [notes, setNotes] = useState(app.notes || '');
  const [saving, setSaving] = useState(null);

  const checklist = app.type === 'type1' ? CHECKLIST_TYPE1 : CHECKLIST_TYPE2;

  const handle = async (status) => {
    setSaving(status);
    await onStatusChange(app, status, notes);
    setSaving(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-bold text-gray-800">{app.business}</h3>
              <StatusBadge status={app.status} />
            </div>
            <p className="text-sm text-gray-500">{app.application_id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-400 text-xs mb-1">בעל עסק</div>
              <div className="font-medium text-gray-800">{app.owner}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-400 text-xs mb-1">שטח</div>
              <div className="font-medium text-gray-800">{app.area} מ״ר · {app.type === 'type1' ? 'סגירה עונתית' : 'מבנה קבוע'}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-800">{app.phone}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-800 truncate">{app.email}</span>
            </div>
            <div className="col-span-2 bg-gray-50 rounded-lg p-3 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-800">{app.address}</span>
              {app.lat && app.lng && (
                <a
                  href={`https://www.google.com/maps?q=${app.lat},${app.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-xs hover:underline mr-auto flex-shrink-0"
                >
                  פתח במפות ↗
                </a>
              )}
            </div>
          </div>

          {/* Checklist results */}
          {app.checklist && Object.keys(app.checklist).length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">תוצאות רשימת תנאים</h4>
              <div className="space-y-1.5">
                {checklist.map(item => {
                  const checked = app.checklist[item.id];
                  return (
                    <div key={item.id} className={`flex items-start gap-2.5 p-2.5 rounded-lg text-sm ${checked ? 'bg-green-50' : 'bg-red-50'}`}>
                      {checked
                        ? <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        : <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      }
                      <span className={checked ? 'text-green-800' : 'text-red-700'}>{item.text}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {checklist.filter(i => app.checklist[i.id]).length}/{checklist.length} תנאים מאושרים
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4" /> הערות לבעל העסק
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              placeholder="הוסף הערות לבעל העסק..."
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 justify-end pt-2 border-t border-gray-100">
            {app.status !== 'pending_review' && (
              <button
                onClick={() => handle('pending_review')}
                disabled={!!saving}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
              >
                <RotateCcw className="w-4 h-4" /> החזר לבדיקה
              </button>
            )}
            {app.status !== 'rejected' && (
              <button
                onClick={() => handle('rejected')}
                disabled={!!saving}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 text-sm font-medium"
              >
                <XCircle className="w-4 h-4" />
                {saving === 'rejected' ? 'שומר...' : 'דחה בקשה'}
              </button>
            )}
            {app.status !== 'approved' && (
              <button
                onClick={() => handle('approved')}
                disabled={!!saving}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                <CheckCircle2 className="w-4 h-4" />
                {saving === 'approved' ? 'שומר...' : 'אשר בקשה'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}