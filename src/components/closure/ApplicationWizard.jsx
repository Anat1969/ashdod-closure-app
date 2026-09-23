import { useState, useEffect } from 'react';
import { Upload, X, ImageIcon, ChevronRight, ChevronLeft, Send, Plus, Trash2, UtensilsCrossed, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { nextApplicationId } from '@/lib/applicationId';
import MapPicker from './MapPicker';
import FileLink, { FileThumb } from './FileLink';
import { checklistFor, DECLARATIONS_TYPE1, DOCUMENTS_TYPE2, typeLabel, isValidEmail } from './constants';

const STEPS = ['סוג סגירה', 'טופס רשמי', 'רשימת תנאים', 'מסמכים ותמונות', 'תפריט עסק', 'אישור והגשה'];

const MAX_FILE_MB = 15;

// Returns the stored file URL, or null (after telling the user) when the upload fails.
async function uploadFile(file) {
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    alert(`הקובץ "${file.name}" גדול מדי (מעל ${MAX_FILE_MB}MB)`);
    return null;
  }
  try {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    return file_url;
  } catch (err) {
    alert(`שגיאה בהעלאת הקובץ "${file.name}": ${err.message}`);
    return null;
  }
}

function Field({ label, value, onChange, type = 'text', placeholder = '', required = false, error = '' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 mr-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        dir={type === 'email' || type === 'tel' ? 'ltr' : undefined}
        className={`w-full border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-300 ${error ? 'border-red-300' : 'border-gray-200'}`}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function CheckItem({ id, text, checked, onChange, fileUrl, onFileChange }) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file);
    if (url) onFileChange?.(id, url);
    setUploading(false);
    e.target.value = '';
  };
  return (
    <div className={`p-3 rounded-lg border transition-all ${checked ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-200'}`}>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={!!checked}
          onChange={() => onChange(id)}
          className="mt-0.5 w-4 h-4 accent-green-600"
        />
        <span className="text-sm text-gray-700 flex-1">{text}</span>
      </label>
      {onFileChange && (
        <div className="mt-2 mr-7">
          {fileUrl ? (
            <div className="flex items-center gap-2">
              <FileLink url={fileUrl}>קובץ מצורף ✓</FileLink>
              <button type="button" onClick={() => onFileChange(id, null)} className="text-red-400 hover:text-red-600 text-xs">הסר</button>
            </div>
          ) : (
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-400 hover:text-blue-600 transition">
              <Upload className="w-3.5 h-3.5" />
              {uploading ? 'מעלה...' : 'העלה מסמך'}
              <input type="file" className="hidden" disabled={uploading} onChange={handleFile} />
            </label>
          )}
        </div>
      )}
    </div>
  );
}

function FileUpload({ label, value, onChange, multiple }) {
  const [uploading, setUploading] = useState(false);
  const handle = async (input) => {
    const files = [...input.files];
    input.value = '';
    if (!files.length) return;
    setUploading(true);
    if (multiple) {
      const urls = (await Promise.all(files.map(uploadFile))).filter(Boolean);
      onChange([...(value || []), ...urls]);
    } else {
      const url = await uploadFile(files[0]);
      if (url) onChange(url);
    }
    setUploading(false);
  };
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {multiple ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {(value || []).map((url, i) => (
              <div key={i} className="relative">
                <FileThumb url={url} />
                <button type="button" onClick={() => onChange((value || []).filter((_, j) => j !== i))}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"><X className="w-2.5 h-2.5" /></button>
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 rounded-lg px-4 py-3 hover:border-blue-300 transition text-sm text-gray-500">
            <Upload className="w-4 h-4" /> {uploading ? 'מעלה...' : 'הוסף תמונות'}
            <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={e => handle(e.target)} />
          </label>
        </div>
      ) : (
        <div>
          {value ? (
            <div className="relative inline-block">
              <FileThumb url={value} className="w-40 h-32" />
              <button type="button" onClick={() => onChange(null)} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 rounded-lg px-4 py-3 hover:border-blue-300 transition text-sm text-gray-500">
              <Upload className="w-4 h-4" /> {uploading ? 'מעלה...' : 'בחר קובץ'}
              <input type="file" accept="image/*,application/pdf" className="hidden" disabled={uploading} onChange={e => handle(e.target)} />
            </label>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApplicationWizard({ application, onCancel, onSaved }) {
  const isEdit = !!application;
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    // Basic
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
    description: application?.description || '',
    business_photo: application?.business_photo || null,
    closure_simulation: application?.closure_simulation || null,
    site_plan: application?.site_plan || null,
    facade_plan: application?.facade_plan || null,
    section_plan: application?.section_plan || null,
    additional_photos: application?.additional_photos || [],
    // Type1 official form fields
    license_file: application?.license_file || '',
    business_type: application?.business_type || '',
    license_status: application?.license_status || '',
    period_from: application?.period_from || '',
    period_to: application?.period_to || '',
    applicant_name: application?.applicant_name || '',
    applicant_phone: application?.applicant_phone || '',
    applicant_license: application?.applicant_license || '',
    form_notes: application?.form_notes || '',
    declarations: application?.declarations || {},
    // Type2 official form fields
    property_type: application?.property_type || 'private',
    company_name: application?.company_name || '',
    company_id: application?.company_id || '',
    authorized_name: application?.authorized_name || '',
    authorized_id: application?.authorized_id || '',
    authorized_phone: application?.authorized_phone || '',
    authorized_email: application?.authorized_email || '',
    block: application?.block || '',
    parcel: application?.parcel || '',
    property_address: application?.property_address || '',
    property_lat: application?.property_lat || null,
    property_lng: application?.property_lng || null,
    usage_period: application?.usage_period || '',
    usage_option: application?.usage_option || '',
    usage_purpose: application?.usage_purpose || '',
    docs_checklist: application?.docs_checklist || {},
    menu_items: application?.menu_items || [],
  });

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  const checklist = checklistFor(form.type);
  const emailError = form.email && !isValidEmail(form.email) ? 'כתובת דוא"ל לא תקינה' : '';
  const periodError = form.period_from && form.period_to && form.period_to < form.period_from ? 'תאריך הסיום מוקדם מתאריך ההתחלה' : '';
  const allChecked = checklist.every(item => form.checklist[item.id]);
  const allDeclared = form.type === 'type1'
    ? DECLARATIONS_TYPE1.every(d => form.declarations[d.id])
    : true;

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const toggleCheck = (id) => setForm(f => ({ ...f, checklist: { ...f.checklist, [id]: !f.checklist[id] } }));
  const toggleDecl = (id) => setForm(f => ({ ...f, declarations: { ...f.declarations, [id]: !f.declarations[id] } }));
  const toggleDoc = (id) => setForm(f => ({ ...f, docs_checklist: { ...f.docs_checklist, [id]: !f.docs_checklist[id] } }));

  // asDraft keeps the application with the business owner (status pending_owner) for later completion.
  const save = async (asDraft) => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const history = [...(application?.history || []), {
        type: 'status_change',
        status: asDraft ? 'pending_owner' : 'pending_review',
        notes: asDraft ? 'נשמרה טיוטה' : (isEdit ? 'הוגשה מחדש' : 'הוגשה'),
        date: now,
      }];
      const payload = {
        ...form,
        area: form.area === '' ? '' : Number(form.area),
        email: form.email.trim(),
        status: asDraft ? 'pending_owner' : 'pending_review',
        history,
        ...(asDraft ? {} : { submitted_at: now }),
        application_id: application?.application_id || await nextApplicationId(),
      };
      if (isEdit) {
        await base44.entities.ClosureApplication.update(application.id, payload);
      } else {
        await base44.entities.ClosureApplication.create(payload);
      }
      alert(asDraft
        ? `הטיוטה נשמרה (${payload.application_id}). אפשר להמשיך למלא מאוחר יותר מ"הבקשות שלי".`
        : `הבקשה ${payload.application_id} הוגשה בהצלחה!`);
      onSaved();
    } catch (err) {
      const full = /quota/i.test(`${err?.name} ${err?.message}`);
      alert(full
        ? 'אין מספיק מקום באחסון הדפדפן. ייצאו גיבוי ומחקו בקשות ישנות, או העלו קבצים קטנים יותר.'
        : 'שגיאה בשמירת הבקשה: ' + err.message);
    } finally {
      setSaving(false);
    }
  };
  const handleSubmit = () => save(false);

  const addMenuItem = () => setForm(f => ({ ...f, menu_items: [...(f.menu_items || []), { name: '', price: '', image: null }] }));
  const updateMenuItem = (i, field, val) => setForm(f => {
    const items = [...(f.menu_items || [])];
    items[i] = { ...items[i], [field]: val };
    return { ...f, menu_items: items };
  });
  const removeMenuItem = (i) => setForm(f => ({ ...f, menu_items: (f.menu_items || []).filter((_, j) => j !== i) }));

  const canNext = () => {
    if (step === 0) return form.type && form.area;
    if (step === 1) return form.business && form.owner && form.address && form.phone && isValidEmail(form.email) && !periodError && allDeclared;
    if (step === 2) return allChecked;
    if (step === 3) return true;
    if (step === 4) return true;
    return true;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onCancel} className="text-blue-600 hover:text-blue-800 text-sm font-medium">→ חזרה</button>
        <h2 className="text-xl font-bold text-gray-800">{isEdit ? 'עריכה והגשה מחדש' : 'הגשת בקשה חדשה'}</h2>
      </div>

      {/* Steps */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => (i <= step || (i === step + 1 && canNext())) && setStep(i)}
            className={`flex-1 min-w-[88px] text-center text-xs py-2 px-1 rounded-lg font-medium transition-all ${
              i === step ? 'bg-blue-700 text-white' : i < step ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}>{s}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Step 0: Type & Area */}
        {step === 0 && (
          <div className="space-y-6">
            <h3 className="font-bold text-gray-700 mb-4">סוג הסגירה</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'type1', title: 'סגירת חורף / פרגוד', desc: 'סגירה זמנית לתקופת החורף (15.10–15.4)' },
                { id: 'type2', title: 'סגירה עונתית', desc: 'מבנה קבוע או חצי-קבוע' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => update('type', t.id)}
                  className={`border-2 rounded-xl p-4 text-right transition-all ${form.type === t.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                >
                  <div className="font-bold text-gray-800">{t.title}</div>
                  <div className="text-sm text-gray-500 mt-1">{t.desc}</div>
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שטח הסגירה (מ״ר)<span className="text-red-500 mr-0.5">*</span></label>
              <input
                type="number"
                min="1"
                value={form.area}
                onChange={e => update('area', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="לדוגמה: 25"
              />
            </div>
          </div>
        )}

        {/* Step 1: Official Form */}
        {step === 1 && form.type === 'type1' && (
          <div className="space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-2">
              <h3 className="font-bold text-blue-900 text-base mb-0.5">טופס בקשה לפרגוד</h3>
              <p className="text-xs text-blue-600">מחלקת פיקוח עירוני · עיריית אשדוד</p>
            </div>

            {/* פרטי העסק */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">פרטי העסק</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="שם העסק" required value={form.business} onChange={v => update('business', v)} />
                <Field label="שם בעל העסק" required value={form.owner} onChange={v => update('owner', v)} />
                <Field label="כתובת" required value={form.address} onChange={v => update('address', v)} />
                <Field label="טלפון" type="tel" required value={form.phone} onChange={v => update('phone', v)} />
                <Field label="דוא״ל" type="email" required value={form.email} onChange={v => update('email', v)} error={emailError} />
              </div>
              <MapPicker lat={form.lat} lng={form.lng} address={form.address} onSelect={(lat, lng) => setForm(f => ({ ...f, lat, lng }))} />
            </div>

            {/* פרטי הרישוי ותקופת הסגירה */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">פרטי הרישוי</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="תיק רישוי" value={form.license_file} onChange={v => update('license_file', v)} />
                <Field label="סוג העסק" value={form.business_type} onChange={v => update('business_type', v)} />
                <Field label="מצב רישוי" value={form.license_status} onChange={v => update('license_status', v)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="תקופה — מתאריך" type="date" value={form.period_from} onChange={v => update('period_from', v)} />
                <Field label="תקופה — עד תאריך" type="date" value={form.period_to} onChange={v => update('period_to', v)} error={periodError} />
              </div>
            </div>

            {/* פרטי עורך הבקשה */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">פרטי עורך הבקשה</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="שם" value={form.applicant_name} onChange={v => update('applicant_name', v)} />
                <Field label="נייד" type="tel" value={form.applicant_phone} onChange={v => update('applicant_phone', v)} />
                <Field label="מס׳ רישיון" value={form.applicant_license} onChange={v => update('applicant_license', v)} />
              </div>
            </div>

            {/* הערות */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
              <textarea value={form.form_notes} onChange={e => update('form_notes', e.target.value)} rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            {/* הצהרות */}
            <div className="border-t border-gray-200 pt-5">
              <h4 className="font-bold text-gray-700 mb-1">הצהרת בעל העסק</h4>
              <p className="text-sm text-gray-500 mb-4">יש לסמן את כל ההצהרות הבאות כדי להמשיך:</p>
              <div className="space-y-3">
                {DECLARATIONS_TYPE1.map(d => (
                  <CheckItem key={d.id} id={d.id} text={d.text} checked={form.declarations[d.id]} onChange={toggleDecl} />
                ))}
              </div>
              {!allDeclared && (
                <p className="text-amber-600 text-sm mt-4 bg-amber-50 px-3 py-2 rounded-lg">יש לאשר את כל ההצהרות כדי להמשיך</p>
              )}
            </div>
          </div>
        )}

        {step === 1 && form.type === 'type2' && (
          <div className="space-y-5">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-2">
              <h3 className="font-bold text-purple-900 text-base mb-0.5">טופס בקשה לסגירה עונתית</h3>
              <p className="text-xs text-purple-600">מחלקת נכסים · עיריית אשדוד</p>
            </div>

            {/* פרטי העסק ומיקום */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">פרטי העסק</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="שם העסק" required value={form.business} onChange={v => update('business', v)} />
                <Field label="שם בעל העסק" required value={form.owner} onChange={v => update('owner', v)} />
                <Field label="כתובת" required value={form.address} onChange={v => update('address', v)} />
                <Field label="טלפון" type="tel" required value={form.phone} onChange={v => update('phone', v)} />
                <Field label="דוא״ל" type="email" required value={form.email} onChange={v => update('email', v)} error={emailError} />
              </div>
              <MapPicker lat={form.lat} lng={form.lng} address={form.address} onSelect={(lat, lng) => setForm(f => ({ ...f, lat, lng }))} />
            </div>

            {/* פרטי החברה */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">פרטי החברה</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="שם החברה" value={form.company_name} onChange={v => update('company_name', v)} />
                <Field label="ח.פ" value={form.company_id} onChange={v => update('company_id', v)} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">סוג נכס מבוקש</p>
                <div className="flex gap-4">
                  {[{ val: 'private', label: 'שטח פרטי' }, { val: 'public', label: 'שטח ציבורי' }].map(o => (
                    <label key={o.val} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${form.property_type === o.val ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}>
                      <input type="radio" name="property_type" value={o.val} checked={form.property_type === o.val} onChange={() => update('property_type', o.val)} className="accent-purple-600" />
                      <span className="text-sm font-medium">{o.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* פרטי המקרקעין */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">פרטי המקרקעין</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="גוש" value={form.block} onChange={v => update('block', v)} />
                <Field label="חלקה" value={form.parcel} onChange={v => update('parcel', v)} />
                <Field label="כתובת הנכס" value={form.property_address} onChange={v => update('property_address', v)} />
              </div>
            </div>

            {/* תנאי השימוש */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">תנאי השימוש</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="תקופת השימוש המבוקשת" value={form.usage_period} onChange={v => update('usage_period', v)} placeholder="לדוגמה: שנה אחת" />
                <Field label="אופציה" value={form.usage_option} onChange={v => update('usage_option', v)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מטרת השימוש</label>
                <textarea value={form.usage_purpose} onChange={e => update('usage_purpose', e.target.value)} rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
            </div>

            {/* מסמכים נדרשים */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-bold text-gray-700 mb-1">מסמכים נדרשים לצירוף</h4>
              <p className="text-sm text-gray-500 mb-4">סמן את המסמכים הקיימים / המוכנים לצירוף והעלה את הקובץ:</p>
              <div className="space-y-3">
                {DOCUMENTS_TYPE2.map(d => (
                  <CheckItem
                    key={d.id}
                    id={d.id}
                    text={d.text}
                    checked={form.docs_checklist[d.id]}
                    onChange={toggleDoc}
                    fileUrl={form.docs_files?.[d.id] || null}
                    onFileChange={(id, url) => setForm(f => ({ ...f, docs_files: { ...(f.docs_files || {}), [id]: url } }))}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Checklist */}
        {step === 2 && (
          <div>
            <h3 className="font-bold text-gray-700 mb-2">
              רשימת תנאים — {typeLabel(form.type)}
            </h3>
            <p className="text-sm text-gray-500 mb-4">יש לאשר את עמידת העסק בכל התנאים הבאים:</p>
            <div className="space-y-3">
              {checklist.map(item => (
                <CheckItem key={item.id} id={item.id} text={item.text} checked={form.checklist[item.id]} onChange={toggleCheck} />
              ))}
            </div>
            {!allChecked && (
              <p className="text-amber-600 text-sm mt-4 bg-amber-50 px-3 py-2 rounded-lg">
                יש לאשר את כל התנאים כדי להמשיך
              </p>
            )}
          </div>
        )}

        {/* Step 3: Documents */}
        {step === 3 && (
          <div className="space-y-5">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-blue-500" /> מסמכים ותמונות</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תיאור הבקשה</label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3}
                placeholder="תאר את הסגירה המבוקשת, מטרתה ופרטים נוספים..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <FileUpload label="תמונת העסק" value={form.business_photo} onChange={v => update('business_photo', v)} />
            <FileUpload label="הדמיית הסגירה" value={form.closure_simulation} onChange={v => update('closure_simulation', v)} />
            <FileUpload label="תוכנית העמדה בתוך תוכנית מדידה" value={form.site_plan} onChange={v => update('site_plan', v)} />
            <FileUpload label="תוכנית חזית" value={form.facade_plan} onChange={v => update('facade_plan', v)} />
            <FileUpload label="תוכנית חתך" value={form.section_plan} onChange={v => update('section_plan', v)} />
            <FileUpload label="תמונות נוספות" value={form.additional_photos} onChange={v => update('additional_photos', v)} multiple />
          </div>
        )}

        {/* Step 4: Menu */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <UtensilsCrossed className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-700">תפריט העסק</h3>
            </div>
            <p className="text-sm text-gray-500">הוסף פריטים לתפריט העסק — שם, מחיר ותמונה (אופציונלי)</p>
            <div className="space-y-3">
              {(form.menu_items || []).map((item, i) => (
                <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                  {/* תמונה */}
                  {item.image ? (
                    <div className="relative flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg border" />
                      <button type="button" onClick={() => updateMenuItem(i, 'image', null)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center"><X className="w-2.5 h-2.5" /></button>
                    </div>
                  ) : (
                    <label className="flex-shrink-0 w-14 h-14 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-400 transition text-gray-400 text-xs">
                      <Upload className="w-4 h-4 mb-0.5" />
                      תמונה
                      <input type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; const url = await uploadFile(f); if (url) updateMenuItem(i, 'image', url); }} />
                    </label>
                  )}
                  {/* שם */}
                  <input
                    type="text"
                    value={item.name}
                    onChange={e => updateMenuItem(i, 'name', e.target.value)}
                    placeholder="שם הפריט"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  {/* מחיר */}
                  <input
                    type="text"
                    value={item.price}
                    onChange={e => updateMenuItem(i, 'price', e.target.value)}
                    placeholder="₪מחיר"
                    className="w-20 sm:w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  <button type="button" onClick={() => removeMenuItem(i)} className="text-red-400 hover:text-red-600 transition flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addMenuItem} className="flex items-center gap-2 w-full border-2 border-dashed border-orange-200 rounded-xl px-4 py-3 text-orange-600 hover:border-orange-400 hover:bg-orange-50 transition text-sm font-medium justify-center">
              <Plus className="w-4 h-4" /> הוסף פריט לתפריט
            </button>
          </div>
        )}

        {/* Step 5: Summary */}
        {step === 5 && (
          <div className="text-center py-8">
            <Send className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">מוכן להגשה</h3>
            <p className="text-gray-500 mb-6">הבקשה תועבר לבודק העירייה לבדיקה ואישור</p>
            <div className="bg-gray-50 rounded-xl p-4 text-right mb-6 space-y-2 text-sm text-gray-600">
              <p><strong>עסק:</strong> {form.business}</p>
              <p><strong>כתובת:</strong> {form.address}</p>
              <p><strong>סוג:</strong> {typeLabel(form.type)}</p>
              <p><strong>שטח:</strong> {form.area} מ״ר</p>
              <p><strong>מיקום:</strong> {form.lat ? `${Number(form.lat).toFixed(5)}, ${Number(form.lng).toFixed(5)}` : 'לא סומן'}</p>
              <p><strong>תנאים מאושרים:</strong> {checklist.filter(c => form.checklist[c.id]).length}/{checklist.length}</p>
              {form.description && <p><strong>תיאור:</strong> {form.description}</p>}
              <p><strong>מסמכים שהועלו:</strong> {[form.business_photo, form.closure_simulation, form.site_plan, form.facade_plan, form.section_plan].filter(Boolean).length + (form.additional_photos?.length || 0) + Object.values(form.docs_files || {}).filter(Boolean).length} קבצים</p>
              <p><strong>פריטי תפריט:</strong> {(form.menu_items || []).filter(m => m.name).length} פריטים</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center gap-2 mt-6 flex-wrap">
        <button
          type="button"
          onClick={() => step > 0 ? setStep(s => s - 1) : onCancel()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
        >
          <ChevronRight className="w-4 h-4" /> הקודם
        </button>
        <button
          type="button"
          onClick={() => save(true)}
          disabled={saving || !form.business}
          title={!form.business ? 'יש למלא לפחות את שם העסק' : ''}
          className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          <Save className="w-4 h-4" /> שמור טיוטה
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
            className="flex items-center gap-2 px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            הבא <ChevronLeft className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
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