import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/closure/StatusBadge';
import FileLink, { FileThumb } from '../components/closure/FileLink';
import {
  checklistFor, DOCS_LABELS, DOCUMENTS_TYPE2, STATUS_ACTION_LABELS, typeLabel, missingFieldsOf, menuItemsOf,
} from '../components/closure/constants';
import { TILE_URL, TILE_ATTRIBUTION, hasCoords } from '@/lib/map';
import {
  ArrowRight, Mail, FileText, CheckCircle, XCircle,
  AlertCircle, Send, ImageIcon, Building2, Calendar,
  CheckSquare, ChevronDown, ChevronUp, Printer, Trash2, Copy
} from 'lucide-react';

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function printReport(title, text) {
  const win = window.open('', '_blank');
  if (!win) {
    alert('הדפדפן חסם את חלון ההדפסה. אפשרו חלונות קופצים לאתר זה.');
    return;
  }
  win.document.write(`<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
    <style>body{font-family:Arial,sans-serif;margin:32px;color:#111}pre{white-space:pre-wrap;font-family:inherit;font-size:14px;line-height:1.7}</style>
    </head><body><pre>${escapeHtml(text)}</pre></body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-gray-50 transition"
      >
        <h3 className="font-bold text-gray-700 flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-blue-500" />}
          {title}
        </h3>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-4 sm:px-6 pb-6 border-t border-gray-100 pt-4">{children}</div>}
    </div>
  );
}

function FieldRow({ label, value, missing }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-2 py-1.5 border-b border-gray-50 last:border-0 text-sm">
      <span className="text-gray-500 sm:min-w-[160px] flex-shrink-0">{label}:</span>
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
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  useEffect(() => {
    base44.entities.ClosureApplication.get(id)
      .then(found => {
        setApp(found);
        setNotes(found?.notes || '');
      })
      .catch(() => setApp(null))
      .finally(() => setLoading(false));
  }, [id]);

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/architect'));

  const buildReportText = (currentApp, currentNotes) => {
    const checklist = checklistFor(currentApp.type);
    const checked = checklist.filter(c => currentApp.checklist?.[c.id]);
    const unchecked = checklist.filter(c => !currentApp.checklist?.[c.id]);
    const uploaded = DOCS_LABELS.filter(d => currentApp[d.key]);
    const missing = DOCS_LABELS.filter(d => !currentApp[d.key]);
    const missingF = missingFieldsOf(currentApp);
    const statusLabel = STATUS_ACTION_LABELS[currentApp.status] || currentApp.status;
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
      `סוג סגירה  : ${typeLabel(currentApp.type)}`,
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
    if (newStatus === 'rejected' && !notes.trim() && !window.confirm('לדחות את הבקשה בלי לכתוב נימוק בהערות?')) return;
    setSaving(true);
    try {
      const report = buildReportText({ ...app, status: newStatus }, notes);
      const history = addHistory(app, {
        type: 'status_change',
        status: newStatus,
        notes,
        report_summary: report,
      });
      await base44.entities.ClosureApplication.update(app.id, { status: newStatus, notes, history });
      setApp(prev => ({ ...prev, status: newStatus, notes, history }));
    } catch (err) {
      alert('שגיאה בעדכון הסטטוס: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await base44.entities.ClosureApplication.update(app.id, { notes });
      setApp(prev => ({ ...prev, notes }));
    } catch (err) {
      alert('שגיאה בשמירת ההערות: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`למחוק לצמיתות את הבקשה של "${app.business}" (${app.application_id || ''})?\nלא ניתן לשחזר את הפעולה אלא מגיבוי.`)) return;
    await base44.entities.ClosureApplication.delete(app.id);
    navigate('/architect', { replace: true });
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(buildReportText(app, notes));
      alert('הדוח הועתק. אפשר להדביק אותו בכל מקום.');
    } catch {
      alert('לא ניתן להעתיק אוטומטית בדפדפן זה');
    }
  };

  const buildEmailBody = () => {
    const report = buildReportText(app, notes);
    return report;
  };

  const emailSubject = `הערות בדיקה — ${app?.business || ''} (${app?.application_id || ''})`;

  const handleSendEmail = async () => {
    setSendingEmail(true);
    const body = buildEmailBody();

    // Long reports may be cut in the mail program, so keep a full copy on the clipboard too.
    try { await navigator.clipboard.writeText(body); } catch { /* clipboard not available */ }
    await base44.integrations.Core.SendEmail({
      to: app.email,
      subject: emailSubject,
      body,
    });

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

  const checklist = checklistFor(app.type);
  const checkedCount = checklist.filter(c => app.checklist?.[c.id]).length;
  const uncheckedItems = checklist.filter(c => !app.checklist?.[c.id]);

  const uploadedDocs = DOCS_LABELS.filter(d => app[d.key]);
  const missingDocs = DOCS_LABELS.filter(d => !app[d.key]);
  const additionalPhotos = app.additional_photos || [];

  const missingFields = missingFieldsOf(app);
  const menuItems = menuItemsOf(app);
  const type2Docs = app.type === 'type2' ? DOCUMENTS_TYPE2.filter(d => app.docs_files?.[d.id] || app.docs_checklist?.[d.id]) : [];

  return (
    <div dir="rtl" className="max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <button type="button" onClick={goBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
        <ArrowRight className="w-4 h-4" /> חזרה
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{app.business}</h2>
            <p className="text-gray-400 text-sm mt-0.5">{app.application_id} · {typeLabel(app.type)}{app.area ? ` · ${app.area} מ״ר` : ''}</p>
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
        <FieldRow label="מיקום" value={hasCoords(app) ? `${Number(app.lat).toFixed(5)}, ${Number(app.lng).toFixed(5)}` : null} />
        {hasCoords(app) && (
          <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 relative z-0" style={{ height: 200 }}>
            <MapContainer center={[Number(app.lat), Number(app.lng)]} zoom={17} className="w-full h-full" scrollWheelZoom={false}>
              <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
              <Marker position={[Number(app.lat), Number(app.lng)]} />
            </MapContainer>
          </div>
        )}
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
          <FieldRow label="כתובת הנכס" value={app.property_address} />
          <FieldRow label="תקופת שימוש" value={app.usage_period} />
          <FieldRow label="אופציה" value={app.usage_option} />
          <FieldRow label="מטרת השימוש" value={app.usage_purpose} />
          {(app.authorized_name || app.authorized_phone) && (
            <FieldRow label="מורשה חתימה" value={[app.authorized_name, app.authorized_phone, app.authorized_email].filter(Boolean).join(' · ')} />
          )}
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
              <FileLink key={d.key} url={app[d.key]}
                className="w-full flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-800 hover:bg-green-100 transition text-right">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="flex-1">{d.label}</span>
              </FileLink>
            ))}
            {additionalPhotos.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2 mt-3">תמונות נוספות ({additionalPhotos.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {additionalPhotos.map((url, i) => (
                    <FileThumb key={i} url={url} alt={`תמונה ${i + 1}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {type2Docs.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-600 mb-2">מסמכים נדרשים (סגירה עונתית):</p>
            <div className="space-y-1.5">
              {type2Docs.map(d => (
                <div key={d.id} className="flex items-center gap-2 text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
                  {app.docs_checklist?.[d.id] ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-gray-300" />}
                  <span className="flex-1">{d.text}</span>
                  {app.docs_files?.[d.id] ? <FileLink url={app.docs_files[d.id]}>פתח קובץ</FileLink> : <span className="text-xs text-gray-400">לא צורף קובץ</span>}
                </div>
              ))}
            </div>
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
      {menuItems.length > 0 && (
        <Section title={`תפריט עסק (${menuItems.length} פריטים)`} icon={FileText} defaultOpen={false}>
          <div className="space-y-2">
            {menuItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3">
                {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />}
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
              const statusLabel = STATUS_ACTION_LABELS[entry.status] || entry.status;
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-500" /> חוות דעת ואישור
          </h3>
          <div className="flex gap-2">
            <button type="button" onClick={() => printReport(`דוח בדיקה — ${app.business || ''}`, buildReportText(app, notes))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              <Printer className="w-4 h-4" /> הדפס / PDF
            </button>
            <button type="button" onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              <Copy className="w-4 h-4" /> העתק דוח
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">הערות לבעל העסק / לעורך הבקשה</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="פרט מה נדרש לתיקון, מה חסר, או נמק את ההחלטה..."
            rows={4}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          {notes !== (app.notes || '') && (
            <button type="button" onClick={handleSaveNotes} disabled={saving}
              className="mt-2 text-sm px-3 py-1.5 rounded-lg bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50">
              שמור הערות
            </button>
          )}
        </div>

        {/* Email section */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-800 flex items-center gap-1.5"><Mail className="w-4 h-4" /> שליחת מייל עם דוח בדיקה</p>
          <p className="text-xs text-blue-600">אל: {app.email || 'לא הוזן'} · ייפתח בתוכנת הדואר שלך, והדוח המלא יועתק גם ללוח</p>
          <button
            type="button"
            onClick={() => setShowEmailPreview(true)}
            disabled={!app.email || emailSent}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${emailSent ? 'bg-green-600 text-white' : 'bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50'}`}
          >
            {emailSent ? <><CheckCircle className="w-4 h-4" /> נפתח בתוכנת הדואר</> : <><Mail className="w-4 h-4" /> צפה ושלח מייל</>}
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
                  {sendingEmail ? 'פותח...' : <><Send className="w-4 h-4" /> פתח בתוכנת הדואר</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 flex-wrap pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => handleStatus('approved')}
            disabled={saving || app.status === 'approved'}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
          >
            <CheckCircle className="w-4 h-4" /> אשר בקשה
          </button>
          <button
            type="button"
            onClick={() => handleStatus('pending_owner')}
            disabled={saving}
            className="flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition"
          >
            <AlertCircle className="w-4 h-4" /> החזר לתיקון
          </button>
          <button
            type="button"
            onClick={() => handleStatus('rejected')}
            disabled={saving || app.status === 'rejected'}
            className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition"
          >
            <XCircle className="w-4 h-4" /> דחה בקשה
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 transition sm:mr-auto"
          >
            <Trash2 className="w-4 h-4" /> מחק בקשה
          </button>
        </div>
      </div>
    </div>
  );
}