import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ApplicationWizard from './ApplicationWizard';
import StatusBadge from './StatusBadge';
import { typeLabel } from './constants';
import { Plus, FileText, RefreshCw, ClipboardList, FormInput, Layers, Upload, Clock, CheckCircle2, Search } from 'lucide-react';

const PROCESS_STEPS = [
  { icon: ClipboardList, label: 'פתיחת בקשה' },
  { icon: FormInput, label: 'מילוי פרטים' },
  { icon: Layers, label: 'בחירת סוג הסגירה' },
  { icon: Upload, label: 'העלאת תוכניות' },
  { icon: Clock, label: 'מעקב סטטוס' },
  { icon: CheckCircle2, label: 'אישור העירייה' },
];

export default function BusinessOwnerView() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [editApp, setEditApp] = useState(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const load = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      setApps(await base44.entities.ClosureApplication.filter({ created_by: currentUser.email }, '-updated_date'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    const q = searchEmail.trim().toLowerCase();
    const all = await base44.entities.ClosureApplication.list('-created_date');
    setSearchResults(all.filter(a =>
      a.email?.toLowerCase() === q ||
      a.business?.toLowerCase().includes(q) ||
      a.application_id?.toLowerCase().includes(q)
    ));
    setSearching(false);
  };

  useEffect(() => { load(); }, [currentUser]);

  const openNew = () => { setEditApp(null); setMode('new'); };
  const openEdit = (app) => { setEditApp(app); setMode('edit'); };
  const handleCancel = () => { setMode(null); setEditApp(null); };
  const handleSaved = () => { setMode(null); setEditApp(null); load(); };

  if (mode) {
    return (
      <ApplicationWizard
        application={editApp}
        onCancel={handleCancel}
        onSaved={handleSaved} />
    );
  }

  return (
    <div>
      {/* Process Steps Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
        <h2 className="text-xl font-bold text-blue-900 mb-4">מסלול בעל עסק — שלבי התהליך</h2>
        <div className="flex flex-wrap gap-2 items-center">
          {PROCESS_STEPS.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === PROCESS_STEPS.length - 1;
            return (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
                  isLast
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-white text-blue-700 border border-blue-200'
                }`}>
                  <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold text-white ${
                    isLast ? 'bg-green-500' : 'bg-blue-500'
                  }`}>{i + 1}</span>
                  <Icon className="w-4 h-4" />
                  {step.label}
                </div>
                {!isLast && <span className="text-blue-300 text-lg">←</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Search section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">חיפוש בקשה קיימת לפי מייל / שם עסק / מספר בקשה</h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchEmail}
              onChange={e => { setSearchEmail(e.target.value); setSearchResults(null); }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="הזן מייל או שם עסק..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition text-sm font-medium disabled:opacity-50">
            {searching ? 'מחפש...' : 'חפש'}
          </button>
        </div>
        {searchResults && (
          <div className="mt-3 space-y-2">
            {searchResults.length === 0 ? (
              <p className="text-sm text-gray-400">לא נמצאו בקשות</p>
            ) : searchResults.map(app => (
              <div key={app.id} className="bg-gray-50 rounded-lg border border-gray-200 p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 text-sm">{app.business}</div>
                  <div className="text-xs text-gray-500">{app.email} · {app.application_id}</div>
                </div>
                <button
                  onClick={() => openEdit(app)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
                  <RefreshCw className="w-3 h-3" /> ערוך
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">הבקשות שלי</h2>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition text-sm font-medium">
          <Plus className="w-4 h-4" />
          בקשה חדשה
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">טוען...</div>
      ) : apps.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">אין בקשות עדיין</p>
          <p className="text-sm mt-1">לחץ על &quot;בקשה חדשה&quot; להגשת בקשה</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {apps.map((app) => (
            <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-gray-800 text-lg">{app.business}</h3>
                  <StatusBadge status={app.status} />
                </div>
                <p className="text-gray-500 text-sm">{app.address}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {[app.application_id, typeLabel(app.type), app.area ? `${app.area} מ״ר` : null].filter(Boolean).join(' · ')}
                </p>
                {app.notes && (
                  <p className="text-amber-700 text-sm mt-2 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                    <strong>הערת בודק:</strong> {app.notes}
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate(`/architect/${app.id}`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition">
                  <FileText className="w-3.5 h-3.5" />
                  צפה בבקשה
                </button>
                {(app.status === 'pending_owner' || app.status === 'rejected') && (
                  <button
                    onClick={() => openEdit(app)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${
                      app.status === 'rejected'
                        ? 'border-red-300 text-red-700 hover:bg-red-50'
                        : 'border-blue-300 text-blue-700 hover:bg-blue-50'
                    }`}>
                    <RefreshCw className="w-3.5 h-3.5" />
                    {app.status === 'rejected' ? 'ערוך והגש מחדש' : 'המשך מילוי'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}