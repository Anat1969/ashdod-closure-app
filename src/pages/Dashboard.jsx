import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { STATUS_LABELS, STATUS_STYLES } from '@/components/closure/constants';
import { loadOsmVenues } from '@/lib/map';

const PRINCIPLES = [
  { n: '2.5', unit: "מ'", title: 'הרחוב נשאר פתוח', text: 'מרווח מינימלי בין דופן הסגירה לשפת המדרכה.', clause: 'ג.5' },
  { n: '1.5', unit: '%', title: 'חזית שקטה', text: 'שיפוע מינימלי, מוסתר בכרכוב, וגג שלא עולה על קומת הקרקע.', clause: 'ג.11' },
  { n: '90', unit: '%', title: 'קל ושקוף', text: 'זכוכית שקופה בסגירה עונתית, ברזנט בפרגוד חורף.', clause: 'ב.2.3' },
  { n: '30', unit: 'מ"ר', title: 'גדול? מתאמים', text: 'מעל 30 מ"ר נדרש תיאום עם אדריכלית העיר.', clause: 'ג.7' },
];

const DOORS = [
  { to: '/policy', kicker: 'קוראים', title: 'מסמך המדיניות', text: 'כל הסעיפים, חיפוש מילות מפתח וציטוט מדויק לכל סעיף.' },
  { to: '/learn', kicker: 'משחקים', title: 'בונים סגירה', text: 'מזיזים, משנים ורואים מיד אם הסגירה עומדת בכללים.' },
  { to: '/map', kicker: 'מתמצאים', title: 'מפת הסגירות', text: 'איפה יש סגירות ובקשות בעיר, על מפה חינמית של אשדוד.' },
  { to: '/owner', kicker: 'מגישים', title: 'בקשה חדשה', text: 'טופס בשלבים לבעל העסק, עם שמירת טיוטה.' },
];

function HeroDrawing() {
  const draw = (delay) => ({ initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { duration: 1.4, delay, ease: 'easeInOut' } });
  return (
    <svg viewBox="0 0 320 200" className="w-full h-auto" aria-hidden="true">
      <g fill="none" stroke="#e7e9ed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <motion.path d="M10 170 H310" {...draw(0)} />
        <motion.path d="M230 170 V30 H300 V170" {...draw(0.2)} />
        <motion.path d="M230 92 H300" strokeDasharray="5 4" stroke="#fbbf24" {...draw(0.6)} />
        <motion.path d="M150 170 V100 L230 96 V170" {...draw(0.9)} />
        <motion.path d="M146 98 H232" strokeWidth="5" {...draw(1.3)} />
        <motion.path d="M170 170 V100 M190 170 V99 M210 170 V98" opacity=".5" {...draw(1.5)} />
        <motion.path d="M60 182 H150" stroke="#86efac" {...draw(1.8)} />
      </g>
      <motion.text x="105" y="196" textAnchor="middle" fontSize="11" fill="#86efac" fontFamily="IBM Plex Mono" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4 }}>
        2.5 מ' לפחות
      </motion.text>
    </svg>
  );
}

export default function Dashboard() {
  const [counts, setCounts] = useState(null);
  const [osmCount, setOsmCount] = useState(null);

  useEffect(() => {
    base44.entities.ClosureApplication.list().then(apps => {
      const c = { total: apps.length, area: apps.filter(a => a.status === 'approved').reduce((s, a) => s + (Number(a.area) || 0), 0) };
      Object.keys(STATUS_LABELS).forEach(s => { c[s] = apps.filter(a => a.status === s).length; });
      setCounts(c);
    }).catch(() => setCounts(null));
    loadOsmVenues().then(d => setOsmCount(d.venues.length)).catch(() => {});
  }, []);

  return (
    <div className="space-y-10">
      <section className="ink rounded-3xl overflow-hidden shadow-2xl">
        <div className="blueprint grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center p-6 sm:p-10">
          <div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="label !text-blue-300">עיריית אשדוד · מדיניות 202411</motion.div>
            <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="mt-3 text-4xl sm:text-5xl font-extralight leading-tight tracking-tight">
              סגירה טובה<br />שומרת על הרחוב
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4 text-blue-200 leading-relaxed max-w-lg">
              סגירות חורף ועונתיות מאריכות את חיי הרחוב בחורף. ארבעה מספרים קובעים אם הן גם משאירות אותו פתוח, שקט וקריא.
            </motion.p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/learn" className="px-5 py-2.5 rounded-xl bg-white text-blue-950 font-medium shadow-lg hover:-translate-y-0.5 transition">משחק: בונים סגירה</Link>
              <Link to="/policy" className="px-5 py-2.5 rounded-xl border border-blue-600 text-blue-100 hover:bg-blue-800 transition">למסמך המדיניות</Link>
            </div>
          </div>
          <div className="max-w-md w-full mx-auto"><HeroDrawing /></div>
        </div>
      </section>

      <section>
        <div className="label mb-3">ארבעת המספרים של המדיניות</div>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map((p, i) => (
            <motion.div key={p.clause} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <Link to={`/policy?c=${encodeURIComponent(p.clause)}`} className="block paper lift rounded-2xl p-5 h-full">
                <div className="flex items-baseline gap-1.5 text-blue-950">
                  <span className="text-5xl font-extralight font-mono">{p.n}</span><span className="text-blue-500">{p.unit}</span>
                </div>
                <div className="mt-2 font-semibold text-blue-900">{p.title}</div>
                <p className="text-sm text-blue-600 mt-1 leading-relaxed">{p.text}</p>
                <div className="mt-3 font-mono text-xs text-blue-500">סעיף {p.clause}</div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {DOORS.map((d, i) => (
          <motion.div key={d.to} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
            <Link to={d.to} className="group block rounded-2xl p-5 h-full bg-gradient-to-br from-white to-blue-50 border border-blue-200 shadow-sm lift">
              <div className="label">{d.kicker}</div>
              <div className="text-xl font-light text-blue-950 mt-1">{d.title}</div>
              <p className="text-sm text-blue-600 mt-2">{d.text}</p>
              <div className="mt-4 h-px bg-blue-200 relative overflow-hidden">
                <span className="absolute inset-y-0 right-0 w-0 bg-blue-900 group-hover:w-full transition-all duration-500" />
              </div>
            </Link>
          </motion.div>
        ))}
      </section>

      <section className="paper rounded-2xl p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <div className="label">המצב בדפדפן הזה</div>
          <Link to="/map" className="text-sm underline text-blue-700">לצפייה על המפה</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <Link key={status} to="/architect" className={`rounded-xl border p-4 text-center hover:opacity-90 transition ${STATUS_STYLES[status]}`}>
              <div className="text-3xl font-light font-mono">{counts ? counts[status] : '-'}</div>
              <div className="text-xs mt-1">{label}</div>
            </Link>
          ))}
          <div className="rounded-xl border border-blue-200 p-4 text-center bg-white">
            <div className="text-3xl font-light font-mono">{counts ? counts.area : '-'}</div>
            <div className="text-xs mt-1 text-blue-700">מ"ר סגירות מאושרות</div>
          </div>
          <div className="rounded-xl border border-teal-200 p-4 text-center bg-teal-50 text-teal-900">
            <div className="text-3xl font-light font-mono">{osmCount ?? '-'}</div>
            <div className="text-xs mt-1">עסקי מזון במפת OSM</div>
          </div>
        </div>
        {counts && counts.total === 0 && (
          <p className="text-sm text-blue-600 mt-3">עדיין אין בקשות בדפדפן הזה. אפשר להגיש בקשה, לייבא גיבוי, או לטעון נתוני הדגמה מתפריט ההגדרות.</p>
        )}
      </section>
    </div>
  );
}
