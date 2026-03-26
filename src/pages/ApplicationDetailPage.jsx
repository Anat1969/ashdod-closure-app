import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/closure/StatusBadge';
import { ArrowRight, Phone, Mail, MapPin, Ruler, FileText, CheckCircle, XCircle } from 'lucide-react';

const CHECKLISTS = {
  type1: [
    'תוכנית סגירה חתומה ע"י אדריכל',
    'אישור בטיחות אש',
    'הצהרת נגישות',
    'ביטוח אחריות צד ג׳',
    'אישור רשות הכבאות',
    'תוכנית פינוי חירום',
  ],
  type2: [
    'תוכנית הנדסית מאושרת',
    'חישובים סטטיים',
    'אישור קבלן רשום',
    'ביטוח עבודות קבלניות',
    'אישור תכנון ובניה',
    'בדיקת יציבות קרקע',
    'אישור רשות מקומית',
  ],
};

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.ClosureApplication.filter({ id })
      .then(data => {
        const found = data[0];
        setApp(found);
        setNotes(found?.notes || '');
        setLoading(false);
      });
  }, [id]);

  const handleStatus = async (newStatus) => {
    setSaving(true);
    await base44.entities.ClosureApplication.update(app.id, { status: newStatus, notes });
    setApp(prev => ({ ...prev, status: newStatus, notes }));
    setSaving(false);
  };

  if (loading) return <div className="text-center py-20 text-gray-400">טוען...</div>;
  if (!app) return <div className="text-center py-20 text-gray-400">הבקשה לא נמצאה</div>;

  const checklist = CHECKLISTS[app.type] || [];

  return (
    <div dir="rtl" className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/architect')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        <ArrowRight className="w-4 h-4" />
        חזרה לרשימת הבקשות
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{app.business}</h2>
            <p className="text-gray-500 mt-1">{app.application_id}</p>
          </div>
          <StatusBadge status={app.status} />
        </div>
      </div>

      {/* Business details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          פרטי הבקשה
        </h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <span className="font-medium text-gray-700">בעל עסק:</span> {app.owner}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4 text-gray-400" />
            <a href={`tel:${app.phone}`} className="hover:text-blue-600">{app.phone}</a>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-4 h-4 text-gray-400" />
            <a href={`mailto:${app.email}`} className="hover:text-blue-600">{app.email}</a>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            {app.address}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Ruler className="w-4 h-4 text-gray-400" />
            שטח: {app.area} מ״ר
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span className="font-medium text-gray-700">סוג:</span>
            {app.type === 'type1' ? 'סגירה עונתית/חורף' : 'מבנה קבוע/עונתי'}
          </div>
        </div>
      </div>

      {/* Checklist */}
      {checklist.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-700 mb-4">רשימת תנאים</h3>
          <div className="space-y-2">
            {checklist.map((item, i) => {
              const checked = app.checklist?.[item];
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
                  checked ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  {checked
                    ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                  <span className={`text-sm ${checked ? 'text-green-800' : 'text-red-700'}`}>{item}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Menu */}
      {app.menu && Object.keys(app.menu).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-700 mb-4">תפריט עסק</h3>
          <div className="divide-y divide-gray-50">
            {Object.entries(app.menu).map(([item, price]) => (
              <div key={item} className="flex justify-between py-2 text-sm">
                <span className="text-gray-700">{item}</span>
                <span className="text-gray-500">{price}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-700 mb-3">הערות ופעולות</h3>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="הוסף הערה לבעל העסק..."
          rows={3}
          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 mb-4"
        />
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => handleStatus('approved')}
            disabled={saving || app.status === 'approved'}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
          >
            <CheckCircle className="w-4 h-4" /> אשר בקשה
          </button>
          <button
            onClick={() => handleStatus('pending_owner')}
            disabled={saving}
            className="flex items-center gap-2 bg-amber-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition"
          >
            החזר לתיקון
          </button>
          <button
            onClick={() => handleStatus('rejected')}
            disabled={saving || app.status === 'rejected'}
            className="flex items-center gap-2 bg-red-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition"
          >
            <XCircle className="w-4 h-4" /> דחה בקשה
          </button>
        </div>
      </div>
    </div>
  );
}