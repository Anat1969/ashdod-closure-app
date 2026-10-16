import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { QUIZ, levelOf } from '@/lib/quiz';
import { clauseById } from '@/lib/policy';
import VerdictMark from './VerdictMark';

const BEST_KEY = 'ashdod-closure:quiz-best';

export default function Quiz({ clauseFilter }) {
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
                  <div className={`mt-5 rounded-xl p-4 flex gap-3 items-start ${answer ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`} data-testid="quiz-feedback">
                    <VerdictMark ok={answer} size={48} />
                    <div>
                    <strong>{answer ? 'צדקתם.' : 'לא בדיוק.'}</strong> {card.why}
                    <div className="mt-2 text-sm">
                      <Link to={`/policy?c=${encodeURIComponent(card.clause)}`} className="underline font-mono">סעיף {card.clause}: {clauseById(card.clause)?.label}</Link>
                    </div>
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

