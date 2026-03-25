import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { Building2, HardHat, Map, Clock, CheckCircle, XCircle, FileText, ArrowLeft } from 'lucide-react';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [stats, setStats] = useState(null);

  useEffect(() => {
    base44.entities.ClosureApplication.list('-created_date', 200).then(data => {
      setStats({
        total: data.length,
        pending_review: data.filter(a => a.status === 'pending_review').length,
        pending_owner: data.filter(a => a.status === 'pending_owner').length,
        approved: data.filter(a => a.status === 'approved').length,
        rejected: data.filter(a => a.status === 'rejected').length,
        recent: data.slice(0, 5),
      });
    });
  }, []);

  const quickLinks = [
    {
      path: '/owner',
      icon: Building2,
      title: 'מסלול בעל עסק',
      desc: 'הגשת בקשות סגירה עונתיות וחורף',
      color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
      iconColor: 'text-blue-600',
    },
    ...(isAdmin ? [{
      path: '/architect',
      icon: HardHat,
      title: 'מסלול עירייה',
      desc: 'בדיקה ואישור בקשות',
      color: 'bg-amber-50 border-amber-200 hover:border-amber-400',
      iconColor: 'text-amber-600',
    }] : []),
    {
      path: '/map',
      icon: Map,
      title: 'מפת סגירות',
      desc: 'צפייה בסגירות המאושרות על המפה',
      color: 'bg-green-50 border-green-200 hover:border-green-400',
      iconColor: 'text-green-600',
    },
  ];

  const STATUS_LABEL = {
    pending_owner: 'ממתין לבעל עסק',
    pending_review: 'ממתין לבדיקה',
    approved: 'מאושר',
    rejected: 'נדחה',
  };
  const STATUS_COLOR = {
    pending_owner: 'text-blue-600 bg-blue-50',
    pending_review: 'text-amber-600 bg-amber-50',
    approved: 'text-green-600 bg-green-50',
    rejected: 'text-red-600 bg-red-50',
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          שלום, {currentUser?.full_name || 'משתמש'} 👋
        </h2>
        <p className="text-gray-500 mt-1">ברוך הבא למערכת ניהול סגירות עיריית אשדוד</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map(link => {
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-4 border-2 rounded-2xl p-5 transition-all group ${link.color}`}
            >
              <div className={`p-3 rounded-xl bg-white shadow-sm ${link.iconColor}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-800 group-hover:text-blue-900">{link.title}</div>
                <div className="text-sm text-gray-500 mt-0.5">{link.desc}</div>
              </div>
              <ArrowLeft className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* Stats (admin only) */}
      {isAdmin && stats && (
        <div>
          <h3 className="text-lg font-bold text-gray-700 mb-3">סטטיסטיקות</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'סה״כ בקשות', val: stats.total, icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50' },
              { label: 'ממתינות לבדיקה', val: stats.pending_review, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'מאושרות', val: stats.approved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'נדחות', val: stats.rejected, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                  <div className={`text-3xl font-bold ${s.color}`}>{s.val}</div>
                  <div className="text-gray-500 text-xs mt-1">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent applications (admin only) */}
      {isAdmin && stats?.recent?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-700">בקשות אחרונות</h3>
            <Link to="/architect" className="text-sm text-blue-600 hover:underline">לכל הבקשות ←</Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {stats.recent.map(app => (
              <div key={app.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-800">{app.business}</span>
                  <span className="text-gray-400 text-sm mr-2">{app.address}</span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[app.status]}`}>
                  {STATUS_LABEL[app.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}