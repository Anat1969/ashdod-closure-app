import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import StatusBadge from './StatusBadge';
import ApplicationCard from './ApplicationCard';
import { CheckCircle, XCircle, Clock, FileText, Search, SlidersHorizontal } from 'lucide-react';

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

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.ClosureApplication.list('-created_date', 200);
    setApps(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);



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