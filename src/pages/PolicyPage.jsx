import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CHAPTERS, ALL_CLAUSES, POLICY_META, KEYWORDS, citationOf, searchClauses, normalize, escapeRegExp,
} from '@/lib/policy';
import { QUIZ } from '@/lib/simulator';

function Highlight({ text, query }) {
  const words = normalize(query).split(' ').filter(Boolean);
  if (!words.length) return text;
  const re = new RegExp(`(${words.map(escapeRegExp).join('|')})`, 'gi');
  return String(text).split(re).map((part, i) =>
    words.some(w => normalize(part) === w) ? <mark key={i} className="hit">{part}</mark> : part);
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { window.prompt('העתיקו:', text); return false; }
}

function ClauseCard({ clause, query, active, isHit, onCopied }) {
  const ref = useRef(null);
  const quizCount = QUIZ.filter(q => q.clause === clause.id).length;
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [active]);
  const link = `${window.location.origin}${window.location.pathname}#/policy?c=${encodeURIComponent(clause.id)}`;
  return (
    <motion.article
      ref={ref}
      id={`clause-${clause.id}`}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, scale: active ? 1.01 : 1 }}
      className={`group relative rounded-xl p-4 sm:p-5 transition ${active ? 'bg-amber-50 ring-2 ring-amber-300 shadow-lg' : isHit ? 'bg-white ring-1 ring-amber-200' : 'bg-white/70 hover:bg-white'}`}
      data-testid="clause"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1.5">
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-900 text-white">סעיף {clause.id}</span>
        <h4 className="font-semibold text-blue-900"><Highlight text={clause.label} query={query} /></h4>
      </div>
      <p className="text-[15px] leading-7 text-blue-800"><Highlight text={clause.text} query={query} /></p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <button type="button" onClick={async () => { await copy(`"${clause.text}"\n${citationOf(clause)}`); onCopied(`הציטוט מסעיף ${clause.id} הועתק`); }}
          className="px-2.5 py-1 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50">העתקת ציטוט</button>
        <button type="button" onClick={async () => { await copy(link); onCopied(`הקישור לסעיף ${clause.id} הועתק`); }}
          className="px-2.5 py-1 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50">קישור לסעיף</button>
        {quizCount > 0 && (
          <Link to={`/learn?mode=quiz&clause=${encodeURIComponent(clause.id)}`} className="px-2.5 py-1 rounded-md border border-teal-200 text-teal-800 hover:bg-teal-50">תרגול הסעיף</Link>
        )}
      </div>
    </motion.article>
  );
}

export default function PolicyPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const activeId = params.get('c') || '';
  const [toast, setToast] = useState('');
  const [hitIndex, setHitIndex] = useState(0);

  const hits = useMemo(() => searchClauses(query), [query]);
  const hitIds = new Set(hits.map(h => h.id));
  const searching = normalize(query).length > 0;

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  const jumpTo = (i) => {
    if (!hits.length) return;
    const idx = (i + hits.length) % hits.length;
    setHitIndex(idx);
    update({ c: hits[idx].id });
  };

  useEffect(() => { setHitIndex(0); }, [query]);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2000); };

  const fullText = [
    `${POLICY_META.title}, ${POLICY_META.issuer}`,
    `תוקף בוועדה מס' ${POLICY_META.committee} מיום ${POLICY_META.date}`,
    '',
    ...CHAPTERS.flatMap(ch => [`${ch.id}. ${ch.title}`, ...ch.clauses.map(c => `${c.id} ${c.label}: ${c.text}`), '']),
  ].join('\n');

  return (
    <div className="space-y-6">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="ink rounded-2xl overflow-hidden shadow-xl">
        <div className="blueprint p-6 sm:p-8">
          <div className="label !text-blue-300 mb-2">מסמך מצוטט · {ALL_CLAUSES.length} סעיפים</div>
          <h1 className="text-3xl sm:text-4xl font-extralight tracking-tight">{POLICY_META.title}</h1>
          <p className="mt-2 text-blue-200 text-sm font-mono">{POLICY_META.issuer} · ועדה {POLICY_META.committee} · {POLICY_META.date}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={async () => { await copy(fullText); flash('המסמך המלא הועתק'); }} className="px-3 py-1.5 rounded-lg text-sm bg-white text-blue-900 hover:bg-blue-100">העתקת המסמך המלא</button>
            <button type="button" onClick={() => window.print()} className="px-3 py-1.5 rounded-lg text-sm border border-blue-600 text-blue-100 hover:bg-blue-800">הדפסה</button>
          </div>
        </div>
      </motion.header>

      <div className="sticky top-[104px] sm:top-[112px] z-[900] paper rounded-xl p-3 sm:p-4">
        <label className="label block mb-1.5" htmlFor="policy-search">חיפוש מילות מפתח במסמך</label>
        <div className="flex gap-2 min-w-0">
          <input
            id="policy-search"
            type="search"
            value={query}
            onChange={e => update({ q: e.target.value, c: '' })}
            onKeyDown={e => { if (e.key === 'Enter') jumpTo(e.shiftKey ? hitIndex - 1 : hitIndex + (activeId ? 1 : 0)); }}
            placeholder="למשל: מרווח מדרכה, שיפוע, 30 מ&quot;ר"
            className="flex-1 min-w-0 rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {searching && (
            <div className="flex gap-1 flex-none">
              <button type="button" onClick={() => jumpTo(hitIndex - 1)} disabled={!hits.length} className="px-3 rounded-lg border border-blue-200 text-sm disabled:opacity-40">הקודם</button>
              <button type="button" onClick={() => jumpTo(hitIndex + (activeId ? 1 : 0))} disabled={!hits.length} className="px-3 rounded-lg bg-blue-900 text-white text-sm disabled:opacity-40">הבא</button>
            </div>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 items-center">
          {searching ? (
            <p className="text-sm" data-testid="search-count">
              {hits.length ? <span className="text-green-800">נמצאו {hits.length} סעיפים: {hits.map(h => h.id).join(', ')}</span> : <span className="text-red-700">לא נמצאו סעיפים. נסו מילה אחרת.</span>}
              <button type="button" onClick={() => update({ q: '', c: '' })} className="mr-2 underline text-blue-600">ניקוי</button>
            </p>
          ) : KEYWORDS.map(k => (
            <button key={k} type="button" onClick={() => update({ q: k })} className="px-2.5 py-1 rounded-full text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 transition">{k}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav className="sticky top-[270px] paper rounded-xl p-3 text-sm space-y-3 max-h-[calc(100vh-290px)] overflow-y-auto">
            <div className="label">תוכן עניינים</div>
            {CHAPTERS.map(ch => (
              <div key={ch.id}>
                <div className="font-semibold text-blue-900 mb-1">{ch.id}. {ch.title}</div>
                <div className="flex flex-wrap gap-1">
                  {ch.clauses.map(c => (
                    <button key={c.id} type="button" onClick={() => update({ c: c.id })} title={c.label}
                      className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${activeId === c.id ? 'bg-amber-300 text-blue-950' : hitIds.has(c.id) ? 'bg-amber-100 text-blue-900' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>{c.id}</button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div className="space-y-8 min-w-0">
          {CHAPTERS.map(ch => {
            const visible = searching ? ch.clauses.filter(c => hitIds.has(c.id)) : ch.clauses;
            if (!visible.length) return null;
            return (
              <section key={ch.id} className="min-w-0">
                <h2 className="text-xl font-light text-blue-900 mb-3 flex items-baseline gap-3">
                  <span className="font-mono text-sm text-blue-500">{ch.id}</span>{ch.title}
                </h2>
                <div className="space-y-2.5">
                  {visible.map(c => (
                    <ClauseCard key={c.id} clause={c} query={query} active={activeId === c.id} isHit={hitIds.has(c.id)} onCopied={flash} />
                  ))}
                </div>
              </section>
            );
          })}
          <p className="text-xs text-blue-500 border-t border-blue-200 pt-4">
            מקור: {POLICY_META.title}, {POLICY_META.issuer}, תוקף בוועדה מס' {POLICY_META.committee} מיום {POLICY_META.date}. כלי זה מנגיש את המסמך ואינו מחליף את נוסחו המחייב.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-5 inset-x-0 mx-auto w-fit z-[2000] ink px-4 py-2 rounded-lg shadow-xl text-sm" role="status">{toast}</motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
