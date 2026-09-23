// Shared domain constants for closure applications (single source of truth).

export const TYPE_LABELS = {
  type1: 'סגירת חורף / פרגוד',
  type2: 'סגירה עונתית',
};

export const typeLabel = (type) => TYPE_LABELS[type] || 'לא צוין';

export const STATUS_LABELS = {
  pending_owner: 'ממתין לבעל עסק',
  pending_review: 'ממתין לבדיקה',
  approved: 'מאושר',
  rejected: 'נדחה',
};

// Wording used in reports / history ("the application was ...")
export const STATUS_ACTION_LABELS = {
  approved: 'אושרה',
  rejected: 'נדחתה',
  pending_owner: 'הוחזרה לתיקון',
  pending_review: 'בבדיקה',
};

export const STATUS_STYLES = {
  pending_owner: 'bg-blue-100 text-blue-700 border-blue-200',
  pending_review: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-600 border-red-200',
};

export const CHECKLIST_TYPE1 = [
  { id: 'c1_1', text: 'קיים רישיון עסק בתוקף' },
  { id: 'c1_2', text: 'ההצבה תואמת את תנאי רישיון העסק והמפה המצבית שהוגשה במסגרתו' },
  { id: 'c1_3', text: 'נשמר מרווח של לפחות 2.5 מ"ר בין שפת המדרכה לדופן הסגירה' },
  { id: 'c1_4', text: 'הפתח הוא לחזית בלבד ולא לצדדים' },
  { id: 'c1_5', text: 'גובה הגג אינו עולה על גובה קומת הקרקע של המבנה' },
  { id: 'c1_6', text: 'שיפוע הגג לפחות 1.5% עם כרכוב היקפי ישר' },
  { id: 'c1_7', text: 'חומרים גמישים בלבד: שמשונית / ברזנט על שלד פרופילים אלומיניום / ברזל' },
  { id: 'c1_8', text: 'ניהול מי גשמים בתעלת איסוף וצינור אנכי מוצנע' },
  { id: 'c1_9', text: 'אין שינוי / ציפוי / הגבהה של המדרכה הציבורית' },
  { id: 'c1_10', text: 'אין העברת תשתיות גלויה (חשמל, גז, מים)' },
  { id: 'c1_11', text: 'קיים אישור מהנדס / הנדסאי מבנים בדבר יציבות הסגירה' },
  { id: 'c1_12', text: 'קיים אישור יועץ בטיחות לסגירה' },
  { id: 'c1_13', text: 'הפרגוד יפורק עם תום תקופת ההרשאה' },
];

export const CHECKLIST_TYPE2 = [
  { id: 'c2_1', text: 'קיים רישיון עסק בתוקף' },
  { id: 'c2_2', text: 'ההצבה תואמת את תנאי רישיון העסק והמפה המצבית שהוגשה במסגרתו' },
  { id: 'c2_3', text: 'נשמר מרווח של לפחות 2.5 מ"ר בין שפת המדרכה לדופן הסגירה' },
  { id: 'c2_4', text: 'הפתח הוא לחזית בלבד ולא לצדדים' },
  { id: 'c2_5', text: 'גובה הגג אינו עולה על גובה קומת הקרקע של המבנה' },
  { id: 'c2_6', text: 'שיפוע הגג לפחות 1.5% עם כרכוב היקפי ישר' },
  { id: 'c2_7', text: 'חומרים עמידים: שלד אלומיניום / ברזל עם מילואה מזכוכית בעלת 90% שקיפות לפחות' },
  { id: 'c2_8', text: 'ניהול מי גשמים בתעלת איסוף וצינור אנכי מוצנע' },
  { id: 'c2_9', text: 'אין שינוי / ציפוי / הגבהה של המדרכה הציבורית' },
  { id: 'c2_10', text: 'אין העברת תשתיות גלויה (חשמל, גז, מים)' },
  { id: 'c2_11', text: 'קיים אישור מהנדס / הנדסאי מבנים בדבר יציבות הסגירה' },
  { id: 'c2_12', text: 'קיים אישור יועץ בטיחות לסגירה' },
  { id: 'c2_13', text: 'קיים אישור יועץ נגישות מתו"ס לאנשים בעלי מוגבלויות' },
  { id: 'c2_14', text: 'שטח הסגירה מעל 30 מ"ר — בוצע תיאום מול אדריכלית העיר' },
];

export const checklistFor = (type) => (type === 'type2' ? CHECKLIST_TYPE2 : CHECKLIST_TYPE1);

export const DECLARATIONS_TYPE1 = [
  { id: 'd1_1', text: 'אני מתחייב להקים את הפרגוד על פי התכנית המאושרת ורק לאחר קבלת היתר כחוק.' },
  { id: 'd1_2', text: 'אני מצהיר שקראתי את ההנחיות ואת התנאים להצבת פרגודים הנדרשים ע"י עיריית אשדוד ואני מתחייב לפעול על פיהם.' },
  { id: 'd1_3', text: 'אני מתחייב לקבל את הסכמת כל בעלי הזכויות בשטח המבוקש ואני משחרר את העירייה מכל אחריות בקשר לכך.' },
  { id: 'd1_4', text: 'אני מתחייב לפצות את העירייה בגין כל תביעה שיש לה קשר להצבת הפרגוד.' },
  { id: 'd1_5', text: 'אני מתחייב לאפשר מעבר להולכי הרגל ותנועה חופשית בשטח.' },
  { id: 'd1_6', text: 'אני מתחייב לפרק את הפרגוד עם תום תקופת ההרשאה, או על פי דרישה למי שהוסמך לכך ע"י ראש העיר.' },
  { id: 'd1_7', text: 'ידוע לי כי אי מילוי תנאי התחייבות זו יכול לשמש עילה לאי מתן ההרשאה להצבת פרגוד בעונה הבאה.' },
];

export const DOCUMENTS_TYPE2 = [
  { id: 'doc2_1', text: 'רישיון עסק בתוקף' },
  { id: 'doc2_2', text: 'עמידה בתנאי ההנחיות המרחביות' },
  { id: 'doc2_3', text: 'סקיצה עם גודל השטח' },
  { id: 'doc2_4', text: 'אישור קונסטרוקטור / אישור מהנדס מבנים' },
  { id: 'doc2_5', text: 'טופס דיווח על ביצוע עבודה הפטורה מהיתר' },
];

export const DOCS_LABELS = [
  { key: 'business_photo', label: 'תמונת העסק' },
  { key: 'closure_simulation', label: 'הדמיית הסגירה' },
  { key: 'site_plan', label: 'תוכנית העמדה' },
  { key: 'facade_plan', label: 'תוכנית חזית' },
  { key: 'section_plan', label: 'תוכנית חתך' },
];

export const REQUIRED_FIELDS = [
  { key: 'business', label: 'שם העסק' },
  { key: 'owner', label: 'שם בעל העסק' },
  { key: 'address', label: 'כתובת' },
  { key: 'phone', label: 'טלפון' },
  { key: 'email', label: 'דוא"ל' },
  { key: 'area', label: 'שטח' },
  { key: 'description', label: 'תיאור הבקשה' },
];

export function missingFieldsOf(app) {
  const missing = REQUIRED_FIELDS.filter(f => !app[f.key]).map(f => f.label);
  if (!app.lat || !app.lng) missing.push('מיקום על המפה');
  return missing;
}

// Menu can be the wizard's array format or the legacy {name: price} object.
export function menuItemsOf(app) {
  if (Array.isArray(app.menu_items) && app.menu_items.length) {
    return app.menu_items.filter(i => i?.name);
  }
  if (app.menu && typeof app.menu === 'object') {
    return Object.entries(app.menu).map(([name, price]) => ({ name, price }));
  }
  return [];
}

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
