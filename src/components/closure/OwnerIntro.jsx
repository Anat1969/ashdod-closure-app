import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DOCS_LABELS, DOCUMENTS_TYPE2 } from './constants';

const BIZ = [['food', 'בית אוכל'], ['cafe', 'בית קפה'], ['snack', 'מזנון'], ['other', 'עסק אחר']];
const STEPS = ['בודקים התאמה', 'מכינים מסמכים', 'ממלאים בקשה בשלבים', 'העירייה בודקת', 'תיקונים אם צריך', 'היתר ומפה'];

function Seg({ value, onChange, options, label }) {
  return (
    <div>
      <div className="label mb-1">{label}</div>
      <div className="flex flex-wrap gap-1 bg-blue-100/70 rounded-lg p-1" role="group" aria-label={label}>
        {options.map(([v, l]) => (
          <button key={v} type="button" onClick={() => onChange(v)} className={`flex-1 min-w-[4.5rem] px-2 py-1.5 rounded-md text-sm transition ${value === v ? 'bg-white shadow text-blue-950' : 'text-blue-600'}`}>{l}</button>
        ))}
      </div>
    </div>
  );
}

export default function OwnerIntro() {
  const [biz, setBiz] = useState('cafe');
  const [license, setLicense] = useState('yes');
  const [sidewalk, setSidewalk] = useState(5);
  const maxDepth = Math.max(0, +(sidewalk - 2.5).toFixed(1));
  const issues = [
    biz === 'other' && { t: 'רק בתי אוכל, בתי קפה ומזנונים רשאים להציב סגירה.', c: 'ג.3' },
    license === 'no' && { t: 'צריך רישיון עסק בתוקף לפני ההגשה.', c: 'ג.1' },
    maxDepth < 1 && { t: `המדרכה צרה: אחרי מעבר של 2.5 מ' נשארים ${maxDepth} מ' בלבד.`, c: 'ג.5' },
  ].filter(Boolean);

  return (
    <div className="space-y-6 mb-8">
      <header className="ink rounded-2xl overflow-hidden shadow-xl">
        <div className="blueprint p-6 sm:p-8">
          <div className="label !text-blue-300">מסלול בעל עסק</div>
          <h1 className="text-3xl sm:text-4xl font-extralight mt-1">סגירה לעסק שלך, בשלושה צעדים</h1>
          <p className="text-blue-200 mt-2 max-w-2xl">בודקים אם אפשר, מכינים את המסמכים, ומגישים בקשה בשלבים. אפשר לשמור טיוטה ולחזור אליה.</p>
          <ol className="mt-5 flex flex-wrap gap-2">
            {STEPS.map((s, i) => (
              <motion.li key={s} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm">
                <span className="font-mono text-amber-300">{i + 1}</span>{s}
              </motion.li>
            ))}
          </ol>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
        <section className="paper rounded-2xl p-5 space-y-4" data-testid="eligibility">
          <div>
            <div className="label">צעד 1</div>
            <h2 className="text-xl font-light text-blue-950">האם אפשר להציב סגירה?</h2>
          </div>
          <Seg label="סוג העסק" value={biz} onChange={setBiz} options={BIZ} />
          <Seg label="רישיון עסק בתוקף" value={license} onChange={setLicense} options={[['yes', 'יש'], ['no', 'אין']]} />
          <label className="block">
            <span className="flex justify-between text-sm text-blue-800"><span>רוחב המדרכה מול העסק</span><span className="font-mono">{sidewalk} מ'</span></span>
            <input type="range" min={2} max={10} step={0.5} value={sidewalk} onChange={e => setSidewalk(Number(e.target.value))} className="w-full accent-blue-900" aria-label="רוחב המדרכה" />
          </label>
          <AnimatePresence mode="wait">
            <motion.div key={issues.length ? 'no' : 'yes'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`rounded-xl p-4 ${issues.length ? 'bg-red-50 text-red-900' : 'bg-green-50 text-green-900'}`} data-testid="eligibility-result">
              {issues.length ? (
                <>
                  <strong>עדיין לא.</strong>
                  <ul className="mt-1 space-y-1 text-sm">{issues.map(x => <li key={x.c}>{x.t} <Link className="underline font-mono" to={`/policy?c=${encodeURIComponent(x.c)}`}>סעיף {x.c}</Link></li>)}</ul>
                </>
              ) : (
                <>
                  <strong>אפשר להגיש.</strong> עומק סגירה מרבי: <span className="font-mono">{maxDepth} מ'</span>, כך שיישארו 2.5 מ' להולכי הרגל.
                  <div className="text-sm mt-1"><Link to="/guidelines" className="underline">איך הסגירה צריכה להיראות</Link></div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        <section className="paper rounded-2xl p-5 space-y-3">
          <div>
            <div className="label">צעד 2</div>
            <h2 className="text-xl font-light text-blue-950">מה להכין</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-xl bg-blue-50 p-3">
              <div className="font-semibold text-blue-950 mb-1">לכל סגירה</div>
              <ul className="space-y-1 text-blue-800">
                <li>רישיון עסק בתוקף</li>
                {DOCS_LABELS.map(d => <li key={d.key}>{d.label}</li>)}
                <li>אישור מהנדס או הנדסאי מבנים</li>
                <li>אישור יועץ בטיחות</li>
              </ul>
            </div>
            <div className="rounded-xl bg-blue-50 p-3">
              <div className="font-semibold text-blue-950 mb-1">סגירה עונתית, בנוסף</div>
              <ul className="space-y-1 text-blue-800">
                {DOCUMENTS_TYPE2.map(d => <li key={d.id}>{d.text}</li>)}
                <li>אישור יועץ נגישות מתו"ס</li>
              </ul>
              <div className="font-semibold text-blue-950 mt-3 mb-1">פרגוד חורף, בנוסף</div>
              <ul className="space-y-1 text-blue-800"><li>היתר שימור רחובות לשנה הנוכחית</li><li>התחייבות לפירוק עד 15.4</li></ul>
            </div>
          </div>
        </section>
      </div>
      <div className="label">צעד 3: הגשה ומעקב</div>
    </div>
  );
}
