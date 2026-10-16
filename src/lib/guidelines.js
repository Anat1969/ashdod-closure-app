// Visual guidelines: each one is a policy clause shown on the 3D street model,
// with the right way ("good") and a typical violation ("bad").

export const GOOD = {
  type: 'type2',     // type1 = fabric winter screen, type2 = glass seasonal closure
  width: 6,          // m along the facade (shopfront is 6 m)
  depth: 3,          // m from facade toward the street
  height: 3.4,       // m, front edge of the roof
  sidewalk: 6,       // m facade to curb
  floor: 4,          // m, ground floor height of the building
  drop: 0.3,         // m, roof fall toward the street (drawn larger than 1.5% for legibility)
  fascia: true,
  door: 'front',
  gutter: true,
  deck: false,
  cable: false,
  sign: 'fascia',
  opacity: 0.22,     // panel opacity: glass 90% transparent
  mounted: 1,        // 1 = standing, 0 = dismantled
};

export const GUIDELINES = [
  {
    id: 'clearance', clause: 'ג.5', camera: 'clearance', title: 'מעבר חופשי להולכי רגל',
    rule: 'בין דופן הסגירה לשפת המדרכה נשאר מרווח של 2.5 מ\' לפחות, בשים לב לתחנות, עצים וריהוט רחוב.',
    good: 'נשארים 3 מ\' להליכה נוחה.', bad: 'הסגירה עמוקה מדי: נשארים 1.2 מ\' בלבד.',
    badPatch: { depth: 4.8 },
  },
  {
    id: 'position', clause: 'ג.4', camera: 'overview', title: 'צמודה ומקבילה לחזית העסק',
    rule: 'הסגירה מוצבת בצמוד, במקביל ולמול חזית העסק בלבד, ולא חוסמת גישה לשכנים.',
    good: 'הסגירה ברוחב חזית העסק.', bad: 'הסגירה גולשת לחזית של השכן.',
    badPatch: { width: 9.5 },
  },
  {
    id: 'door', clause: 'ג.9', camera: 'side', title: 'פתח לחזית בלבד',
    rule: 'הכניסה לסגירה פונה לרחוב, לא לצדדים.',
    good: 'הדלת בחזית, מול הרחוב.', bad: 'הדלת בצד, לכיוון השכן.',
    badPatch: { door: 'side' },
  },
  {
    id: 'height', clause: 'ג.10', camera: 'front', title: 'לא גבוהה מקומת הקרקע',
    rule: 'גג הסגירה לא עולה על גובה קומת הקרקע של המבנה. גגות סמוכים בגובה זהה.',
    good: 'הגג מתחת לקו קומת הקרקע.', bad: 'הגג חוצה את קו קומת הקרקע.',
    badPatch: { height: 4.5 },
  },
  {
    id: 'roof', clause: 'ג.11', camera: 'roof', title: 'שיפוע מוסתר בכרכוב',
    rule: 'שיפוע של 1.5% לפחות, מוסתר בכרכוב היקפי ישר. מבחוץ רואים קו נקי.',
    good: 'כרכוב ישר מסתיר את השיפוע.', bad: 'אין כרכוב: השיפוע והגג חשופים.',
    badPatch: { fascia: false, drop: 0.7 },
  },
  {
    id: 'rain', clause: 'ג.13', camera: 'front', title: 'מי גשמים במרזב מוצנע',
    rule: 'תעלת איסוף בקצה הגג וצינור אנכי מוצנע עד הקרקע. לא בולט לרחוב.',
    good: 'המים יורדים בצינור.', bad: 'אין מרזב: המים נשפכים על העוברים.',
    badPatch: { gutter: false },
  },
  {
    id: 'material', clause: 'ב.2.3', camera: 'overview', title: 'קלה ושקופה',
    rule: 'סגירה עונתית: שלד אלומיניום או ברזל וזכוכית בשקיפות 90% לפחות. פרגוד חורף: שמשונית או ברזנט.',
    good: 'רואים דרך הסגירה את חזית העסק.', bad: 'מילוי אטום מסתיר את החזית.',
    badPatch: { opacity: 0.85 },
  },
  {
    id: 'sidewalk', clause: 'ג.14', camera: 'ground', title: 'המדרכה נשארת כפי שהיא',
    rule: 'אסור דק, במה, דשא, משטח או ריצוף שונה. לא משנים את המדרכה.',
    good: 'הריצוף העירוני נמשך גם בתוך הסגירה.', bad: 'דק עץ מוגבה על המדרכה.',
    badPatch: { deck: true },
  },
  {
    id: 'infra', clause: 'ג.15', camera: 'front', title: 'בלי תשתיות גלויות',
    rule: 'אין כבלי חשמל, גז או מים גלויים. חיבורים באחריות בעל העסק ובאישור חשמלאי.',
    good: 'אין כבלים גלויים.', bad: 'כבל חשמל משתלשל על החזית.',
    badPatch: { cable: true },
  },
  {
    id: 'sign', clause: 'ג.12', camera: 'front', title: 'שילוט על הכרכוב',
    rule: 'השילוט בתחום חזית הסגירה, על הכרכוב המקיף, לפי מדיניות השילוט העירונית.',
    good: 'השלט משולב בכרכוב.', bad: 'השלט בולט מעל הגג.',
    badPatch: { sign: 'roof' },
  },
  {
    id: 'area', clause: 'ג.7', camera: 'roof', title: 'מעל 30 מ"ר: תיאום',
    rule: 'השטח נקבע לפי רוחב החזית והמרווחים. סגירה מעל 30 מ"ר מתואמת עם אדריכלית העיר.',
    good: '6 x 3 = 18 מ"ר.', bad: '9.5 x 4 = 38 מ"ר: נדרש תיאום.',
    badPatch: { width: 9.5, depth: 4 },
  },
  {
    id: 'season', clause: 'ב.1.3', camera: 'overview', title: 'פרגוד חורף מפורק בסוף העונה',
    rule: 'פרגוד (טיפוס 1) עומד בין 15.10 ל-15.4 ומפורק בתום העונה בלי שאריות בולטות.',
    good: 'חורף: הפרגוד עומד.', bad: 'קיץ: הפרגוד מפורק והמדרכה נקייה.',
    goodPatch: { type: 'type1', opacity: 0.8 },
    badPatch: { type: 'type1', opacity: 0.8, mounted: 0 },
    badIsSeason: true,
  },
];

export const paramsFor = (g, variant) => ({
  ...GOOD,
  ...(g?.goodPatch || {}),
  ...(variant === 'bad' ? g?.badPatch || {} : {}),
});
