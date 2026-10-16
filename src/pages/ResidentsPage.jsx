import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ResidentView from '../components/closure/ResidentView';

const RIGHTS = [
  { n: "2.5 מ'", t: 'מעבר פנוי', d: 'בין הסגירה לשפת המדרכה נשאר מעבר להולכי רגל, עגלות וכיסאות גלגלים.', c: 'ג.5' },
  { n: 'אותה מדרכה', t: 'בלי במות ודקים', d: 'אסור להגביה, לצפות או להחליף את ריצוף המדרכה.', c: 'ג.14' },
  { n: '15.4', t: 'פירוק בסוף החורף', d: 'פרגוד חורף מפורק בתום העונה בלי שאריות בולטות.', c: 'ב.1.3' },
];

export default function ResidentsPage() {
  return (
    <div className="space-y-6">
      <header className="ink rounded-2xl overflow-hidden shadow-xl">
        <div className="blueprint p-6 sm:p-8">
          <div className="label !text-blue-300">מסלול תושב</div>
          <h1 className="text-3xl sm:text-4xl font-extralight mt-1">המדרכה שייכת לכולם</h1>
          <p className="text-blue-200 mt-2 max-w-2xl">כאן רואים אילו סגירות אושרו בעיר, עם תפריט ומיקום, ומה כל סגירה חייבת להשאיר לכם ברחוב.</p>
        </div>
      </header>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-3">
        {RIGHTS.map((r, i) => (
          <motion.div key={r.c} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="paper rounded-2xl p-5">
            <div className="text-3xl font-extralight font-mono text-blue-950">{r.n}</div>
            <div className="font-semibold text-blue-900 mt-1">{r.t}</div>
            <p className="text-sm text-blue-700 mt-1">{r.d}</p>
            <Link to={`/policy?c=${encodeURIComponent(r.c)}`} className="mt-2 inline-block font-mono text-xs underline text-blue-500">סעיף {r.c}</Link>
          </motion.div>
        ))}
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        ראיתם סגירה שחוסמת את המדרכה או נשארה אחרי סוף העונה? פנו למוקד העירוני בטלפון 106 וציינו את הכתובת.
      </div>
      <ResidentView />
    </div>
  );
}
