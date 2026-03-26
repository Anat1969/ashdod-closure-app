import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import StatusBadge from './StatusBadge';

import { CheckCircle, XCircle, Clock, FileText, Search, SlidersHorizontal, Upload, Loader2 } from 'lucide-react';

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
    const data = await base44.entities.ClosureApplication.list('-created_date', 200);
    setApps(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedFile({ name: file.name, url: file_url });
      setExtractedData(null);
    } catch (err) {
      alert('שגיאה בהעלאת הקובץ');
    } finally {
      setUploading(false);
    }
  };

  const handleExtract = async () => {
    if (!uploadedFile) return;
    setExtracting(true);
    try {
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: uploadedFile.url,
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
      const newApps = extractedData.map(data => ({
        business: data.business,
        address: data.address,
        business_type: data.business_type,
        type: data.closure_type,
        owner: '',
        phone: '',
        email: '',
        area: 0,
        status: 'pending_owner',
        checklist: {},
        submitted_at: new Date().toISOString(),
        application_id: `ASH-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`,
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
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">מסלול עירייה — בדיקת בקשות</h2>

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
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4" /> ייבוא בקשות ממסמך
        </h3>
        <div className="flex flex-wrap gap-3 items-center">
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 transition text-sm text-blue-700">
            <Upload className="w-4 h-4" />
            {uploading ? 'מעלה...' : uploadedFile ? `קובץ נבחר: ${uploadedFile.name}` : 'בחר קובץ (PDF/Word/Excel/תמונה)'}
            <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
          {uploadedFile && (
            <>
              <button
                onClick={handleExtract}
                disabled={extracting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition text-sm font-medium disabled:opacity-50"
              >
                {extracting ? <><Loader2 className="w-4 h-4 animate-spin" /> מנתח...</> : 'חלץ נתונים'}
              </button>
              {extractedData && (
                <button
                  onClick={handleCreateApplications}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                >
                  צור בקשה
                </button>
              )}
            </>
          )}
        </div>
        {extractedData && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
            <p className="font-semibold text-green-800 mb-2">נתונים שחולצו ({extractedData.length} עסקים):</p>
            <div className="space-y-2 max-h-60 overflow-auto">
              {extractedData.map((item, i) => (
                <div key={i} className="bg-white rounded p-2 border border-green-200">
                  <div className="grid grid-cols-2 gap-2 text-green-700">
                    <div><span className="font-medium">עסק:</span> {item.business}</div>
                    <div><span className="font-medium">כתובת:</span> {item.address}</div>
                    <div><span className="font-medium">סוג עסק:</span> {item.business_type}</div>
                    <div><span className="font-medium">סוג סגירה:</span> {item.closure_type === 'type1' ? 'סגירת חורף/פרגוד' : 'סגירה עונתית'}</div>
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
              className="w-full text-right bg-white rounded-xl border p-4 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition-all border-gray-100"
            >
              <StatusBadge status={app.status} />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-800">{app.business}</div>
                <div className="text-sm text-gray-500 truncate">{app.address} · {app.owner}</div>
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                {app.type === 'type1' ? 'עונתי' : 'קבוע'} · {app.area} מ״ר
              </div>
              <div className="text-xs text-gray-300 flex-shrink-0">{app.application_id}</div>
            </button>
          ))}
        </div>
      )}


    </div>
  );
}