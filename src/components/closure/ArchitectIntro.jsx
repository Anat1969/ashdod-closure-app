import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { typeLabel } from './constants';

const REVIEW = [
  { t: 'שלמות הבקשה', d: 'שדות חובה, מיקום על המפה ומסמכים.' },
  { t: 'תנאי המדיניות', d: 'רשימת תנאים, כל אחד מקושר לסעיף.' },
  { t: 'מיקום ורחוב', d: 'מעבר 2.5 מ\', שכנים, ריהוט רחוב.' },
  { t: 'החלטה', d: 'אישור, החזרה לתיקון או דחייה מנומקת.' },
];

const daysSince = (d) => (d ? Math.max(0, Math.floor((Date.now() - new Date(d)) / 86400000)) : null);

export default function ArchitectIntro({ apps }) {
  const navigate = useNavigate();
  const queue = apps
    .filter(a => a.status === 'pending_review')
    .sort((a, b) => new Date(a.submitted_at || a.created_date) - new Date(b.submitted_at || b.created_date));
  const approvedArea = apps.filter(a => a.status === 'approved').reduce((s, a) => s + (Number(a.area) || 0), 0);
  const over30 = apps.filter(a => Number(a.area) > 30 && a.status !== 'rejected').length;

  return (
    <div className="space-y-5 mb-8">
      <header className="ink rounded-2xl overflow-hidden shadow-xl">
        <div className="blueprint p-6 sm:p-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] items-end">
          <div>
            <div className="label !text-blue-300">מסלול עירייה</div>
            <h1 className="text-3xl sm:text-4xl font-extralight mt-1">בדיקה לפי אותם סעיפים, לכל בקשה</h1>
            <p className="text-blue-200 mt-2 max-w-2xl">תור עבודה, רשימת תנאים מצוטטת, דוח בדיקה ומייל לבעל העסק. כל החלטה נשמרת בהיסטוריית הבקשה.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><div className="text-3xl font-extralight font-mono">{queue.length}</div><div className="text-xs text-blue-300">בתור לבדיקה</div></div>
            <div><div className="text-3xl font-extralight font-mono">{approvedArea}</div><div className="text-xs text-blue-300">מ"ר מאושרים</div></div>
            <div><div className="text-3xl font-extralight font-mono">{over30}</div><div className="text-xs text-blue-300">מעל 30 מ"ר</div></div>
          </div>
        </div>
      </header>

      <div className="grid gap-4 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="paper rounded-2xl p-5" data-testid="work-queue">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-light text-blue-950">תור העבודה</h2>
            <span className="label">הוותיקה ראשונה</span>
          </div>
          {queue.length === 0 ? (
            <p className="text-sm text-blue-600 mt-3">אין בקשות שממתינות לבדיקה.</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {queue.slice(0, 5).map((a, i) => {
                const d = daysSince(a.submitted_at || a.created_date);
                return (
                  <motion.li key={a.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                    <button type="button" onClick={() => navigate(`/architect/${a.id}`)} className="w-full text-right flex items-center gap-3 rounded-xl border border-blue-100 bg-white p-3 hover:border-blue-400 lift">
                      <span className="font-mono text-blue-400 text-sm">{i + 1}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold text-blue-950 truncate">{a.business}</span>
                        <span className="block text-xs text-blue-600 truncate">{a.address} · {typeLabel(a.type)}{a.area ? ` · ${a.area} מ"ר` : ''}</span>
                      </span>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${d > 14 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'}`}>{d} ימים</span>
                    </button>
                  </motion.li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="paper rounded-2xl p-5">
          <h2 className="text-xl font-light text-blue-950">סדר הבדיקה</h2>
          <ol className="mt-3 space-y-3">
            {REVIEW.map((r, i) => (
              <li key={r.t} className="flex gap-3">
                <span className="flex-none w-7 h-7 rounded-full bg-blue-900 text-white text-sm font-mono flex items-center justify-center">{i + 1}</span>
                <span><span className="font-semibold text-blue-950">{r.t}</span><span className="block text-sm text-blue-700">{r.d}</span></span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <Link to="/policy" className="underline text-blue-700">מסמך המדיניות</Link>
            <Link to="/map" className="underline text-blue-700">מפת הסגירות</Link>
          </div>
        </section>
      </div>
      <h2 className="text-xl font-light text-blue-950 pt-2">כל הבקשות</h2>
    </div>
  );
}
