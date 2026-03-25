import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronRight, ChevronLeft, Send } from 'lucide-react';
import MapPicker from './MapPicker';

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

const STEPS = ['פרטי עסק', 'סוג סגירה', 'רשימת תנאים', 'אישור והגשה'];

export default function ApplicationWizard({ application, onCancel, onSaved }) {
  const isEdit = !!application;
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    business: application?.business || '',
    owner: application?.owner || '',
    address: application?.address || '',
    phone: application?.phone || '',
    email: application?.email || '',
    type: application?.type || 'type1',
    area: application?.area || '',
    checklist: application?.checklist || {},
    lat: application?.lat || null,
    lng: application?.lng || null,
  });

  const checklist = form.type === 'type1' ? CHECKLIST_TYPE1 : CHECKLIST_TYPE2;
  const allChecked = checklist.every(item => form.checklist[item.id]);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const toggleCheck = (id) => setForm(f => ({ ...f, checklist: { ...f.checklist, [id]: !f.checklist[id] } }));

  const handleSubmit = async () => {
    setSaving(true);
    const payload = {
      ...form,
      area: Number(form.area),
      status: 'pending_review',
      submitted_at: new Date().toISOString(),
      application_id: application?.application_id || `ASH-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`,
    };
    if (isEdit) {
      await base44.entities.ClosureApplication.update(application.id, payload);
    } else {
      await base44.entities.ClosureApplication.create(payload);
    }
    setSaving(false);
    onSaved();
  };

  const canNext = () => {
    if (step === 0) return form.business && form.owner && form.address && form.phone && form.email && form.lat && form.lng;
    if (step === 1) return form.type && form.area;
    if (step === 2) return allChecked;
    return true;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onCancel} className="text-blue-600 hover:text-blue-800 text-sm font-medium">→ חזרה</button>
        <h2 className="text-xl font-bold text-gray-800">{isEdit ? 'עריכה והגשה מחדש' : 'הגשת בקשה חדשה'}</h2>
      </div>

      {/* Steps */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className={`flex-1 text-center text-xs py-2 rounded-lg font-medium transition-all ${
            i === step ? 'bg-blue-700 text-white' : i < step ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
          }`}>{s}</div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-700 mb-4">פרטי העסק ובעל הבית</h3>
            {[
              { field: 'business', label: 'שם העסק', type: 'text' },
              { field: 'owner', label: 'שם בעל העסק', type: 'text' },
              { field: 'address', label: 'כתובת מלאה', type: 'text' },
              { field: 'phone', label: 'טלפון', type: 'tel' },
              { field: 'email', label: 'דוא״ל', type: 'email' },
            ].map(({ field, label, type }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[field]}
                  onChange={e => update(field, e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            ))}
            <MapPicker
              lat={form.lat}
              lng={form.lng}
              onSelect={(lat, lng) => setForm(f => ({ ...f, lat, lng }))}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <h3 className="font-bold text-gray-700 mb-4">סוג הסגירה</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'type1', title: 'סגירה עונתית / חורף', desc: 'סגירה זמנית לתקופה מוגדרת' },
                { id: 'type2', title: 'מבנה קבוע / עונתי', desc: 'מבנה קבוע או חצי-קבוע' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => update('type', t.id)}
                  className={`border-2 rounded-xl p-4 text-right transition-all ${
                    form.type === t.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="font-bold text-gray-800">{t.title}</div>
                  <div className="text-sm text-gray-500 mt-1">{t.desc}</div>
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שטח הסגירה (מ״ר)</label>
              <input
                type="number"
                value={form.area}
                onChange={e => update('area', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="לדוגמה: 25"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="font-bold text-gray-700 mb-2">
              רשימת תנאים — {form.type === 'type1' ? 'סגירה עונתית' : 'מבנה קבוע'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">יש לאשר את עמידת העסק בכל התנאים הבאים:</p>
            <div className="space-y-3">
              {checklist.map(item => (
                <label key={item.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  form.checklist[item.id] ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-200'
                }`}>
                  <input
                    type="checkbox"
                    checked={!!form.checklist[item.id]}
                    onChange={() => toggleCheck(item.id)}
                    className="mt-0.5 w-4 h-4 accent-green-600"
                  />
                  <span className="text-sm text-gray-700">{item.text}</span>
                </label>
              ))}
            </div>
            {!allChecked && (
              <p className="text-amber-600 text-sm mt-4 bg-amber-50 px-3 py-2 rounded-lg">
                יש לאשר את כל התנאים כדי להמשיך
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-8">
            <Send className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">מוכן להגשה</h3>
            <p className="text-gray-500 mb-6">הבקשה תועבר לבודק העירייה לבדיקה ואישור</p>
            <div className="bg-gray-50 rounded-xl p-4 text-right mb-6 space-y-2 text-sm text-gray-600">
              <p><strong>עסק:</strong> {form.business}</p>
              <p><strong>כתובת:</strong> {form.address}</p>
              <p><strong>סוג:</strong> {form.type === 'type1' ? 'סגירה עונתית/חורף' : 'מבנה קבוע/עונתי'}</p>
              <p><strong>שטח:</strong> {form.area} מ״ר</p>
              <p><strong>מיקום:</strong> {form.lat ? `${Number(form.lat).toFixed(5)}, ${Number(form.lng).toFixed(5)}` : 'לא סומן'}</p>
              <p><strong>תנאים מאושרים:</strong> {checklist.filter(c => form.checklist[c.id]).length}/{checklist.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : onCancel()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
        >
          <ChevronRight className="w-4 h-4" /> הקודם
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
            className="flex items-center gap-2 px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            הבא <ChevronLeft className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40"
          >
            {saving ? 'שולח...' : 'הגש בקשה'} <Send className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}