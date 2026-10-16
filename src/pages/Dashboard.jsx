import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { STATUS_LABELS, STATUS_STYLES } from '@/components/closure/constants';
import { GUIDELINES, paramsFor } from '@/lib/guidelines';

const ClosureScene3D = lazy(() => import('@/components/ClosureScene3D'));

const TOUR = ['clearance', 'door', 'height', 'roof', 'rain', 'material'];
const TOUR_LABEL = {
  clearance: { anchor: 'clearance', text: "מעבר 2.5 מ' לפחות" },
  door: { anchor: 'door', text: 'פתח לחזית' },
  height: { anchor: 'height', text: 'מתחת לקומת הקרקע' },
  roof: { anchor: 'roof', text: 'כרכוב ישר' },
  rain: { anchor: 'gutter', text: 'מרזב מוצנע' },
  material: { anchor: 'panel', text: 'זכוכית שקופה' },
};

const FLOW = {
  input: { title: 'קלט', items: ['בקשת בעל העסק: פרטים, מיקום ושטח', 'תוכניות, הדמיה ותמונות', 'מסמך המדיניות: 27 סעיפים', 'מפת העיר ונתוני OpenStreetMap'] },
  op: { title: 'אופרציה', items: ['בדיקה מול רשימת תנאים מצוטטת', 'סימון על המפה ובדיקת מרווחים', 'החלטה: אישור, תיקון או דחייה', 'דוח בדיקה ומייל לבעל העסק'] },
  output: { title: 'פלט', items: ['היתר סגירה ברור ומנומק', 'מפת סגירות עירונית', 'מידע פתוח לתושבים', 'רחוב פתוח, שקט וקריא'] },
};

const AUDIENCES = [
  { to: '/owner', who: 'בעל עסק', get: 'בודק אם אפשר, מכין מסמכים ומגיש בקשה בשלבים.' },
  { to: '/architect', who: 'עירייה', get: 'בודקת כל בקשה מול סעיפי המדיניות ומחליטה.' },
  { to: '/residents', who: 'תושב', get: 'רואה אילו סגירות מאושרות ומה מגיע לו במדרכה.' },
];

function Hero3D() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(x => (x + 1) % TOUR.length), 4200);
    return () => clearInterval(t);
  }, []);
  const g = GUIDELINES.find(x => x.id === TOUR[i]);
  const params = useMemo(() => paramsFor(g, 'good'), [g]);
  const l = TOUR_LABEL[g.id];
  return (
    <div className="relative">
      <Suspense fallback={<div className="h-[320px] sm:h-[420px] rounded-2xl bg-blue-800/40 animate-pulse" />}>
        <ClosureScene3D params={params} camera={g.camera} labels={[{ key: 'tour', anchor: l.anchor, text: l.text, tone: 'good' }]} className="h-[320px] sm:h-[420px] shadow-2xl" />
      </Suspense>
      <AnimatePresence mode="wait">
        <motion.div key={g.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          className="absolute bottom-3 inset-x-3 rounded-xl bg-white/95 backdrop-blur px-4 py-3 text-blue-950 shadow-lg">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-semibold">{g.title}</span>
            <span className="font-mono text-[11px] text-blue-500">סעיף {g.clause}</span>
          </div>
          <div className="mt-2 flex gap-1">
            {TOUR.map((id, k) => <span key={id} className={`h-1 flex-1 rounded-full ${k === i ? 'bg-blue-900' : 'bg-blue-200'}`} />)}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function FlowColumn({ col, delay, tone }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay }}
      className={`rounded-2xl p-5 h-full ${tone}`}>
      <div className="label !text-current opacity-70">{col.title}</div>
      <ul className="mt-3 space-y-2">
        {col.items.map((it, k) => (
          <motion.li key={it} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: delay + 0.15 + k * 0.08 }}
            className="text-sm leading-relaxed border-r-2 border-current/30 pr-3">{it}</motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function Dashboard() {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    base44.entities.ClosureApplication.list().then(apps => {
      const c = { total: apps.length };
      Object.keys(STATUS_LABELS).forEach(s => { c[s] = apps.filter(a => a.status === s).length; });
      setCounts(c);
    }).catch(() => setCounts(null));
  }, []);

  return (
    <div className="space-y-14">
      <section className="ink rounded-3xl overflow-hidden shadow-2xl">
        <div className="blueprint grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] items-center p-6 sm:p-10">
          <div>
            <div className="label !text-blue-300">עיריית אשדוד · מדיניות סגירות 202411</div>
            <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-4xl sm:text-5xl font-extralight leading-tight tracking-tight">
              סגירה טובה<br />שומרת על הרחוב
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-4 text-blue-200 leading-relaxed max-w-lg">
              מנהל הסגירות מחבר במקום אחד את מדיניות העירייה, את בקשות בעלי העסקים ואת מפת העיר. בעל העסק מבין מה מותר, העירייה בודקת לפי אותם סעיפים, והתושבים רואים מה אושר.
            </motion.p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/guidelines" className="px-5 py-2.5 rounded-xl bg-white text-blue-950 font-medium shadow-lg hover:-translate-y-0.5 transition">להנחיות הוויזואליות</Link>
              <Link to="/owner" className="px-5 py-2.5 rounded-xl border border-blue-600 text-blue-100 hover:bg-blue-800 transition">הגשת בקשה</Link>
            </div>
          </div>
          <Hero3D />
        </div>
      </section>

      <section className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="paper rounded-2xl p-6">
          <div className="label">חזון</div>
          <p className="mt-2 text-2xl font-extralight text-blue-950 leading-snug">רחובות מסחריים שחיים גם בחורף, בלי לוותר על המדרכה, על החזית ועל הולכי הרגל.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="paper rounded-2xl p-6">
          <div className="label">מטרה</div>
          <p className="mt-2 text-2xl font-extralight text-blue-950 leading-snug">כל סגירה בעיר נבנית, נבדקת ומאושרת לפי אותם כללים, גלויים וברורים לכולם.</p>
        </motion.div>
      </section>

      <section>
        <div className="label mb-1">איך זה עובד</div>
        <h2 className="text-2xl font-extralight text-blue-950 mb-4">מהבקשה ועד הרחוב</h2>
        <div className="relative grid gap-3 md:grid-cols-3">
          <FlowColumn col={FLOW.input} delay={0} tone="bg-white border border-blue-200 text-blue-900" />
          <FlowColumn col={FLOW.op} delay={0.25} tone="bg-blue-900 text-blue-50 shadow-xl" />
          <FlowColumn col={FLOW.output} delay={0.5} tone="bg-green-50 border border-green-200 text-green-900" />
          <svg className="hidden md:block absolute inset-x-0 -bottom-6 h-6 w-full pointer-events-none" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true">
            <motion.path d="M98 3 H2" stroke="#353d49" strokeWidth="0.4" fill="none" strokeDasharray="1.5 1" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.6 }} />
          </svg>
        </div>
      </section>

      <section>
        <div className="label mb-1">למי זה</div>
        <h2 className="text-2xl font-extralight text-blue-950 mb-4">שלושה מסלולים, מדיניות אחת</h2>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-3">
          {AUDIENCES.map((a, i) => (
            <motion.div key={a.to} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <Link to={a.to} className="group block paper lift rounded-2xl p-5 h-full">
                <div className="text-xl font-light text-blue-950">{a.who}</div>
                <p className="text-sm text-blue-700 mt-2">{a.get}</p>
                <div className="mt-4 h-px bg-blue-200 relative overflow-hidden"><span className="absolute inset-y-0 right-0 w-0 bg-blue-900 group-hover:w-full transition-all duration-500" /></div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="paper rounded-2xl p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <div className="label">תמונת מצב</div>
          <Link to="/map" className="text-sm underline text-blue-700">למפת הסגירות</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <Link key={status} to={status === 'mapped' ? '/map' : '/architect'} className={`rounded-xl border p-4 text-center hover:opacity-90 transition ${STATUS_STYLES[status]}`}>
              <div className="text-3xl font-light font-mono">{counts ? counts[status] : '-'}</div>
              <div className="text-xs mt-1">{label}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
