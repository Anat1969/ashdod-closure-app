import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GUIDELINES, paramsFor } from '@/lib/guidelines';
import Quiz from '@/components/Quiz';
import VerdictMark from '@/components/VerdictMark';

const ClosureScene3D = lazy(() => import('@/components/ClosureScene3D'));

// Labels drawn on the 3D model for each guideline.
const LABELS = {
  clearance: (bad) => [{ key: 'c', anchor: 'clearance', text: bad ? "מעבר 1.2 מ'" : "מעבר 3 מ'", tone: bad ? 'bad' : 'good' }],
  position: (bad) => [{ key: 'w', anchor: 'width', text: bad ? "9.5 מ': גולש לשכן" : "6 מ': רוחב החזית", tone: bad ? 'bad' : 'good' }],
  door: (bad) => [{ key: 'd', anchor: 'door', text: bad ? 'פתח בצד' : 'פתח לחזית', tone: bad ? 'bad' : 'good' }],
  height: (bad) => [
    { key: 'f', anchor: 'floor', text: "קומת קרקע 4 מ'", tone: 'note' },
    { key: 'h', anchor: 'height', text: bad ? "גג 4.5 מ'" : "גג 3.4 מ'", tone: bad ? 'bad' : 'good' },
  ],
  roof: (bad) => [{ key: 'r', anchor: 'roof', text: bad ? 'שיפוע חשוף' : 'כרכוב ישר', tone: bad ? 'bad' : 'good' }],
  rain: (bad) => [{ key: 'g', anchor: 'gutter', text: bad ? 'אין מרזב' : 'מרזב מוצנע', tone: bad ? 'bad' : 'good' }],
  material: (bad) => [{ key: 'm', anchor: 'panel', text: bad ? 'מילוי אטום' : 'זכוכית 90% שקיפות', tone: bad ? 'bad' : 'good' }],
  sidewalk: (bad) => [{ key: 's', anchor: 'deck', text: bad ? 'דק על המדרכה' : 'ריצוף עירוני', tone: bad ? 'bad' : 'good' }],
  infra: (bad) => [{ key: 'i', anchor: 'cable', text: bad ? 'כבל גלוי' : 'ללא תשתיות גלויות', tone: bad ? 'bad' : 'good' }],
  sign: (bad) => [{ key: 'n', anchor: 'sign', text: bad ? 'שלט מעל הגג' : 'שלט על הכרכוב', tone: bad ? 'bad' : 'good' }],
  area: (bad) => [{ key: 'a', anchor: 'roof', text: bad ? '38 מ"ר: תיאום' : '18 מ"ר', tone: bad ? 'bad' : 'good' }],
  season: (bad) => [{ key: 'x', anchor: 'width', text: bad ? 'קיץ: מפורק' : 'חורף: 15.10 עד 15.4', tone: 'note' }],
};

export default function GuidelinesPage() {
  const [params, setParams] = useSearchParams();
  const activeId = params.get('g') || GUIDELINES[0].id;
  const variant = params.get('v') === 'bad' ? 'bad' : 'good';
  const [tour, setTour] = useState(false);
  const idx = Math.max(0, GUIDELINES.findIndex(g => g.id === activeId));
  const g = GUIDELINES[idx];

  const select = (id, v = 'good') => setParams(v === 'bad' ? { g: id, v } : { g: id }, { replace: true });
  const step = (d) => select(GUIDELINES[(idx + d + GUIDELINES.length) % GUIDELINES.length].id);

  // Guided tour: right way, then the violation, then the next guideline.
  useEffect(() => {
    if (!tour) return undefined;
    const t = setTimeout(() => {
      if (variant === 'good') select(g.id, 'bad');
      else step(1);
    }, 3500);
    return () => clearTimeout(t);
  }, [tour, activeId, variant]);

  const sceneParams = useMemo(() => paramsFor(g, variant), [g, variant]);
  const labels = LABELS[g.id]?.(variant === 'bad') || [];
  const isWrong = variant === 'bad' && !g.badIsSeason;
  const goodLabel = g.badIsSeason ? 'חורף' : 'כך נכון';
  const badLabel = g.badIsSeason ? 'קיץ' : 'כך לא';

  return (
    <div className="space-y-10">
      <header>
        <div className="label">הנחיות ויזואליות</div>
        <h1 className="text-3xl sm:text-4xl font-extralight text-blue-950">איך סגירה צריכה להיראות</h1>
        <p className="text-blue-600 mt-1 max-w-2xl">12 הנחיות מתוך מסמך המדיניות. בחרו הנחיה ברשימה, השוו "כך נכון" מול "כך לא" על הדגם, וסובבו אותו בגרירה.</p>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] items-start">
        <ol className="space-y-2 order-2 lg:order-1" data-testid="guideline-list">
          {GUIDELINES.map((item, i) => {
            const active = item.id === g.id;
            return (
              <li key={item.id}>
                <button type="button" onClick={() => { setTour(false); select(item.id); }} aria-current={active}
                  className={`w-full text-right rounded-xl p-4 transition border ${active ? 'bg-blue-950 text-white border-blue-950 shadow-xl' : 'bg-white border-blue-100 hover:border-blue-300 lift'}`}>
                  <div className="flex items-baseline gap-3">
                    <span className={`font-mono text-sm ${active ? 'text-amber-300' : 'text-blue-400'}`}>{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-semibold flex-1">{item.title}</span>
                    <span className={`font-mono text-[11px] ${active ? 'text-blue-300' : 'text-blue-500'}`}>סעיף {item.clause}</span>
                  </div>
                  <p className={`mt-1.5 text-sm leading-relaxed pr-8 ${active ? 'text-blue-100' : 'text-blue-700'}`}>{item.rule}</p>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="order-1 lg:order-2 lg:sticky lg:top-[120px] space-y-3 min-w-0">
          <div className="relative">
            <Suspense fallback={<div className="h-[340px] sm:h-[460px] rounded-2xl bg-blue-100 animate-pulse" />}>
              <ClosureScene3D params={sceneParams} camera={g.camera} labels={labels} className={`shadow-xl h-[340px] sm:h-[460px] ring-4 transition ${isWrong ? 'ring-red-500/70' : 'ring-green-500/60'}`} />
            </Suspense>
            <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2 rounded-2xl bg-white/90 backdrop-blur pl-4 pr-1.5 py-1.5 shadow-xl" data-testid="verdict">
              <VerdictMark key={g.id + variant} ok={!isWrong} size={72} />
              <span className={`text-2xl font-semibold ${isWrong ? 'text-red-700' : 'text-green-800'}`}>{isWrong ? 'כך לא' : 'כך נכון'}</span>
            </div>
          </div>
          <div className="paper rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex gap-1 bg-blue-100/70 rounded-lg p-1" role="group" aria-label="השוואה">
                {[['good', goodLabel], ['bad', badLabel]].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => { setTour(false); select(g.id, v); }}
                    className={`relative flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${variant === v ? (v === 'bad' && !g.badIsSeason ? 'text-red-800' : 'text-green-900') : 'text-blue-600'}`}>
                    {variant === v && <motion.span layoutId="variant-pill" className="absolute inset-0 rounded-md bg-white shadow" />}
                    <span className="relative"><VerdictMark ok={v === 'good' || g.badIsSeason} size={26} animate={false} /></span>
                    <span className="relative font-medium">{l}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => { setTour(false); step(-1); }} className="px-3 py-1.5 rounded-lg border border-blue-200 text-sm">הקודם</button>
                <button type="button" onClick={() => { setTour(false); step(1); }} className="px-3 py-1.5 rounded-lg border border-blue-200 text-sm">הבא</button>
                <button type="button" onClick={() => setTour(t => !t)} aria-pressed={tour} className={`px-3 py-1.5 rounded-lg text-sm ${tour ? 'bg-amber-400 text-blue-950' : 'bg-blue-900 text-white'}`}>{tour ? 'עצירת הסיור' : 'סיור אוטומטי'}</button>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={g.id + variant} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3" data-testid="guideline-caption">
                <div className="flex items-center gap-3">
                  <VerdictMark ok={!isWrong} size={40} />
                  <span>
                    <span className={`block text-sm font-semibold ${isWrong ? 'text-red-700' : 'text-green-800'}`}>{isWrong ? 'לא תקין' : 'תקין'}</span>
                    <span className="text-blue-950 font-medium">{variant === 'bad' ? g.bad : g.good}</span>
                  </span>
                </div>
                <p className="text-xs text-blue-500 mt-2">
                  {g.title} · <Link to={`/policy?c=${encodeURIComponent(g.clause)}`} className="underline font-mono">סעיף {g.clause} במסמך המדיניות</Link>
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <div className="label">בדיקה עצמית</div>
          <h2 className="text-2xl font-extralight text-blue-950">נכון או לא נכון</h2>
          <p className="text-blue-600 text-sm">12 משפטים קצרים על ההנחיות. כל תשובה מפנה לסעיף.</p>
        </div>
        <Quiz clauseFilter={params.get('clause')} />
      </section>
    </div>
  );
}
