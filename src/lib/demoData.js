// Clearly labeled demo data so a fresh browser shows how every track works.
// Loaded once automatically into an empty browser; removable from the system menu.
import { base44 } from '@/api/base44Client';
import { deleteRecord } from '@/api/localDb';
import { checklistFor } from '@/components/closure/constants';

const SEEDED_KEY = 'ashdod-closure:seeded';
const day = 86400000;
const ago = (d) => new Date(Date.now() - d * day).toISOString();

const allChecked = (type, except = []) =>
  Object.fromEntries(checklistFor(type).map(c => [c.id, !except.includes(c.id)]));

const MENU_CAFE = [
  { name: 'אספרסו', price: '9' }, { name: 'הפוך גדול', price: '15' }, { name: 'כריך טוסט', price: '38' }, { name: 'סלט יווני', price: '46' },
];
const MENU_REST = [
  { name: 'מנה ראשונה של היום', price: '42' }, { name: 'דג ים בגריל', price: '98' }, { name: 'פסטה עגבניות', price: '62' }, { name: 'קינוח הבית', price: '36' },
];

const DEMO = [
  { business: 'בית קפה הציונות (הדגמה)', address: 'הציונות 20, אשדוד', lat: 31.78695, lng: 34.64475, status: 'approved', type: 'type1', area: 18, business_type: 'בית קפה', menu_items: MENU_CAFE, days: 40 },
  { business: 'מסעדת תש"ח (הדגמה)', address: 'תש"ח 9, אשדוד', lat: 31.78738, lng: 34.64672, status: 'pending_review', type: 'type2', area: 34, business_type: 'מסעדה', exceptChecks: ['c2_14'], days: 3 },
  { business: 'מזנון הגדוד העברי (הדגמה)', address: 'הגדוד העברי 8, אשדוד', lat: 31.79245, lng: 34.6395, status: 'pending_owner', type: 'type1', area: 12, business_type: 'מזנון', exceptChecks: ['c1_3', 'c1_8'], notes: 'יש להשאיר מעבר של 2.5 מ\' לפחות ולהוסיף מרזב מוצנע (סעיפים ג.5, ג.13).', days: 9 },
  { business: 'בית קפה ז\'בוטינסקי (הדגמה)', address: 'ז\'בוטינסקי 45, אשדוד', lat: 31.8095, lng: 34.65485, status: 'approved', type: 'type2', area: 26, business_type: 'בית קפה', menu_items: MENU_CAFE, days: 60 },
  { business: 'פאב דרך הרכבת (הדגמה)', address: 'דרך הרכבת 1, אשדוד', lat: 31.776, lng: 34.6648, status: 'rejected', type: 'type1', area: 40, business_type: 'פאב', exceptChecks: ['c1_3', 'c1_4', 'c1_9'], notes: 'הסגירה חוסמת את המדרכה, הפתח לצד ודק עץ על המדרכה (סעיפים ג.5, ג.9, ג.14).', days: 20 },
  { business: 'גלידריה רוגוזין (הדגמה)', address: 'רוגוזין 12, אשדוד', lat: 31.7912, lng: 34.6365, status: 'approved', type: 'type1', area: 10, business_type: 'בית קפה', menu_items: [{ name: 'גלידה שני כדורים', price: '22' }, { name: 'שייק', price: '24' }], days: 75 },
  { business: 'מסעדת המרינה (הדגמה)', address: 'שדרות הרצל 10, אשדוד', lat: 31.79735, lng: 34.6335, status: 'approved', type: 'type2', area: 29, business_type: 'מסעדה', menu_items: MENU_REST, days: 90 },
  { business: 'קפה רובע ג\' (הדגמה)', address: 'שבטי ישראל 5, אשדוד', lat: 31.8008, lng: 34.6372, status: 'pending_review', type: 'type1', area: 15, business_type: 'בית קפה', days: 1 },
  { business: 'סגירה קיימת, העצמאות (הדגמה)', address: 'העצמאות 85, אשדוד', lat: 31.7878, lng: 34.6446, status: 'mapped', type: 'type1', area: 14, business_type: 'פאב', days: 5 },
  { business: 'סגירה קיימת, הנשמה (הדגמה)', address: 'הנשמה 58, אשדוד', lat: 31.7886, lng: 34.6435, status: 'mapped', type: 'type2', area: 22, business_type: 'בר', days: 5 },
  { business: 'סגירה קיימת, סיטי (הדגמה)', address: 'שדרות מנחם בגין 3, אשדוד', lat: 31.8087, lng: 34.6579, status: 'mapped', type: 'type1', area: 16, business_type: 'בית קפה', days: 4 },
  { business: 'מזנון רובע ט\"ו (הדגמה)', address: 'דרך הרכבת 3, אשדוד', lat: 31.7768, lng: 34.6646, status: 'approved', type: 'type1', area: 9, business_type: 'מזנון', menu_items: [{ name: 'שווארמה בפיתה', price: '42' }, { name: 'פלאפל', price: '22' }], days: 30 },
];

export async function loadDemoData() {
  const year = new Date().getFullYear();
  await base44.entities.ClosureApplication.bulkCreate(DEMO.map((d, i) => {
    const { exceptChecks = [], days, ...rest } = d;
    const reviewed = ['approved', 'rejected', 'pending_owner'].includes(d.status);
    return {
      ...rest,
      demo: true,
      owner: 'בעל עסק לדוגמה',
      phone: '08-0000000',
      email: 'demo@example.com',
      description: 'בקשה לדוגמה בלבד, לצורך היכרות עם המערכת.',
      application_id: `DEMO-${year}-${String(i + 1).padStart(3, '0')}`,
      checklist: d.status === 'mapped' ? {} : allChecked(d.type, exceptChecks),
      submitted_at: d.status === 'mapped' ? null : ago(days),
      history: reviewed ? [{ type: 'status_change', status: d.status, notes: d.notes || '', date: ago(Math.max(0, days - 2)) }] : [],
    };
  }));
  return DEMO.length;
}

export async function removeDemoData() {
  const all = await base44.entities.ClosureApplication.list();
  const demo = all.filter(a => a.demo);
  for (const a of demo) await deleteRecord(a.id);
  return demo.length;
}

// First visit with an empty browser: load the demo once so the pages are not empty.
export async function seedOnce() {
  try {
    if (localStorage.getItem(SEEDED_KEY)) return false;
    localStorage.setItem(SEEDED_KEY, new Date().toISOString());
  } catch { return false; }
  const existing = await base44.entities.ClosureApplication.list();
  if (existing.length) return false;
  await loadDemoData();
  return true;
}

export async function demoCount() {
  return (await base44.entities.ClosureApplication.list()).filter(a => a.demo).length;
}
