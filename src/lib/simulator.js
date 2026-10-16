// Pure rule checks for the "build a closure" game. Each result cites its policy clause.

export const BUSINESS_TYPES = [
  { val: 'restaurant', label: 'בית אוכל', allowed: true },
  { val: 'cafe', label: 'בית קפה', allowed: true },
  { val: 'snack', label: 'מזנון', allowed: true },
  { val: 'clothing', label: 'חנות בגדים', allowed: false },
];

export const DEFAULT_DESIGN = {
  type: 'type1',
  businessType: 'cafe',
  license: true,
  frontage: 6,       // m, along the facade
  depth: 3,          // m, from facade toward the street
  sidewalk: 6,       // m, facade to curb
  floorHeight: 4,    // m, ground floor height of the building
  roofHeight: 3.6,   // m
  slope: 2,          // %
  opening: 'front',  // front | side
  transparency: 90,  // % (type2 glass)
  gutter: true,      // concealed gutter + downpipe
  deck: false,       // raised deck / turf on the sidewalk
  exposedCables: false,
};

const r = (id, clause, ok, okText, failText, level = 'fail') => ({ id, clause, ok, text: ok ? okText : failText, level: ok ? 'ok' : level });

export function evaluate(d) {
  const clearance = +(d.sidewalk - d.depth).toFixed(2);
  const area = +(d.frontage * d.depth).toFixed(1);
  const biz = BUSINESS_TYPES.find(b => b.val === d.businessType);
  const results = [
    r('license', 'ג.1', d.license, 'יש רישיון עסק בתוקף', 'אין רישיון עסק בתוקף: ההצבה מותנית בו'),
    r('business', 'ג.3', !!biz?.allowed, `${biz?.label} רשאי להציב סגירה`, `${biz?.label} אינו בית אוכל, בית קפה או מזנון`),
    r('clearance', 'ג.5', clearance >= 2.5, `נשאר מעבר של ${clearance} מ' להולכי רגל`, `נשאר מעבר של ${clearance} מ' בלבד, נדרשים לפחות 2.5`),
    r('area', 'ג.7', area <= 30, `שטח ${area} מ"ר, ללא צורך בתיאום`, `שטח ${area} מ"ר, מעל 30: נדרש תיאום עם אדריכלית העיר`, 'warn'),
    r('opening', 'ג.9', d.opening === 'front', 'הפתח פונה לחזית', 'הפתח פונה לצד: הפתח יהא לחזית בלבד'),
    r('height', 'ג.10', d.roofHeight <= d.floorHeight, `גג ${d.roofHeight} מ', לא מעל קומת הקרקע`, `גג ${d.roofHeight} מ' גבוה מקומת הקרקע (${d.floorHeight} מ')`),
    r('slope', 'ג.11', d.slope >= 1.5, `שיפוע ${d.slope}%`, `שיפוע ${d.slope}% נמוך מהמינימום 1.5%`),
    d.type === 'type2'
      ? r('material', 'ב.2.3', d.transparency >= 90, `זכוכית בשקיפות ${d.transparency}%`, `שקיפות ${d.transparency}%, נדרשת 90% לפחות`)
      : r('material', 'ב.1.4', true, 'שמשונית / ברזנט על שלד מתכת', ''),
    r('gutter', 'ג.13', d.gutter, 'מרזב מוצנע וצינור אנכי', 'מי הגשמים לא מנוהלים או שהמרזב בולט לרחוב'),
    r('deck', 'ג.14', !d.deck, 'המדרכה נשארת כפי שהיא', 'במה, דק או דשא על המדרכה אסורים'),
    r('cables', 'ג.15', !d.exposedCables, 'אין תשתיות גלויות', 'כבלים או צנרת גלויים אסורים'),
  ];
  if (d.type === 'type2') {
    results.push(r('access', 'ג.18', true, 'נדרש אישור יועץ נגישות (טיפוס 2)', ''));
  } else {
    results.push(r('season', 'ב.1.3', true, 'פירוק בתום העונה, עד 15.4', ''));
  }
  const fails = results.filter(x => x.level === 'fail').length;
  const warns = results.filter(x => x.level === 'warn').length;
  const score = Math.round(((results.length - fails - warns * 0.5) / results.length) * 100);
  return { results, fails, warns, score, clearance, area };
}

export const QUIZ = [
  { q: 'פרגוד (טיפוס 1) מותר רק בין 15.10 ל-15.4.', a: true, clause: 'ב.1.1', why: 'זו תקופת החורף שבה מותרת סגירת חורף.' },
  { q: 'חנות בגדים יכולה להציב סגירה עונתית מול החנות.', a: false, clause: 'ג.3', why: 'רק בתי אוכל, בתי קפה ומזנונים.' },
  { q: 'אפשר להשאיר מעבר של 1.5 מ\' בין הסגירה לשפת המדרכה.', a: false, clause: 'ג.5', why: 'המרווח המינימלי הוא 2.5.' },
  { q: 'סגירה של 35 מ"ר מחייבת תיאום עם אדריכלית העיר.', a: true, clause: 'ג.7', why: 'מעל 30 מ"ר נדרש תיאום.' },
  { q: 'מותר לפתוח את הכניסה לסגירה מהצד.', a: false, clause: 'ג.9', why: 'הפתח יהא לחזית ולא לצדדים.' },
  { q: 'גג הסגירה יכול להיות גבוה מקומת הקרקע אם הוא שקוף.', a: false, clause: 'ג.10', why: 'הגובה לא יעלה על גובה קומת הקרקע.' },
  { q: 'השיפוע המינימלי של גג הסגירה הוא 1.5%, מוסתר בכרכוב.', a: true, clause: 'ג.11', why: 'כך נקבע, עם כרכוב היקפי ישר.' },
  { q: 'אפשר להניח דק עץ על המדרכה בתוך הסגירה.', a: false, clause: 'ג.14', why: 'ציפוי או הגבהה של המדרכה אסורים.' },
  { q: 'סגירה עונתית (טיפוס 2) עשויה זכוכית בשקיפות 90% לפחות.', a: true, clause: 'ב.2.3', why: 'זו דרישת החומר לטיפוס 2.' },
  { q: 'כבל חשמל גלוי לתאורה בסגירה מותר באישור בעל העסק.', a: false, clause: 'ג.15', why: 'אסורה העברת תשתיות גלויה.' },
  { q: 'אישור יועץ נגישות נדרש גם לפרגוד חורף.', a: false, clause: 'ג.18', why: 'נדרש לסגירה עונתית (טיפוס 2) בלבד.' },
  { q: 'המרזבים צריכים להיות מוצנעים ולא לבלוט לרחוב.', a: true, clause: 'ג.13', why: 'כך נשמרת חזית נקייה לרחוב.' },
];

export function levelOf(score, total) {
  const pct = total ? score / total : 0;
  if (pct >= 0.9) return 'מומחה/ית סגירות';
  if (pct >= 0.6) return 'בקיא/ה במדיניות';
  return 'בדרך ללמידה';
}
