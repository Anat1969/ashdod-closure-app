// Clearly labeled demo applications so a fresh browser can see how the map and review work.
import { base44 } from '@/api/base44Client';
import { deleteRecord } from '@/api/localDb';

const DEMO = [
  { business: 'הדגמה: בית קפה בהציונות', address: 'הציונות 20, אשדוד', lat: 31.7869, lng: 34.6450, status: 'approved', type: 'type1', area: 18, business_type: 'בית קפה' },
  { business: 'הדגמה: מסעדה בתש"ח', address: 'תש"ח 9, אשדוד', lat: 31.7874, lng: 34.6468, status: 'pending_review', type: 'type2', area: 34, business_type: 'מסעדה' },
  { business: 'הדגמה: מזנון בהגדוד העברי', address: 'הגדוד העברי 8, אשדוד', lat: 31.7925, lng: 34.6395, status: 'pending_owner', type: 'type1', area: 12, business_type: 'מזנון' },
  { business: 'הדגמה: בית קפה בז\'בוטינסקי', address: 'ז\'בוטינסקי 45, אשדוד', lat: 31.8095, lng: 34.6548, status: 'approved', type: 'type2', area: 26, business_type: 'בית קפה' },
  { business: 'הדגמה: פאב בדרך הרכבת', address: 'דרך הרכבת 1, אשדוד', lat: 31.7760, lng: 34.6648, status: 'rejected', type: 'type1', area: 40, business_type: 'פאב' },
  { business: 'הדגמה: גלידריה ברובע ב\'', address: 'רוגוזין 12, אשדוד', lat: 31.7912, lng: 34.6365, status: 'approved', type: 'type1', area: 10, business_type: 'גלידריה' },
];

export async function loadDemoData() {
  const year = new Date().getFullYear();
  await base44.entities.ClosureApplication.bulkCreate(DEMO.map((d, i) => ({
    ...d,
    demo: true,
    owner: 'בעל עסק לדוגמה',
    phone: '08-0000000',
    email: 'demo@example.com',
    description: 'בקשה לדוגמה בלבד, לצורך היכרות עם המערכת.',
    application_id: `DEMO-${year}-${String(i + 1).padStart(3, '0')}`,
  })));
  return DEMO.length;
}

export async function removeDemoData() {
  const all = await base44.entities.ClosureApplication.list();
  const demo = all.filter(a => a.demo);
  for (const a of demo) await deleteRecord(a.id);
  return demo.length;
}
