import { motion } from 'framer-motion';

// Green check for "right", red X for "wrong". The one place where the app draws a symbol,
// by Anat's request (2026-10-16). Always paired with a text label for accessibility.
export default function VerdictMark({ ok, size = 88, animate = true, className = '' }) {
  const draw = (delay) => (animate
    ? { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.45, delay, ease: 'easeOut' } }
    : {});
  const ring = ok ? ['#22c55e', '#15803d'] : ['#ef4444', '#b91c1c'];
  const id = `vm-${ok ? 'ok' : 'no'}-${size}`;
  return (
    <motion.svg
      viewBox="0 0 100 100" width={size} height={size} className={`flex-none ${className}`}
      role="img" aria-label={ok ? 'נכון' : 'לא נכון'}
      initial={animate ? { scale: 0.6, opacity: 0, rotate: ok ? -12 : 12 } : false}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 18 }}
      data-testid={ok ? 'mark-ok' : 'mark-no'}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={ring[0]} />
          <stop offset="1" stopColor={ring[1]} />
        </linearGradient>
        <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.35" />
        </filter>
      </defs>
      <circle cx="50" cy="50" r="44" fill={`url(#${id})`} filter={`url(#${id}-s)`} />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" />
      {ok ? (
        <motion.path d="M29 52 L44 66 L72 36" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" {...draw(0.15)} />
      ) : (
        <>
          <motion.path d="M33 33 L67 67" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" {...draw(0.15)} />
          <motion.path d="M67 33 L33 67" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" {...draw(0.35)} />
        </>
      )}
    </motion.svg>
  );
}
