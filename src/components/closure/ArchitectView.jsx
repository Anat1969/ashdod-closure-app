import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import StatusBadge from './StatusBadge';
import { nextApplicationIds } from '@/lib/applicationId';
import { downloadBlob } from '@/lib/files';
import { typeLabel, STATUS_LABELS, checklistFor } from './constants';

import { CheckCircle, XCircle, Clock, FileText, Search, SlidersHorizontal, Upload, Loader2, Download, FileSpreadsheet } from 'lucide-react';

async function exportApplicationsToExcel(apps) {
  const XLSX = await import('xlsx');
  const rows = apps.map(a => ({
    'מספר בקשה': a.application_id || '',
    'שם העסק': a.business || '',
    'בעל העסק': a.owner || '',
    'כתובת': a.address || '',
    'טלפון': a.phone || '',
    'דוא"ל': a.email || '',
    'סוג העסק': a.business_type || '',
    'סוג סגירה': typeLabel(a.type),
    'שטח (מ"ר)': a.area || '',
    'סטטוס': STATUS_LABELS[a.status] || a.status || '',
    'תנאים שאושרו': `${checklistFor(a.type).filter(c => a.checklist?.[c.id]).length}/${checklistFor(a.type).length}`,
    'תאריך הגשה': a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('he-IL') : '',
    'הערות בודק': a.notes || '',
    'קו רוחב': a.lat ?? '',
    'קו אורך': a.lng ?? '',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = Object.keys(rows[0] || { a: 1 }).map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  wb.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(wb, ws, 'בקשות');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  downloadBlob(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `בקשות-סגירה-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

async function downloadImportTemplate() {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet([
    ['שם העסק', 'כתובת', 'סוג העסק', 'סוג הסגירה'],
    ['קפה לדוגמה', 'שדרות הרצל 10, אשדוד', 'בית קפה', 'פרגוד'],
    ['מסעדה לדוגמה', 'רוגוזין 5, אשדוד', 'מסעדה', 'עונתית'],
  ]);
  ws['!cols'] = [{ wch: 20 }, { wch: 28 }, { wch: 16 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  wb.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(wb, ws, 'עסקים');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  downloadBlob(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'תבנית-ייבוא-עסקים.xlsx');
}

const STATUSES = [
  { val: 'all', label: 'הכל' },
  { val: 'pending_review', label: 'ממתינות לבדיקה' },
  { val: 'pending_owner', label: 'ממתין לבעל עסק' },
  { val: 'approved', label: 'מאושרות' },
  { val: 'rejected', label: 'נדחות' },
];

const SORT_OPTIONS = [
  { val: '-created_date', label: 'חדש לישן' },
  { val: 'created_date', label: 'ישן לחדש' },
  { val: 'business', label: 'לפי שם עסק' },
  { val: '-updated_date', label: 'עודכן לאחרונה' },
];

export default function ArchitectView() {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending_review');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('-created_date');
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setApps(await base44.entities.ClosureApplication.list('-created_date'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const uploaded = { name: file.name, url: file_url };
      setUploadedFile(uploaded);
      setExtractedData(null);
      await handleExtract(uploaded);
    } catch (err) {
      alert('שגיאה בקריאת הקובץ: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleExtract = async (fileToRead = uploadedFile) => {
    if (!fileToRead) return;
    setExtracting(true);
    try {
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileToRead.url,
        json_schema: {
          type: 'object',
          properties: {
            businesses: {
              type: 'array',
              title: 'רשימת עסקים',
              items: {
                type: 'object',
                properties: {
                  business: { type: 'string', title: 'שם העסק' },
                  address: { type: 'string', title: 'הכתובת' },
                  business_type: { type: 'string', title: 'סוג העסק' },
                  closure_type: { type: 'string', title: 'סוג הסגירה', enum: ['type1', 'type2'] },
                },
                required: ['business', 'address', 'business_type', 'closure_type'],
              },
            },
          },
          required: ['businesses'],
        },
      });

      if (result.status === 'success' && result.output && result.output.businesses) {
        setExtractedData(result.output.businesses);
      } else {
        alert('שגיאה בחילוץ נתונים: ' + (result.details || 'לא הצליח לחלץ נתונים'));
      }
    } catch (err) {
      alert('שגיאה בחילוץ נתונים: ' + err.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleCreateApplications = async () => {
    if (!extractedData || !Array.isArray(extractedData)) return;
    try {
      const ids = await nextApplicationIds(extractedData.length);
      const newApps = extractedData.map((data, i) => ({
        business: data.business,
        address: data.address,
        business_type: data.business_type,
        type: data.closure_type,
        owner: '',
        phone: '',
        email: '',
        area: '',
        status: 'pending_owner',
        checklist: {},
        application_id: ids[i],
        history: [{ type: 'status_change', status: 'pending_owner', notes: 'נוצרה מייבוא קובץ', date: new Date().toISOString() }],
      }));
      await base44.entities.ClosureApplication.bulkCreate(newApps);
      alert(`נוצרו ${newApps.length} בקשות בהצלחה!`);
      setUploadedFile(null);
      setExtractedData(null);
      load();
    } catch (err) {
      alert('שגיאה ביצירת הבקשות: ' + err.message);
    }
  };



  const stats = [
    { label: 'ממתינות לבדיקה', count: apps.filter(a => a.status === 'pending_review').length, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', val: 'pending_review', icon: Clock },
    { label: 'ממתין לבעל עסק', count: apps.filter(a => a.status === 'pending_owner').length, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', val: 'pending_owner', icon: FileText },
    { label: 'מאושרות', count: apps.filter(a => a.status === 'approved').length, color: 'text-green-600', bg: 'bg-green-50 border-green-200', val: 'approved', icon: CheckCircle },
    { label: 'נדחות', count: apps.filter(a => a.status === 'rejected').length, color: 'text-red-600', bg: 'bg-red-50 border-red-200', val: 'rejected', icon: XCircle },
  ];

  let filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(a =>
      a.business?.toLowerCase().includes(q) ||
      a.address?.toLowerCase().includes(q) ||
      a.owner?.toLowerCase().includes(q) ||
      a.application_id?.toLowerCase().includes(q)
    );
  }
  if (sort === 'business') {
    filtered = [...filtered].sort((a, b) => (a.business || '').localeCompare(b.business || '', 'he'));
  } else if (sort === 'created_date') {
    filtered = [...filtered].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  } else if (sort === '-updated_date') {
    filtered = [...filtered].sort((a, b) => new Date(b.updated_date || 0) - new Date(a.updated_date || 0));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <h2 className="text-2xl font-bold text-gray-800">מסלול עירייה — בדיקת בקשות</h2>
        <button
          type="button"
          onClick={() => exportApplicationsToExcel(filtered)}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          <Download className="w-4 h-4" /> ייצוא לאקסל ({filtered.length})
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.val}
              onClick={() => setFilter(s.val)}
              className={`border rounded-xl p-4 text-center transition-all hover:opacity-90 ${s.bg} ${filter === s.val ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
            >
              <Icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
              <div className={`text-3xl font-bold ${s.color}`}>{s.count}</div>
              <div className="text-gray-600 text-xs mt-1">{s.label}</div>
            </button>
          );
        })}
      </div>

      {/* File upload & extract section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Upload className="w-4 h-4" /> ייבוא רשימת עסקים מאקסל
          </h3>
          <button type="button" onClick={downloadImportTemplate} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline">
            <FileSpreadsheet className="w-3.5 h-3.5" /> הורדת תבנית לדוגמה
          </button>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 transition text-sm text-blue-700">
            <Upload className="w-4 h-4" />
            {uploading || extracting ? 'קורא את הקובץ...' : uploadedFile ? `קובץ נבחר: ${uploadedFile.name}` : 'בחר קובץ Excel / CSV'}
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
          {extracting && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
          {extractedData && (
            <>
              <button
                type="button"
                onClick={handleCreateApplications}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
              >
                צור {extractedData.length} בקשות
              </button>
              <button
                type="button"
                onClick={() => { setExtractedData(null); setUploadedFile(null); }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                ביטול
              </button>
            </>
          )}
        </div>
        {extractedData && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
            <p className="font-semibold text-green-800 mb-2">נתונים שחולצו ({extractedData.length} עסקים):</p>
            <div className="space-y-2 max-h-60 overflow-auto">
              {extractedData.map((item, i) => (
                <div key={i} className="bg-white rounded p-2 border border-green-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-green-700">
                    <div><span className="font-medium">עסק:</span> {item.business}</div>
                    <div><span className="font-medium">כתובת:</span> {item.address}</div>
                    <div><span className="font-medium">סוג עסק:</span> {item.business_type}</div>
                    <div><span className="font-medium">סוג סגירה:</span> {typeLabel(item.closure_type)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s.val}
              type="button"
              onClick={() => setFilter(s.val)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filter === s.val ? 'bg-white shadow text-blue-800' : 'text-gray-500 hover:text-gray-800'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[180px] relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש לפי עסק, כתובת, בעלים..."
            className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <SlidersHorizontal className="w-4 h-4" />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          >
            {SORT_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">טוען...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">אין בקשות בקטגוריה זו</div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 mb-2">{filtered.length} בקשות</p>
          {filtered.map(app => (
            <button
              key={app.id}
              onClick={() => navigate(`/architect/${app.id}`)}
              type="button"
              className="w-full text-right bg-white rounded-xl border p-4 flex items-center gap-3 sm:gap-4 hover:border-blue-300 hover:shadow-sm transition-all border-gray-100"
            >
              <StatusBadge status={app.status} />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-800">{app.business || 'ללא שם'}</div>
                <div className="text-sm text-gray-500 truncate">{[app.address, app.owner].filter(Boolean).join(' · ')}</div>
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                {typeLabel(app.type)}{app.area ? ` · ${app.area} מ״ר` : ''}
              </div>
              <div className="text-xs text-gray-300 flex-shrink-0">{app.application_id}</div>
            </button>
          ))}
        </div>
      )}


    </div>
  );
}