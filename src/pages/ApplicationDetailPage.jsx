import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/closure/StatusBadge';
import {
  ArrowRight, Phone, Mail, MapPin, Ruler, FileText, CheckCircle, XCircle,
  AlertCircle, Send, ImageIcon, ExternalLink, User, Building2, Calendar,
  CheckSquare, Square, ChevronDown, ChevronUp
} from 'lucide-react';

const CHECKLIST_TYPE1 = [
  { id: 'c1_1', text: 'קיים רישיון עסק בתוקף' },
  { id: 'c1_2', text: 'ההצבה תואמת את תנאי רישיון העסק והמפה המצבית שהוגשה במסגרתו' },
  { id: 'c1_3', text: 'נשמר מרווח של לפחות 2.5 מ"ר בין שפת המדרכה לדופן הסגירה' },
  { id: 'c1_4', text: 'הפתח הוא לחזית בלבד ולא לצדדים' },
  { id: 'c1_5', text: 'גובה הגג אינו עולה על גובה קומת הקרקע של המבנה' },
  { id: 'c1_6', text: 'שיפוע הגג לפחות 1.5% עם כרכוב היקפי ישר' },
  { id: 'c1_7', text: 'חומרים גמישים בלבד: שמשונית / ברזנט על שלד פרופילים אלומיניום / ברזל' },
  { id: 'c1_8', text: 'ניהול מי גשמים בתעלת איסוף וצינור אנכי מוצנע' },
  { id: 'c1_9', text: 'אין שינוי / ציפוי / הגבהה של המדרכה הציבורית' },
  { id: 'c1_10', text: 'אין העברת תשתיות גלויה (חשמל, גז, מים)' },
  { id: 'c1_11', text: 'קיים אישור מהנדס / הנדסאי מבנים בדבר יציבות הסגירה' },
  { id: 'c1_12', text: 'קיים אישור יועץ בטיחות לסגירה' },
  { id: 'c1_13', text: 'הפרגוד יפורק עם תום תקופת ההרשאה' },
];

const CHECKLIST_TYPE2 = [
  { id: 'c2_1', text: 'קיים רישיון עסק בתוקף' },
  { id: 'c2_2', text: 'ההצבה תואמת את תנאי רישיון העסק והמפה המצבית שהוגשה במסגרתו' },
  { id: 'c2_3', text: 'נשמר מרווח של לפחות 2.5 מ"ר בין שפת המדרכה לדופן הסגירה' },
  { id: 'c2_4', text: 'הפתח הוא לחזית בלבד ולא לצדדים' },
  { id: 'c2_5', text: 'גובה הגג אינו עולה על גובה קומת הקרקע של המבנה' },
  { id: 'c2_6', text: 'שיפוע הגג לפחות 1.5% עם כרכוב היקפי ישר' },
  { id: 'c2_7', text: 'חומרים עמידים: שלד אלומיניום / ברזל עם מילואה מזכוכית בעלת 90% שקיפות לפחות' },
  { id: 'c2_8', text: 'ניהול מי גשמים בתעלת איסוף וצינור אנכי מוצנע' },
  { id: 'c2_9', text: 'אין שינוי / ציפוי / הגבהה של המדרכה הציבורית' },
  { id: 'c2_10', text: 'אין העברת תשתיות גלויה (חשמל, גז, מים)' },
  { id: 'c2_11', text: 'קיים אישור מהנדס / הנדסאי מבנים בדבר יציבות הסגירה' },
  { id: 'c2_12', text: 'קיים אישור יועץ בטיחות לסגירה' },
  { id: 'c2_13', text: 'קיים אישור יועץ נגישות מתו"ס לאנשים בעלי מוגבלויות' },
  { id: 'c2_14', text: 'שטח הסגירה מעל 30 מ"ר — בוצע תיאום מול אדריכלית העיר' },
];

const DOCS_LABELS = [
  { key: 'business_photo', label: 'תמונת העסק' },
  { key: 'closure_simulation', label: 'הדמיית הסגירה' },
  { key: 'site_plan', label: 'תוכנית העמדה' },
  { key: 'facade_plan', label: 'תוכנית חזית' },
  { key: 'section_plan', label: 'תוכנית חתך' },
];

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
      >
        <h3 className="font-bold text-gray-700 flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-blue-500" />}
          {title}
        </h3>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-6 pb-6 border-t border-gray-100 pt-4">{children}</div>}
    </div>
  );
}

function FieldRow({ label, value, missing }) {
  return (
    <div className={`flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0 text-sm`}>
      <span className="text-gray-500 min-w-[160px] flex-shrink-0">{label}:</span>
      {missing || !value ? (
        <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> לא מולא</span>
      ) : (
        <span className="text-gray-800 font-medium">{value}</span>
      )}
    </div>
  );
}

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [emailTo, setEmailTo] = useState('owner');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  useEffect(() => {
    base44.entities.ClosureApplication.filter({ id })
      .then(data => {
        const found = data[0];
        setApp(found);
        setNotes(found?.notes || '');
        setLoading(false);
      });
  }, [id]);

  const buildReportText = (currentApp, currentNotes) => {
    const checklist = currentApp.type === 'type1' ? CHECKLIST_TYPE1 : CHECKLIST_TYPE2;
    const checked = checklist.filter(c => currentApp.checklist?.[c.id]);
    const unchecked = checklist.filter(c => !currentApp.checklist?.[c.id]);
    const uploaded = DOCS_LABELS.filter(d => currentApp[d.key]);
    const missing = DOCS_LABELS.filter(d => !currentApp[d.key]);
    const missingF = [];
    if (!currentApp.business) missingF.push('שם העסק');
    if (!currentApp.owner) missingF.push('שם בעל העסק');
    if (!currentApp.address) missingF.push('כתובת');
    if (!currentApp.phone) missingF.push('טלפון');
    if (!currentApp.email) missingF.push('דואל');
    if (!currentApp.area) missingF.push('שטח');
    if (!currentApp.lat || !currentApp.lng) missingF.push('מיקום על המפה');
    if (!currentApp.description) missingF.push('תיאור הבקשה');

    const statusLabel = { approved: 'אושרה', rejected: 'נדחתה', pending_owner: 'ממתינה לתיקון', pending_review: 'בבדיקה' }[currentApp.status] || currentApp.status;
    const typeLabel = currentApp.type === 'type1' ? 'סגירת חורף / פרגוד' : 'סגירה עונתית';
    const line = '═'.repeat(52);
    const thin = '─'.repeat(52);

    return [
      line,
      `         עיריית אשדוד — מחלקת פיקוח עירוני`,
      `             דוח בדיקת בקשת סגירה`,
      line,
      `מספר בקשה : ${currentApp.application_id || 'לא צוין'}`,
      `תאריך בדיקה: ${new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      `סטטוס    : ${statusLabel}`,
      '',
      thin,
      `א. פרטי הבקשה`,
      thin,
      `שם העסק   : ${currentApp.business || 'לא מולא'}`,
      `סוג סגירה  : ${typeLabel}`,
      `שטח        : ${currentApp.area ? currentApp.area + ' מ"ר' : 'לא מולא'}`,
      `כתובת     : ${currentApp.address || 'לא מולא'}`,
      `מיקום      : ${currentApp.lat && currentApp.lng ? `${Number(currentApp.lat).toFixed(5)}, ${Number(currentApp.lng).toFixed(5)}` : 'לא סומן'}`,
      currentApp.description ? `תיאור      : ${currentApp.description}` : `תיאור      : לא צוין`,
      '',
      thin,
      `ב. פרטי בעל העסק`,
      thin,
      `שם           : ${currentApp.owner || 'לא מולא'}`,
      `טלפון        : ${currentApp.phone || 'לא מולא'}`,
      `דוא"ל        : ${currentApp.email || 'לא מולא'}`,
      ...(currentApp.applicant_name ? [`עורך בקשה  : ${currentApp.applicant_name}${currentApp.applicant_phone ? ' | ' + currentApp.applicant_phone : ''}`] : []),
      '',
      thin,
      `ג. שדות חסרים`,
      thin,
      missingF.length === 0
        ? '✅ כל השדות מולאו כראוי'
        : missingF.map(f => `⚠️  ${f}`).join('\n'),
      '',
      thin,
      `ד. עמידת בתנאים (${checked.length}/${checklist.length})`,
      thin,
      checked.length > 0 ? checked.map(c => `✓  ${c.text}`).join('\n') : 'אין תנאים שאושרו',
      '',
      unchecked.length > 0 ? [
        `תנאים שלא אושרו (${unchecked.length}):`,
        ...unchecked.map(c => `✗  ${c.text}`)
      ].join('\n') : '✅ כל התנאים אושרו',
      '',
      thin,
      `ה. מסמכים שהועלו (${uploaded.length}/${DOCS_LABELS.length})`,
      thin,
      uploaded.length > 0 ? uploaded.map(d => `✓  ${d.label}`).join('\n') : 'לא הועלו מסמכים',
      '',
      missing.length > 0 ? [
        `מסמכים חסרים (${missing.length}):`,
        ...missing.map(d => `✗  ${d.label}`)
      ].join('\n') : '✅ כל המסמכים הועלו',
      '',
      thin,
      `ו. הערות הבודק`,
      thin,
      currentNotes || 'לא צוינו הערות.',
      '',
      line,
      `הדוח נוצר במערכת ניהול סגירות — עיריית אשדוד`,
      line,
    ].join('\n');
  };

  const addHistory = (app, entry) => {
    return [...(app.history || []), { ...entry, date: new Date().toISOString() }];
  };

  const handleStatus = async (newStatus) => {
    setSaving(true);
    const report = buildReportText(app, notes);
    const statusLabel = { approved: 'אושרה', rejected: 'נדחתה', pending_owner: 'הוחזרה לתיקון', pending_review: 'בבדיקה' }[newStatus] || newStatus;
    const history = addHistory(app, {
      type: 'status_change',
      status: newStatus,
      notes,
      report_summary: report,
    });
    await base44.entities.ClosureApplication.update(app.id, { status: newStatus, notes, history });
    setApp(prev => ({ ...prev, status: newStatus, notes, history }));
    setSaving(false);
  };

  const buildEmailBody = () => {
    const report = buildReportText(app, notes);
    return report;
  };

  const emailSubject = `הערות בדיקה — ${app?.business || ''} (${app?.application_id || ''})`;

  const handleSendEmail = async () => {
    setSendingEmail(true);
    const body = buildEmailBody();

    if (app.email) {
      await base44.integrations.Core.SendEmail({
        to: app.email,
        subject: emailSubject,
        body,
      });
    }

    const history = addHistory(app, {
      type: 'email_sent',
      status: app.status,
      notes,
      email_sent_to: app.email,
      report_summary: body,
    });
    await base44.entities.ClosureApplication.update(app.id, { history, notes });
    setApp(prev => ({ ...prev, history, notes }));

    setSendingEmail(false);
    setEmailSent(true);
    setShowEmailPreview(false);
    setTimeout(() => setEmailSent(false), 3000);
  };

  if (loading) return <div className="text-center py-20 text-gray-400">טוען...</div>;
  if (!app) return <div className="text-center py-20 text-gray-400">הבקשה לא נמצאה</div>;

  const checklist = app.type === 'type1' ? CHECKLIST_TYPE1 : CHECKLIST_TYPE2;
  const checkedCount = checklist.filter(c => app.checklist?.[c.id]).length;
  const uncheckedItems = checklist.filter(c => !app.checklist?.[c.id]);

  const uploadedDocs = DOCS_LABELS.filter(d => app[d.key]);
  const missingDocs = DOCS_LABELS.filter(d => !app[d.key]);
  const additionalPhotos = app.additional_photos || [];

  const missingFields = [];
  if (!app.business) missingFields.push('שם העסק');
  if (!app.owner) missingFields.push('שם בעל העסק');
  if (!app.address) missingFields.push('כתובת');
  if (!app.phone) missingFields.push('טלפון');
  if (!app.email) missingFields.push('דוא"ל');
  if (!app.area) missingFields.push('שטח');
  if (!app.lat || !app.lng) missingFields.push('מיקום על המפה');
  if (!app.description) missingFields.push('תיאור הבקשה');

  return (
    <div dir="rtl" className="max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <button onClick={() => navigate('/architect')} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
        <ArrowRight className="w-4 h-4" /> חזרה לרשימת הבקשות
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{app.business}</h2>
            <p className="text-gray-400 text-sm mt-0.5">{app.application_id} · {app.type === 'type1' ? 'סגירת חורף / פרגוד' : 'סגירה עונתית'} · {app.area} מ״ר</p>
            {app.submitted_at && (
              <p className="text-gray-400 text-xs mt-1">הוגשה: {new Date(app.submitted_at).toLocaleDateString('he-IL')}</p>
            )}
          </div>
          <StatusBadge status={app.status} />
        </div>

        {/* Quick summary */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className={`rounded-xl p-3 ${missingFields.length === 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className={`text-2xl font-bold ${missingFields.length === 0 ? 'text-green-700' : 'text-red-600'}`}>{missingFields.length === 0 ? '✓' : missingFields.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">{missingFields.length === 0 ? 'כל השדות מולאו' : 'שדות חסרים'}</div>
          </div>
          <div className={`rounded-xl p-3 ${uncheckedItems.length === 0 ? 'bg-green-50' : 'bg-amber-50'}`}>
            <div className={`text-2xl font-bold ${uncheckedItems.length === 0 ? 'text-green-700' : 'text-amber-600'}`}>{checkedCount}/{checklist.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">תנאים אושרו</div>
          </div>
          <div className={`rounded-xl p-3 ${missingDocs.length === 0 ? 'bg-green-50' : 'bg-orange-50'}`}>
            <div className={`text-2xl font-bold ${missingDocs.length === 0 ? 'text-green-700' : 'text-orange-600'}`}>{uploadedDocs.length}/{DOCS_LABELS.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">מסמכים הועלו</div>
          </div>
        </div>
      </div>

      {/* Business details */}
      <Section title="פרטי הבקשה" icon={Building2}>
        <FieldRow label="שם העסק" value={app.business} />
        <FieldRow label="שם בעל העסק" value={app.owner} />
        <FieldRow label="כתובת" value={app.address} />
        <FieldRow label="טלפון" value={app.phone} />
        <FieldRow label='דוא"ל' value={app.email} />
        <FieldRow label="שטח" value={app.area ? `${app.area} מ״ר` : null} />
        <FieldRow label="מיקום" value={app.lat ? `${Number(app.lat).toFixed(5)}, ${Number(app.lng).toFixed(5)}` : null} />
        {app.description && (
          <div className="mt-3 bg-gray-50 rounded-xl p-3 text-sm text-gray-700">
            <span className="font-medium text-gray-600 block mb-1">תיאור הבקשה:</span>
            {app.description}
          </div>
        )}
        {missingFields.length > 0 && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> שדות שלא מולאו:</p>
            <div className="flex flex-wrap gap-1.5">
              {missingFields.map(f => (
                <span key={f} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{f}</span>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Official form fields */}
      {app.type === 'type1' && (app.license_file || app.business_type || app.period_from) && (
        <Section title="פרטי הרישוי" icon={FileText}>
          <FieldRow label="תיק רישוי" value={app.license_file} />
          <FieldRow label="סוג העסק" value={app.business_type} />
          <FieldRow label="מצב רישוי" value={app.license_status} />
          <FieldRow label="תקופה מ" value={app.period_from} />
          <FieldRow label="תקופה עד" value={app.period_to} />
          {app.applicant_name && <FieldRow label="עורך הבקשה" value={`${app.applicant_name}${app.applicant_phone ? ` · ${app.applicant_phone}` : ''}`} />}
          {app.form_notes && <div className="mt-3 bg-blue-50 rounded-xl p-3 text-sm text-blue-800">{app.form_notes}</div>}
        </Section>
      )}

      {app.type === 'type2' && (app.company_name || app.block) && (
        <Section title="פרטי חברה ומקרקעין" icon={Building2}>
          <FieldRow label="שם החברה" value={app.company_name} />
          <FieldRow label='ח"פ' value={app.company_id} />
          <FieldRow label="סוג נכס" value={app.property_type === 'private' ? 'שטח פרטי' : 'שטח ציבורי'} />
          <FieldRow label="גוש" value={app.block} />
          <FieldRow label="חלקה" value={app.parcel} />
          <FieldRow label="תקופת שימוש" value={app.usage_period} />
          <FieldRow label="מטרת השימוש" value={app.usage_purpose} />
        </Section>
      )}

      {/* Checklist */}
      <Section title={`רשימת תנאים — ${checkedCount}/${checklist.length} אושרו`} icon={CheckSquare}>
        <div className="space-y-2">
          {checklist.map(item => {
            const checked = app.checklist?.[item.id];
            return (
              <div key={item.id} className={`flex items-start gap-2.5 p-2.5 rounded-xl text-sm ${checked ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
                {checked
                  ? <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                {item.text}
              </div>
            );
          })}
        </div>
        {uncheckedItems.length > 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm font-semibold text-red-700 mb-1">תנאים שלא אושרו ({uncheckedItems.length}):</p>
            <ul className="list-disc list-inside space-y-0.5">
              {uncheckedItems.map(i => <li key={i.id} className="text-xs text-red-600">{i.text}</li>)}
            </ul>
          </div>
        )}
      </Section>

      {/* Documents */}
      <Section title="מסמכים ותמונות" icon={ImageIcon}>
        {uploadedDocs.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-sm font-semibold text-gray-600 mb-2">מסמכים שהועלו:</p>
            {uploadedDocs.map(d => (
              <a key={d.key} href={app[d.key]} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-800 hover:bg-green-100 transition">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="flex-1">{d.label}</span>
                <ExternalLink className="w-3.5 h-3.5 text-green-500" />
              </a>
            ))}
            {additionalPhotos.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2 mt-3">תמונות נוספות ({additionalPhotos.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {additionalPhotos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {missingDocs.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
            <p className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> מסמכים חסרים:</p>
            <div className="space-y-1">
              {missingDocs.map(d => (
                <div key={d.key} className="flex items-center gap-2 text-sm text-orange-600">
                  <XCircle className="w-4 h-4 flex-shrink-0" /> {d.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Menu items */}
      {app.menu_items?.length > 0 && (
        <Section title={`תפריט עסק (${app.menu_items.length} פריטים)`} icon={FileText} defaultOpen={false}>
          <div className="space-y-2">
            {app.menu_items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3">
                {item.image && <img src={item.image} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />}
                <div className="flex-1 text-sm">
                  <span className="font-medium text-gray-800">{item.name}</span>
                </div>
                {item.price && <span className="text-gray-500 text-sm">{item.price}</span>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* History */}
      {app.history?.length > 0 && (
        <Section title={`היסטוריית בקשה (${app.history.length} אירועים)`} icon={Calendar} defaultOpen={false}>
          <div className="space-y-3">
            {[...app.history].reverse().map((entry, i) => {
              const statusLabel = { approved: 'אושרה', rejected: 'נדחתה', pending_owner: 'הוחזרה לתיקון', pending_review: 'בבדיקה' }[entry.status] || entry.status;
              return (
                <div key={i} className={`rounded-xl border p-3 text-sm ${
                  entry.type === 'email_sent' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-gray-700">
                      {entry.type === 'email_sent' ? '✉️ נשלח מייל' : '🔄 שינוי סטטוס'}
                      {statusLabel && ` — ${statusLabel}`}
                    </span>
                    <span className="text-xs text-gray-400">{entry.date ? new Date(entry.date).toLocaleString('he-IL') : ''}</span>
                  </div>
                  {entry.email_sent_to && <p className="text-xs text-blue-600">נשלח אל: {entry.email_sent_to}</p>}
                  {entry.notes && <p className="text-xs text-gray-600 mt-1">הערות: {entry.notes}</p>}
                  {entry.report_summary && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">צפה בדוח המלא</summary>
                      <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap bg-white rounded-lg p-2 border border-gray-100 max-h-60 overflow-auto">{entry.report_summary}</pre>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Decision & Email */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-700 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-blue-500" /> חוות דעת ואישור
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">הערות לבעל העסק / לעורך הבקשה</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="פרט מה נדרש לתיקון, מה חסר, או נמק את ההחלטה..."
            rows={4}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* Email section */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-800 flex items-center gap-1.5"><Mail className="w-4 h-4" /> שליחת מייל עם דוח בדיקה</p>
          <p className="text-xs text-blue-600">אל: {app.email || 'לא הוזן'}</p>
          <button
            onClick={() => setShowEmailPreview(true)}
            disabled={!app.email || emailSent}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${emailSent ? 'bg-green-600 text-white' : 'bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50'}`}
          >
            {emailSent ? <><CheckCircle className="w-4 h-4" /> נשלח!</> : <><Mail className="w-4 h-4" /> צפה ושלח מייל</>}
          </button>
        </div>

        {/* Email Preview Modal */}
        {showEmailPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowEmailPreview(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Mail className="w-5 h-5 text-blue-600" /> תצוגה לפני שליחה</h3>
                <button onClick={() => setShowEmailPreview(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>
              <div className="px-6 py-4 border-b border-gray-100 space-y-2 bg-gray-50">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 w-12 flex-shrink-0">אל:</span>
                  <span className="font-medium text-gray-800">{app.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 w-12 flex-shrink-0">נושא:</span>
                  <span className="font-medium text-gray-800">{emailSubject}</span>
                </div>
              </div>
              <div className="flex-1 overflow-auto px-6 py-4">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-200">{buildEmailBody()}</pre>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                <button onClick={() => setShowEmailPreview(false)} className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 transition">בטל</button>
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition"
                >
                  {sendingEmail ? 'שולח...' : <><Send className="w-4 h-4" /> שלח מייל</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 flex-wrap pt-2 border-t border-gray-100">
          <button
            onClick={() => handleStatus('approved')}
            disabled={saving || app.status === 'approved'}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
          >
            <CheckCircle className="w-4 h-4" /> אשר בקשה
          </button>
          <button
            onClick={() => handleStatus('pending_owner')}
            disabled={saving}
            className="flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition"
          >
            <AlertCircle className="w-4 h-4" /> החזר לתיקון
          </button>
          <button
            onClick={() => handleStatus('rejected')}
            disabled={saving || app.status === 'rejected'}
            className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition"
          >
            <XCircle className="w-4 h-4" /> דחה בקשה
          </button>
        </div>
      </div>
    </div>
  );
}