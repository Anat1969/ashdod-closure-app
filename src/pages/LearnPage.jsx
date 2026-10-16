import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, animate } from 'framer-motion';
import confetti from 'canvas-confetti';
import { DEFAULT_DESIGN, BUSINESS_TYPES, evaluate, QUIZ, levelOf } from '@/lib/simulator';
import { clauseById } from '@/lib/policy';

const S = 40; // px per meter in the drawing
const FACADE = 470;
const GROUND = 300;

function CountUp({ value }) {
  const ref = useRef(null);
  const prev = useRef(value);
  useEffect(() => {
    const ctrl = animate(prev.current, value, { duration: 0.6, onUpdate: v => { if (ref.current) ref.current.textContent = Math.round(v); } });
    prev.current = value;
    return () => ctrl.stop();
  }, [value]);
  return <span ref={ref}>{value}</span>;
}

function Drawing({ d, ev }) {
  const depthPx = d.depth * S;
  const curbX = FACADE - d.sidewalk * S;
  const left = FACADE - depthPx;
  const hFront = d.roofHeight * S;
  const drop = Math.max(2, d.slope * 3); // slope exaggerated for legibility
  const hBack = hFront + drop;
  const floorY = GROUND - d.floorHeight * S;
  const bad = Object.fromEntries(ev.results.map(r => [r.id, r.level === 'fail']));
  const glass = d.type === 'type2';
  const spring = { type: 'spring', stiffness: 140, damping: 20 };
  return (
    <svg viewBox="0 0 600 340" className="w-full h-auto" role="img" aria-label="חתך רחוב עם הסגירה">
      <defs>
        <pattern id="fabric" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="#e7e9ed" /><line x1="0" y1="0" x2="0" y2="8" stroke="#a9b0bb" strokeWidth="3" />
        </pattern>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#eef1f5" /><stop offset="1" stopColor="#ffffff" /></linearGradient>
        <linearGradient id="bldg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#5b6574" /><stop offset="1" stopColor="#262c35" /></linearGradient>
      </defs>
      <rect width="600" height="340" fill="url(#sky)" />
      {/* road and sidewalk */}
      <rect x="0" y={GROUND} width="600" height="40" fill="#cfd3da" />
      <motion.rect initial={false} animate={{ x: curbX, width: FACADE - curbX }} transition={spring} y={GROUND - 4} height="8" fill={bad.deck ? '#b45309' : '#e7e9ed'} />
      <motion.line initial={false} animate={{ x1: curbX, x2: curbX }} transition={spring} y1={GROUND - 6} y2={GROUND + 10} stroke="#181c22" strokeWidth="3" />
      <text x="40" y={GROUND + 26} fontSize="12" fill="#46505e">כביש</text>
      {/* building */}
      <rect x={FACADE} y="40" width="130" height={GROUND - 40} fill="url(#bldg)" />
      {[0, 1, 2].map(i => <rect key={i} x={FACADE + 22} y={70 + i * 55} width="86" height="28" fill="#a9b0bb" opacity=".5" />)}
      <motion.line initial={false} animate={{ y1: floorY, y2: floorY }} transition={spring} x1={FACADE} x2="600" stroke="#fbbf24" strokeWidth="2" strokeDasharray="6 4" />
      <motion.text initial={false} animate={{ y: floorY - 6 }} transition={spring} x={FACADE + 8} fontSize="11" fill="#fde68a">קומת קרקע {d.floorHeight} מ'</motion.text>
      {/* deck */}
      {d.deck && <motion.rect initial={{ opacity: 0, x: left, width: depthPx }} animate={{ opacity: 1, x: left, width: depthPx }} y={GROUND - 14} height="10" fill="#92400e" />}
      {/* closure */}
      <motion.path
        initial={false}
        animate={{ d: `M ${left} ${GROUND} L ${left} ${GROUND - hFront} L ${FACADE} ${GROUND - hBack} L ${FACADE} ${GROUND} Z` }}
        transition={spring}
        fill={glass ? '#7dd3fc' : 'url(#fabric)'}
        fillOpacity={glass ? Math.max(0.12, 1 - d.transparency / 100 + 0.1) : 0.9}
        stroke={bad.height ? '#dc2626' : '#181c22'}
        strokeWidth="3"
      />
      {/* fascia hiding the slope */}
      <motion.rect initial={false} animate={{ x: left - 3, y: GROUND - hBack - 4, width: depthPx + 3, height: drop + 6 }} transition={spring} fill={bad.slope ? '#fecaca' : '#262c35'} />
      {/* opening */}
      {d.opening === 'front'
        ? <motion.rect initial={false} animate={{ x: left - 2, y: GROUND - Math.min(hFront, 2.2 * S) }} transition={spring} width="5" height={Math.min(hFront, 2.2 * S)} fill="#fff" />
        : <motion.text initial={false} animate={{ x: left + depthPx / 2 }} y={GROUND - hFront / 2} textAnchor="middle" fontSize="12" fill="#dc2626" fontWeight="600">פתח בצד</motion.text>}
      {/* gutter or rain dripping onto the sidewalk */}
      {d.gutter
        ? <motion.rect initial={false} animate={{ x: left + 2, y: GROUND - hFront }} transition={spring} width="4" height={hFront} fill="#46505e" />
        : [0, 1, 2].map(i => (
          <motion.circle key={i} r="3" fill="#0284c7" initial={{ cy: GROUND - hFront, cx: left - 6 - i * 6, opacity: 1 }}
            animate={{ cy: GROUND - 6, opacity: 0 }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.3 }} />
        ))}
      {d.exposedCables && <motion.path initial={false} animate={{ d: `M ${left} ${GROUND - hFront - 10} q 20 14 40 0 t 40 0 t 40 0` }} stroke="#dc2626" strokeWidth="2.5" fill="none" strokeDasharray="5 3" />}
      {/* clearance dimension */}
      <motion.line initial={false} animate={{ x1: curbX, x2: left }} transition={spring} y1={GROUND + 18} y2={GROUND + 18} stroke={bad.clearance ? '#dc2626' : '#15803d'} strokeWidth="2" />
      <motion.text initial={false} animate={{ x: (curbX + left) / 2 }} transition={spring} y={GROUND + 34} textAnchor="middle" fontSize="12" fontFamily="IBM Plex Mono" fill={bad.clearance ? '#dc2626' : '#15803d'}>
        מעבר {ev.clearance} מ'
      </motion.text>
      {/* person for scale */}
      <motion.g initial={false} animate={{ x: Math.max(curbX + 10, Math.min(left - 26, curbX + (left - curbX) / 2 - 8)) }} transition={spring}>
        <circle cx="8" cy={GROUND - 64} r="7" fill="#353d49" />
        <rect x="3" y={GROUND - 56} width="10" height="52" rx="4" fill="#353d49" />
      </motion.g>
    </svg>
  );
}

function Seg({ value, onChange, options, name }) {
  return (
    <div className="flex flex-wrap gap-1 bg-blue-100/70 rounded-lg p-1" role="group" aria-label={name}>
      {options.map(o => (
        <button key={o.val} type="button" onClick={() => onChange(o.val)}
          className={`relative flex-1 min-w-[4.5rem] px-2 py-1.5 rounded-md text-sm transition ${value === o.val ? 'text-blue-950' : 'text-blue-600 hover:text-blue-900'}`}>
          {value === o.val && <motion.span layoutId={`seg-${name}`} className="absolute inset-0 rounded-md bg-white shadow" />}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function Range({ label, value, min, max, step, unit, onChange }) {
  return (
    <label className="block">
      <span className="flex justify-between text-sm text-blue-800"><span>{label}</span><span className="font-mono">{value}{unit}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full accent-blue-900" />
    </label>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!value)} aria-pressed={value}
      className={`text-right px-3 py-2 rounded-lg border text-sm transition ${value ? 'bg-blue-900 text-white border-blue-900' : 'bg-white border-blue-200 text-blue-800 hover:bg-blue-50'}`}>
      {label}: <strong>{value ? 'כן' : 'לא'}</strong>
    </button>
  );
}

function randomChallenge() {
  const breaks = [
    d => ({ ...d, depth: d.sidewalk - 1.5 }),
    d => ({ ...d, opening: 'side' }),
    d => ({ ...d, roofHeight: d.floorHeight + 0.6 }),
    d => ({ ...d, slope: 0.5 }),
    d => ({ ...d, gutter: false }),
    d => ({ ...d, deck: true }),
    d => ({ ...d, exposedCables: true }),
    d => ({ ...d, type: 'type2', transparency: 70 }),
  ];
  const picked = [...breaks].sort(() => Math.random() - 0.5).slice(0, 3);
  return picked.reduce((d, f) => f(d), { ...DEFAULT_DESIGN });
}

function Simulator() {
  const [d, setD] = useState(DEFAULT_DESIGN);
  const [challenge, setChallenge] = useState(null); // { moves }
  const ev = useMemo(() => evaluate(d), [d]);
  const wasClean = useRef(ev.fails === 0);
  const set = (k) => (v) => { setD(p => ({ ...p, [k]: v })); if (challenge) setChallenge(c => ({ ...c, moves: c.moves + 1 })); };

  useEffect(() => {
    const clean = ev.fails === 0;
    if (clean && !wasClean.current) {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.4 }, colors: ['#181c22', '#7d8796', '#fbbf24', '#15803d'] });
    }
    wasClean.current = clean;
  }, [ev.fails]);

  const solved = challenge && ev.fails === 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="space-y-4 min-w-0">
        <div className="paper rounded-2xl p-3 overflow-hidden">
          <Drawing d={d} ev={ev} />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button type="button" onClick={() => { setD(randomChallenge()); setChallenge({ moves: 0 }); }} className="px-4 py-2 rounded-lg bg-blue-900 text-white text-sm shadow hover:bg-blue-800">אתגר: תקנו סגירה שגויה</button>
          <button type="button" onClick={() => { setD(DEFAULT_DESIGN); setChallenge(null); }} className="px-4 py-2 rounded-lg border border-blue-300 text-sm hover:bg-blue-50">התחלה מחדש</button>
          <AnimatePresence>
            {challenge && (
              <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className={`text-sm font-medium ${solved ? 'text-green-800' : 'text-amber-800'}`} data-testid="challenge-status">
                {solved ? `פתרתם ב-${challenge.moves} מהלכים` : `נותרו ${ev.fails} הפרות לתיקון`}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="paper rounded-2xl p-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <div><div className="label mb-1">סוג הסגירה</div><Seg name="type" value={d.type} onChange={set('type')} options={[{ val: 'type1', label: 'פרגוד חורף' }, { val: 'type2', label: 'עונתית' }]} /></div>
            <div><div className="label mb-1">סוג העסק</div><Seg name="biz" value={d.businessType} onChange={set('businessType')} options={BUSINESS_TYPES.map(b => ({ val: b.val, label: b.label }))} /></div>
            <div><div className="label mb-1">כיוון הפתח</div><Seg name="opening" value={d.opening} onChange={set('opening')} options={[{ val: 'front', label: 'לחזית' }, { val: 'side', label: 'לצד' }]} /></div>
            <div className="grid grid-cols-2 gap-2">
              <Toggle label="רישיון עסק" value={d.license} onChange={set('license')} />
              <Toggle label="מרזב מוצנע" value={d.gutter} onChange={set('gutter')} />
              <Toggle label="דק על המדרכה" value={d.deck} onChange={set('deck')} />
              <Toggle label="כבלים גלויים" value={d.exposedCables} onChange={set('exposedCables')} />
            </div>
          </div>
          <div className="space-y-2">
            <Range label="רוחב המדרכה" value={d.sidewalk} min={3} max={8} step={0.5} unit=" מ'" onChange={set('sidewalk')} />
            <Range label="עומק הסגירה" value={d.depth} min={1} max={6} step={0.5} unit=" מ'" onChange={set('depth')} />
            <Range label="רוחב חזית העסק" value={d.frontage} min={3} max={14} step={0.5} unit=" מ'" onChange={set('frontage')} />
            <Range label="גובה קומת הקרקע" value={d.floorHeight} min={3} max={5.5} step={0.1} unit=" מ'" onChange={set('floorHeight')} />
            <Range label="גובה גג הסגירה" value={d.roofHeight} min={2.4} max={5.5} step={0.1} unit=" מ'" onChange={set('roofHeight')} />
            <Range label="שיפוע הגג" value={d.slope} min={0} max={5} step={0.5} unit="%" onChange={set('slope')} />
            {d.type === 'type2' && <Range label="שקיפות הזכוכית" value={d.transparency} min={50} max={100} step={5} unit="%" onChange={set('transparency')} />}
          </div>
        </div>
      </div>

      <div className="space-y-3 min-w-0">
        <div className="ink rounded-2xl p-5 shadow-xl">
          <div className="label !text-blue-300">ציון התאמה למדיניות</div>
          <div className="flex items-end gap-3">
            <span className="text-6xl font-extralight font-mono" data-testid="sim-score"><CountUp value={ev.score} /></span>
            <span className="text-blue-300 mb-2">מתוך 100</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-blue-800 overflow-hidden">
            <motion.div className={`h-full ${ev.fails ? 'bg-amber-400' : 'bg-green-400'}`} animate={{ width: `${ev.score}%` }} />
          </div>
          <p className="mt-2 text-sm text-blue-200">
            {ev.fails === 0 ? (ev.warns ? 'עומדת בתנאים, בכפוף לתיאום' : 'הסגירה עומדת בכל התנאים') : `${ev.fails} סעיפים לא מתקיימים`}
            {' · '}שטח {ev.area} מ"ר
          </p>
        </div>
        <ul className="space-y-1.5" data-testid="sim-results">
          {ev.results.map(r => {
            const clause = clauseById(r.clause);
            const tone = r.level === 'fail' ? 'border-red-200 bg-red-50' : r.level === 'warn' ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-white';
            const tag = r.level === 'fail' ? 'לא תקין' : r.level === 'warn' ? 'לתיאום' : 'תקין';
            const tagTone = r.level === 'fail' ? 'bg-red-700' : r.level === 'warn' ? 'bg-amber-600' : 'bg-green-700';
            return (
              <motion.li key={r.id} layout className={`rounded-lg border px-3 py-2 text-sm flex items-start gap-2 ${tone}`}>
                <span className={`flex-none text-[11px] text-white px-1.5 py-0.5 rounded font-medium ${tagTone}`}>{tag}</span>
                <span className="flex-1 text-blue-900">{r.text}</span>
                <Link to={`/policy?c=${encodeURIComponent(r.clause)}`} title={clause?.label} className="flex-none font-mono text-xs text-blue-600 underline">סעיף {r.clause}</Link>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

const BEST_KEY = 'ashdod-closure:quiz-best';

function Quiz({ clauseFilter }) {
  const deck = useMemo(() => {
    const base = clauseFilter ? QUIZ.filter(q => q.clause === clauseFilter) : QUIZ;
    return [...(base.length ? base : QUIZ)].sort(() => Math.random() - 0.5);
  }, [clauseFilter]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [best, setBest] = useState(() => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } });
  const done = i >= deck.length;
  const card = deck[i];

  useEffect(() => {
    if (done && score > best) {
      setBest(score);
      try { localStorage.setItem(BEST_KEY, String(score)); } catch { /* ignore */ }
      if (score === deck.length) confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 } });
    }
  }, [done]);

  const choose = (val) => {
    if (answer !== null) return;
    const correct = val === card.a;
    setAnswer(correct);
    if (correct) { setScore(s => s + 1); setStreak(s => s + 1); } else setStreak(0);
  };
  const next = () => { setAnswer(null); setI(x => x + 1); };
  const restart = () => { setI(0); setScore(0); setStreak(0); setAnswer(null); };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3 text-sm">
        <div className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
          <motion.div className="h-full bg-blue-900" animate={{ width: `${(Math.min(i, deck.length) / deck.length) * 100}%` }} />
        </div>
        <span className="font-mono" data-testid="quiz-score">{score}/{deck.length}</span>
        <span className="font-mono text-amber-700">רצף {streak}</span>
      </div>
      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key={i} initial={{ opacity: 0, rotateX: -12, y: 16 }} animate={{ opacity: 1, rotateX: 0, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="paper rounded-2xl p-6 sm:p-8 [perspective:800px]" data-testid="quiz-card">
            <div className="label mb-3">שאלה {i + 1} מתוך {deck.length} · נכון או לא נכון?</div>
            <p className="text-xl sm:text-2xl font-light leading-relaxed text-blue-950">{card.q}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[{ v: true, l: 'נכון' }, { v: false, l: 'לא נכון' }].map(o => {
                const picked = answer !== null && o.v === card.a;
                return (
                  <motion.button key={o.l} type="button" whileTap={{ scale: 0.96 }} onClick={() => choose(o.v)} disabled={answer !== null}
                    className={`py-3 rounded-xl text-lg border-2 transition ${picked ? 'border-green-600 bg-green-50 text-green-900' : 'border-blue-200 hover:border-blue-900 hover:bg-blue-50'} disabled:cursor-default`}>
                    {o.l}
                  </motion.button>
                );
              })}
            </div>
            <AnimatePresence>
              {answer !== null && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                  <div className={`mt-5 rounded-xl p-4 ${answer ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`} data-testid="quiz-feedback">
                    <strong>{answer ? 'צדקתם.' : 'לא בדיוק.'}</strong> {card.why}
                    <div className="mt-2 text-sm">
                      <Link to={`/policy?c=${encodeURIComponent(card.clause)}`} className="underline font-mono">סעיף {card.clause}: {clauseById(card.clause)?.label}</Link>
                    </div>
                  </div>
                  <button type="button" onClick={next} className="mt-4 w-full py-2.5 rounded-xl bg-blue-900 text-white">{i + 1 < deck.length ? 'לשאלה הבאה' : 'לסיכום'}</button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="ink rounded-2xl p-8 text-center shadow-xl">
            <div className="label !text-blue-300">התוצאה שלכם</div>
            <div className="text-6xl font-extralight font-mono my-3">{score}/{deck.length}</div>
            <div className="text-2xl font-light">{levelOf(score, deck.length)}</div>
            <p className="text-blue-300 text-sm mt-2">שיא אישי: {Math.max(best, score)}</p>
            <div className="mt-5 flex gap-2 justify-center flex-wrap">
              <button type="button" onClick={restart} className="px-4 py-2 rounded-lg bg-white text-blue-900">משחק חוזר</button>
              <Link to="/policy" className="px-4 py-2 rounded-lg border border-blue-600 text-blue-100">למסמך המדיניות</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LearnPage() {
  const [params, setParams] = useSearchParams();
  const mode = params.get('mode') === 'quiz' ? 'quiz' : 'build';
  const clause = params.get('clause');
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label">משחק המדיניות</div>
          <h1 className="text-3xl sm:text-4xl font-extralight text-blue-950">לומדים את הכללים דרך הידיים</h1>
          <p className="text-blue-600 mt-1">כל תוצאה מצוטטת מסעיף במסמך המדיניות.</p>
        </div>
        <Seg name="mode" value={mode} onChange={v => setParams(v === 'quiz' ? { mode: 'quiz' } : {})} options={[{ val: 'build', label: 'בונים סגירה' }, { val: 'quiz', label: 'נכון או לא נכון' }]} />
      </header>
      {mode === 'build' ? <Simulator /> : <Quiz clauseFilter={clause} />}
    </div>
  );
}
