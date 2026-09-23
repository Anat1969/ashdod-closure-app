import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, HardHat, Users, ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { STATUS_LABELS, STATUS_STYLES } from '@/components/closure/constants';

export default function Dashboard() {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    base44.entities.ClosureApplication.list().then(apps => {
      const c = { total: apps.length };
      Object.keys(STATUS_LABELS).forEach(s => { c[s] = apps.filter(a => a.status === s).length; });
      setCounts(c);
    }).catch(() => setCounts(null));
  }, []);

  const tracks = [
    {
      to: '/owner',
      icon: Building2,
      color: 'blue',
      title: 'מסלול בעל עסק',
      subtitle: 'הגשת בקשת סגירה עונתית / חורף',
      steps: ['מילוי פרטי העסק', 'בחירת סוג הסגירה ושטח', 'העלאת תוכניות ומסמכים', 'מעקב סטטוס הבקשה'],
      border: 'border-blue-200',
      bg: 'bg-blue-50 hover:bg-blue-100 hover:border-blue-400',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-800',
      stepColor: 'text-blue-700',
      dotColor: 'bg-blue-400',
    },
    {
      to: '/architect',
      icon: HardHat,
      color: 'amber',
      title: 'מסלול עירייה',
      subtitle: 'בדיקה, אישור ומעקב בקשות',
      steps: ['סקירת בקשות שהוגשו', 'בדיקת תנאים ומסמכים', 'מתן הערות לבעל העסק', 'אישור או דחיית הבקשה'],
      border: 'border-amber-200',
      bg: 'bg-amber-50 hover:bg-amber-100 hover:border-amber-400',
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-800',
      stepColor: 'text-amber-700',
      dotColor: 'bg-amber-400',
    },
    {
      to: '/residents',
      icon: Users,
      color: 'green',
      title: 'מסלול תושב',
      subtitle: 'מעקב פעילות עסקים מאושרים',
      steps: ['צפייה ברשימת עסקים מאושרים', 'עיון בתפריט העסק', 'מציאת עסקים לפי כתובת', 'קבלת מידע על שעות ופעילות'],
      border: 'border-green-200',
      bg: 'bg-green-50 hover:bg-green-100 hover:border-green-400',
      iconColor: 'text-green-600',
      titleColor: 'text-green-800',
      stepColor: 'text-green-700',
      dotColor: 'bg-green-400',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">שלום 👋</h2>
        <p className="text-gray-500 mt-1">ברוכים הבאים למערכת ניהול סגירות עיריית אשדוד</p>
      </div>

      {counts && counts.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <Link key={status} to="/architect" className={`rounded-xl border p-4 text-center hover:opacity-90 transition ${STATUS_STYLES[status]}`}>
              <div className="text-3xl font-bold">{counts[status]}</div>
              <div className="text-xs mt-1">{label}</div>
            </Link>
          ))}
        </div>
      )}

      {/* Mission statement */}
      <div className="bg-gradient-to-l from-blue-900 to-blue-700 text-white rounded-2xl p-6 shadow">
        <h3 className="text-lg font-bold mb-2">מטרת המערכת</h3>
        <p className="text-blue-100 text-sm leading-relaxed">
          מערכת זו נועדה להנגיש את תהליך הגשת בקשות הסגירה העונתית והחורף לבעלי עסקים בעיר אשדוד —
          ולאפשר לעירייה לבחון, לאשר ולנהל את הבקשות בהתאם למדיניותה.
          בנוסף, המערכת מאפשרת לתושבים לעקוב אחר הפעילות של עסקים מאושרים,
          לצפות בתפריטים ולקבל מידע עדכני על שעות ומיקום.
        </p>
      </div>

      {/* Tracks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tracks.map(track => {
          const Icon = track.icon;
          return (
            <Link
              key={track.to}
              to={track.to}
              className={`flex flex-col border-2 ${track.border} ${track.bg} rounded-2xl p-6 transition-all group`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-xl bg-white shadow-sm">
                  <Icon className={`w-7 h-7 ${track.iconColor}`} />
                </div>
                <div>
                  <div className={`text-lg font-bold ${track.titleColor}`}>{track.title}</div>
                  <div className="text-xs text-gray-500">{track.subtitle}</div>
                </div>
              </div>
              <ul className="space-y-1.5 mt-2 flex-1">
                {track.steps.map((step, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className={`w-5 h-5 rounded-full ${track.dotColor} text-white text-xs flex items-center justify-center flex-shrink-0 font-bold`}>{i + 1}</span>
                    <span className={track.stepColor}>{step}</span>
                  </li>
                ))}
              </ul>
              <div className={`flex items-center gap-1 mt-4 text-sm font-medium ${track.titleColor} group-hover:gap-2 transition-all`}>
                כניסה למסלול <ChevronLeft className="w-4 h-4" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}