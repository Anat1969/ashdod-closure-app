// Official Ashdod streets (national street register, data.gov.il, city code 70),
// matched to OpenStreetMap geometry and served read-only from Supabase (table cl_streets).
const SUPABASE_URL = 'https://cbhexpybdggwzyakgagd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1KSwG6rqTzBSHmI2RxX6Fw_EEcuKzk3';
const CACHE_KEY = 'ashdod-closure:streets-v2';
const CACHE_DAYS = 7;

let memo = null;
const prepare = (rows) => rows.map(r => ({ ...r, tk: streetTokens(r.name), otk: streetTokens(r.osm_name) }));

const GENERIC = new Set(['', 'שדרות', 'שד', 'דרך', 'רחוב', 'רח', 'מבוא', 'סמטת', 'סמ', 'ככר', 'כיכר', 'אשדוד']);

export function streetTokens(s) {
  return [...new Set(String(s || '')
    .toLowerCase()
    .replace(/[״"׳'`.]/g, '')
    .replace(/[-(),]|\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(t => !GENERIC.has(t) && !/^\d+[א-ת]?$/.test(t))
    // People often drop the definite article: "ציונות" = "הציונות".
    .map(t => (t.length > 3 && t.startsWith('ה') ? t.slice(1) : t)))].sort();
}

export async function loadStreets() {
  if (memo) return memo;
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.at < CACHE_DAYS * 86400000 && cached.streets?.length) {
      memo = prepare(cached.streets);
      return memo;
    }
  } catch { /* ignore */ }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/cl_streets?select=code,name,kind,osm_name,center,lines&kind=in.(street,square)&order=name`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error('רשימת הרחובות לא נטענה');
  const rows = await res.json();
  memo = prepare(rows);
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), streets: rows })); } catch { /* quota */ }
  return memo;
}

// "הציונות 20, אשדוד" -> { street: "הציונות", number: "20" }
export function parseAddress(address) {
  const clean = String(address || '').replace(/,?\s*אשדוד\s*$/, '').split(',')[0].trim();
  const m = clean.match(/^(.*?)[\s]+(\d+[א-ת]?)$/) || clean.match(/^(\d+[א-ת]?)\s+(.*)$/);
  if (!m) return { street: clean, number: '' };
  return /^\d/.test(m[1]) ? { street: m[2].trim(), number: m[1] } : { street: m[1].trim(), number: m[2] };
}

// Best official street for a typed street name (order of words does not matter).
export function matchStreet(streets, text) {
  const tk = streetTokens(text);
  if (!tk.length || !streets?.length) return null;
  const key = tk.join(' ');
  let best = null; let bestScore = 0;
  for (const s of streets) {
    const exact = s.tk.join(' ') === key || s.otk.join(' ') === key;
    const overlap = tk.filter(t => s.tk.includes(t) || s.otk.includes(t)).length;
    const score = exact ? 100 : overlap / Math.max(tk.length, s.tk.length);
    if (score > bestScore) { best = s; bestScore = score; }
  }
  return bestScore >= 0.99 ? best : bestScore >= 0.5 ? best : null;
}

const meters = ([a, b], [c, d]) => Math.hypot((a - c) * 111000, (b - d) * 94000);

export function distanceToStreet(street, point) {
  if (!street?.lines?.length) return Infinity;
  let min = Infinity;
  street.lines.forEach(line => line.forEach(p => { min = Math.min(min, meters(p, point)); }));
  return min;
}

export function streetBounds(street) {
  const pts = (street?.lines || []).flat();
  if (!pts.length) return null;
  const lats = pts.map(p => p[0]); const lngs = pts.map(p => p[1]);
  return [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]];
}
