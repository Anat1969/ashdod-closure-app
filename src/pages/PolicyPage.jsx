import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';

const SECTIONS = [
  {
    id: 'general',
    title: 'א. כללי',
    content: [
      {
        text: 'מסמך מדיניות זה מכיל הגדרות והנחיות לתכנון ועיצוב סגירות חורף וסגירות עונתית ברחבי העיר אשדוד.',
      },
      { text: 'תוקף בועדה מס׳: 202411 בתאריך: 24/10/2024', bold: true },
    ],
  },
  {
    id: 'definitions',
    title: 'ב. הגדרות',
    subsections: [
      {
        id: 'type1',
        title: 'סגירת חורף / פרגוד (טיפוס 1)',
        params: [
          {
            label: 'הגדרה',
            text: 'הינה מתקן לסגירה וקירוי של המקום בו קיים היתר שימור רחובות להצבת שולחנות וכסאות ברישיון בתקופת החורף (התקופה שמיום 15.10 ועד ליום 15.4 בכל שנה קלנדרית).',
          },
          {
            label: 'תנאי',
            text: 'הצבת הפרגוד חייבת בקבלת היתר שימור רחובות חדש מדי שנה, טרם הצבתו — הצבה ללא היתר תגרור פעולות אכיפה מידיות להסרתו. הצבת הפרגוד מותנית בקבלת רישיון עסק.',
          },
          {
            label: 'הנחיות',
            text: 'יש לפרק בתום העונה, ולוודא שלא נשארו אלמנטים בולטים לאחר פירוק.',
          },
          {
            label: 'חומרים',
            text: 'שימוש בחומרים גמישים כגון: שמשונית / ברזנט על גבי שלד פרופילים אלומיניום / ברזל. יתאפשר שימוש בחומרים של טיפוס 2 ובלבד שיפורק במועד הקצוב.',
          },
        ],
      },
      {
        id: 'type2',
        title: 'סגירה עונתית (טיפוס 2)',
        params: [
          {
            label: 'הגדרה',
            text: 'סגירה עונתית כהגדרתה בסעיף 26 בתקנות התכנון ובניה (עבודות ומבנים פטורים מהיתר) תשע"ד-2014. מתקן עשוי חומרים קלים, המגן על היושבים בבית אוכל מפני השפעת מזג האוויר.',
          },
          {
            label: 'תנאי',
            text: 'הקמת המתקן מותנית בקבלת רישיון עסק. המתקן יוקם בהתאם למפורט בהנחיות תכנון ועיצוב.',
          },
          {
            label: 'חומרים',
            text: 'שימוש בחומרים עמידים כגון שלד פרופילים אלומיניום / ברזל, בעל מילואה מזכוכית בעלת 90% שקיפות לפחות.',
          },
        ],
      },
    ],
  },
  {
    id: 'guidelines',
    title: 'ג. תנאים והנחיות לתכנון ועיצוב',
    params: [
      { label: 'רישיון עסק', text: 'ההצבה מותנית בקיומו של רישיון עסק בתוקף.' },
      { label: 'תנאי רישיון', text: 'ההצבה היא עפ"י תנאי רישיון העסק והמפה המצבית המוגשת במסגרתו.' },
      { label: 'סוגי עסקים', text: 'העסקים שלהם תותר ההצבה הם: בתי אוכל; בתי קפה; מזנונים — הכל בהתאם להגדרת חוק רישוי עסקים.' },
      {
        label: 'מיקום',
        text: 'ההצבה תתבצע בשטח פרטי או ציבורי. הצבת הסגירה במקביל, בצמוד ולמול חזית בית העסק. במקרה של קירוי או קולונדה קיימים — יש להתיישר עם קו הקירוי / הקולונדה ולשמור על מעבר חופשי בין חזית המבנה לבין הסגירה. ההצבה לא תמנע גישה לשטחים פרטיים ו/או ציבורים.',
      },
      {
        label: 'מעבר הולכי רגל',
        text: 'יש לוודא שהמיקום יותיר מרווח של לפחות 2.5 מ"ר בין שפת המדרכה לדופן הסגירה, ובשים לב לפרטי רחוב (תחנות אוטובוס, עצים וכו\'). למקרה של קירוי בנוי או קולונדה — ישמר מרחק כרוחב הקירוי.',
      },
      {
        label: 'מרחק בין פרגודים סמוכים',
        text: 'יש להביא הסכמה של החנויות הצמודות להתיישרות הסגירה לקיר המשותף.',
      },
      {
        label: 'שטח וגודל הסגירה',
        text: 'גבולות השטח יקבעו לפי רוחב חזית בית העסק ושמירת מרווחים למעבר הציבור. בסגירה ששטחה עולה על 30 מ"ר יש לבצע תיאום אל מול אדריכלית העיר.',
      },
      {
        label: 'חומרים',
        text: 'טיפוס 1: חומרים גמישים — שמשונית / ברזנט על שלד אלומיניום / ברזל. טיפוס 2: חומרים עמידים — שלד אלומיניום / ברזל עם מילואה מזכוכית בעלת 90% שקיפות לפחות.',
      },
      { label: 'פתח הסגירה', text: 'יהא לחזית ולא לצדדים.' },
      {
        label: 'גובה הגג',
        text: 'יש לוודא שלא יעלה על גובה קומת הקרקע של המבנה. גגות סמוכים צריכים להיות בגבהים זהים.',
      },
      {
        label: 'שיפוע הגג',
        text: 'יש לשמור על שיפוע מינימלי של 1.5% בגג הסגירה אשר יוסתר בכרכוב היקפי ישר בגובה השיפוע על מנת להסתיר את שיפוע הגג.',
      },
      {
        label: 'שילוט',
        text: 'שילוט ע"ג הסגירה ייעשה בהתאם למדיניות השילוט העירונית בתחום חזית הסגירה על הכרכוב המקיף.',
      },
      {
        label: 'ניהול מי גשמים',
        text: 'יש להוביל את מי הגשמים מהגג לתעלת איסוף בקצה הגג ולהורידם בצינור אנכי לקרקע. המרזבים צריכים להיות מוצנעים ולא לבלוט לעבר הרחוב.',
      },
      {
        label: 'ריצוף / חיפוי מדרכה',
        text: 'חל איסור על ציפוי ו/או הגבהה ו/או הנמכת המדרכה בבמות עץ; דק עץ; דשא מלאכותי/טבעי; משטחי בטון או מתכת; וריצוף השטח במרצפות השונות מן הריצוף הקיים. לא יותר כל שינוי במדרכה וברחבה הציבורית. למעט מקרים מיוחדים של שיפועי קרקע — יתואמו ויאושרו ע"י אדריכלית העיר.',
      },
      {
        label: 'תשתיות',
        text: 'לא תותר העברת תשתיות גלויה (חשמל, גז או מים). חיבור חשמל או הצבת מתקני חימום / קירור / תאורה יהיו באחריות בעל העסק בלבד ובכפוף לאישור חשמלאי מוסמך.',
      },
      {
        label: 'אישור מהנדס / הנדסאי מבנים',
        text: 'יש לקבל אישור בדבר יציבות הסגירה.',
      },
      {
        label: 'אישור יועץ בטיחות',
        text: 'על בעל העסק להחזיק באישור יועץ בטיחות לסגירה, אותו ניתן יהיה להציג עפ"י דרישת העירייה בכל עת.',
      },
      {
        label: 'אישור יועץ נגישות מתו"ס לאנשים בעלי מוגבלויות',
        text: 'יידרש עבור סגירה עונתית (טיפוס 2) בלבד.',
      },
    ],
  },
];

function highlight(text, query) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((p, i) =>
    p.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-200 rounded px-0.5">{p}</mark>
      : p
  );
}

function ParamRow({ label, text, query }) {
  const match = query && (label.toLowerCase().includes(query.toLowerCase()) || text.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className={`flex gap-3 py-2.5 border-b border-gray-100 last:border-0 ${match ? 'bg-yellow-50 -mx-3 px-3 rounded-lg' : ''}`}>
      <span className="font-bold text-blue-800 text-sm whitespace-nowrap min-w-[160px]">{highlight(label, query)}:</span>
      <span className="text-gray-700 text-sm leading-relaxed">{highlight(text, query)}</span>
    </div>
  );
}

export default function PolicyPage() {
  const [search, setSearch] = useState('');
  const [openSections, setOpenSections] = useState({ general: true, definitions: true, guidelines: true });
  const [matchCount, setMatchCount] = useState(0);
  const contentRef = useRef(null);

  const q = search.trim();

  useEffect(() => {
    if (!q) { setMatchCount(0); return; }
    let count = 0;
    SECTIONS.forEach(s => {
      if (s.params) s.params.forEach(p => {
        if (p.label.toLowerCase().includes(q.toLowerCase()) || p.text.toLowerCase().includes(q.toLowerCase())) count++;
      });
      if (s.subsections) s.subsections.forEach(sub => sub.params.forEach(p => {
        if (p.label.toLowerCase().includes(q.toLowerCase()) || p.text.toLowerCase().includes(q.toLowerCase())) count++;
      }));
    });
    setMatchCount(count);
    if (count > 0) setOpenSections({ general: true, definitions: true, guidelines: true });
  }, [q]);

  const toggle = (id) => setOpenSections(o => ({ ...o, [id]: !o[id] }));

  return (
    <div dir="rtl" className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-l from-blue-900 to-blue-700 text-white rounded-2xl p-6 mb-6 shadow">
        <h2 className="text-2xl font-bold mb-1">מדיניות סגירות חורף וסגירות עונתיות</h2>
        <p className="text-blue-200 text-sm">עיריית אשדוד · תוקף בועדה מס׳ 202411 · 24/10/2024</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חפש פרמטר, נושא או מילת מפתח..."
            className="w-full border border-gray-200 rounded-lg pr-10 pl-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        {q && (
          <p className="text-xs mt-2 text-gray-500">
            {matchCount > 0 ? <span className="text-green-700 font-medium">נמצאו {matchCount} תוצאות עבור "{q}"</span> : <span className="text-red-500">לא נמצאו תוצאות עבור "{q}"</span>}
          </p>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {SECTIONS.map(section => (
          <div key={section.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              onClick={() => toggle(section.id)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-all"
            >
              <h3 className="text-lg font-bold text-blue-900">{highlight(section.title, q)}</h3>
              {openSections[section.id] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {openSections[section.id] && (
              <div className="px-6 pb-6 border-t border-gray-100">
                {section.content && (
                  <div className="pt-4 space-y-2">
                    {section.content.map((c, i) => (
                      <p key={i} className={`text-sm ${c.bold ? 'font-bold text-gray-800' : 'text-gray-700'} leading-relaxed`}>
                        {highlight(c.text, q)}
                      </p>
                    ))}
                  </div>
                )}

                {section.params && (
                  <div className="pt-4">
                    {section.params.map((p, i) => (
                      <ParamRow key={i} label={p.label} text={p.text} query={q} />
                    ))}
                  </div>
                )}

                {section.subsections && (
                  <div className="pt-4 space-y-6">
                    {section.subsections.map(sub => (
                      <div key={sub.id}>
                        <h4 className="font-bold text-blue-700 mb-3 text-base border-b border-blue-100 pb-2">
                          {highlight(sub.title, q)}
                        </h4>
                        <div>
                          {sub.params.map((p, i) => (
                            <ParamRow key={i} label={p.label} text={p.text} query={q} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}