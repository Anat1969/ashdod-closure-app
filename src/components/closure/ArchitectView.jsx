import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import StatusBadge from './StatusBadge';
import { CheckCircle, XCircle, MessageSquare, ChevronDown, ChevronUp, MapPin } from 'lucide-react';

export default function ArchitectView() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [notes, setNotes] = useState({});
  const [saving, setSaving] = useState(null);
  const [filter, setFilter] = useState('pending_review');

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.ClosureApplication.list('-created_date', 100);
    setApps(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDecision = async (app, status) => {
    setSaving(app.id);
    await base44.entities.ClosureApplication.update(app.id, {
      status,
      notes: notes[app.id] !== undefined ? notes[app.id] : (app.notes || ''),
    });
    setSaving(null);
    setExpanded(null);
    load();
  };

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter);

  const stats = [
    { label: 'ממתינות לבדיקה', count: apps.filter(a => a.status === 'pending_review').length, color: 'text-amber-600', bg: 'bg-amber-50', val: 'pending_review' },
    { label: 'ממתינות לבעל עסק', count: apps.filter(a => a.status === 'pending_owner').length, color: 'text-blue-600', bg: 'bg-blue-50', val: 'pending_owner' },
    { label: 'מאושרות', count: apps.filter(a => a.status === 'approved').length, color: 'text-green-600', bg: 'bg-green-50', val: 'approved' },
    { label: 'נדחות', count: apps.filter(a => a.status === 'rejected').length, color: 'text-red-600', bg: 'bg-red-50', val: 'rejected' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">מסלול עירייה — בדיקת בקשות</h2>
        <div className="flex gap-2 flex-wrap">
          {[
            { val: 'pending_review', label: 'ממתינות לבדיקה' },
            { val: 'all', label: 'הכל' },
            { val: 'approved', label: 'מאושרות' },
            { val: 'rejected', label: 'נדחות' },
          ].map(f => (
            <button
              key={f.val}
              onClick={() => setFilter(f.val)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f.val ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <button
            key={s.val}
            onClick={() => setFilter(s.val)}
            className={`${s.bg} rounded-xl p-4 text-center transition-all hover:opacity-80 ${filter === s.val ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
          >
            <div className={`text-3xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-gray-600 text-sm mt-1">{s.label}</div>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">טוען...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">אין בקשות בקטגוריה זו</div>
      ) : (
        <div className="space-y-4">
          {filtered.map(app => (
            <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Row header */}
              <div
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setExpanded(expanded === app.id ? null : app.id)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <StatusBadge status={app.status} />
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800">{app.business}</h3>
                    <p className="text-sm text-gray-500 truncate">{app.address} · {app.application_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-400 hidden sm:block">
                    {app.type === 'type1' ? 'עונתי' : 'קבוע'} · {app.area} מ״ר
                  </span>
                  {expanded === app.id
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />
                  }
                </div>
              </div>

              {/* Expanded details */}
              {expanded === app.id && (
                <div className="border-t border-gray-100 p-5 space-y-5">
                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">בעל עסק:</span> <strong>{app.owner}</strong></div>
                    <div><span className="text-gray-500">טלפון:</span> <strong>{app.phone}</strong></div>
                    <div className="col-span-2"><span className="text-gray-500">דוא״ל:</span> <strong>{app.email}</strong></div>
                    <div><span className="text-gray-500">שטח:</span> <strong>{app.area} מ״ר</strong></div>
                    <div><span className="text-gray-500">סוג:</span> <strong>{app.type === 'type1' ? 'סגירה עונתית' : 'מבנה קבוע'}</strong></div>
                    {app.lat && app.lng && (
                      <div className="col-span-2 flex items-center gap-2 text-gray-500">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{Number(app.lat).toFixed(5)}, {Number(app.lng).toFixed(5)}</span>
                        <a
                          href={`https://www.google.com/maps?q=${app.lat},${app.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          פתח במפות ↗
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Checklist summary */}
                  {app.checklist && Object.keys(app.checklist).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">תנאים שהוצהרו:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(app.checklist).map(([k, v]) => (
                          <span key={k} className={`text-xs px-2 py-0.5 rounded-full ${v ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {v ? '✓' : '✗'} {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <MessageSquare className="w-4 h-4" /> הערות לבעל העסק
                    </label>
                    <textarea
                      value={notes[app.id] !== undefined ? notes[app.id] : (app.notes || '')}
                      onChange={e => setNotes(n => ({ ...n, [app.id]: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                      placeholder="הוסף הערות לבעל העסק..."
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-3 justify-end">
                    {app.status !== 'pending_review' && (
                      <button
                        onClick={() => handleDecision(app, 'pending_review')}
                        disabled={saving === app.id}
                        className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        החזר לבדיקה
                      </button>
                    )}
                    {app.status !== 'rejected' && (
                      <button
                        onClick={() => handleDecision(app, 'rejected')}
                        disabled={saving === app.id}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 text-sm font-medium"
                      >
                        <XCircle className="w-4 h-4" /> דחה בקשה
                      </button>
                    )}
                    {app.status !== 'approved' && (
                      <button
                        onClick={() => handleDecision(app, 'approved')}
                        disabled={saving === app.id}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {saving === app.id ? 'שומר...' : 'אשר בקשה'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}