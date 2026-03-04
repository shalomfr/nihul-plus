/**
 * Israeli NGO Regulatory Calendar — 30+ pre-programmed annual deadlines.
 * Called when a new organization is created to populate their compliance calendar.
 *
 * Sources: חוק העמותות תש"ם-1980 ותיקוניו, הנחיות רשם העמותות
 */
import { prisma } from "./prisma";

// Use schema enum values
type SchemaComplianceItemType = "CERTIFICATE" | "REPORT" | "DOCUMENT" | "APPROVAL" | "REGISTRATION" | "POLICY";
type SchemaComplianceCategory =
  | "FOUNDING_DOCS"
  | "ANNUAL_OBLIGATIONS"
  | "TAX_APPROVALS"
  | "FINANCIAL_MGMT"
  | "DISTRIBUTION_DOCS"
  | "GOVERNANCE"
  | "EMPLOYEES_VOLUNTEERS"
  | "INSURANCE"
  | "GEMACH";
type SchemaComplianceStatus = "OK" | "WARNING" | "EXPIRED" | "MISSING";

interface RegulatoryItem {
  name: string;
  description: string;
  type: SchemaComplianceItemType;
  category: SchemaComplianceCategory;
  month: number; // 1-12
  day: number;   // 1-31
  legalBasis: string;
}

const ANNUAL_ITEMS: RegulatoryItem[] = [
  // ═══ דוחות שנתיים ═══
  {
    name: "הגשת דו\"ח כספי לרשם העמותות",
    description: "הגשת דו\"ח כספי שנתי (מאזן, רווח והפסד) לרשם העמותות עבור שנת הכספים הקודמת.",
    type: "REPORT",
    category: "ANNUAL_OBLIGATIONS",
    month: 6, day: 30,
    legalBasis: "סעיף 38 לחוק העמותות",
  },
  {
    name: "הגשת דו\"ח מילולי לרשם העמותות",
    description: "הגשת דו\"ח מילולי שנתי המתאר את פעילות העמותה, מוטבים, ודרכי קידום המטרות.",
    type: "REPORT",
    category: "ANNUAL_OBLIGATIONS",
    month: 6, day: 30,
    legalBasis: "סעיף 38א לחוק העמותות",
  },
  {
    name: "אישור ניהול תקין — חידוש שנתי",
    description: "בדיקה ועדכון אישור ניהול תקין אצל רשם העמותות — תנאי לתמיכות ממשלתיות.",
    type: "CERTIFICATE",
    category: "ANNUAL_OBLIGATIONS",
    month: 6, day: 30,
    legalBasis: "סעיף 39א לחוק העמותות",
  },
  // ═══ מס ═══
  {
    name: "חידוש אישור סעיף 46 — רשות המסים",
    description: "חידוש אישור המאפשר לתורמים לקבל זיכוי ממס של 35%. הגשת בקשה עד סוף אוגוסט בשנה שפג התוקף. דרישה: אישור ניהול תקין בתוקף + דוחות כספיים מבוקרים לשנתיים.",
    type: "APPROVAL",
    category: "TAX_APPROVALS",
    month: 8, day: 31,
    legalBasis: "סעיף 46 לפקודת מס הכנסה",
  },
  {
    name: "הגשת דוח מע\"מ שנתי",
    description: "הגשת דוח שנתי לרשות המסים — לעמותות עם פטור מע\"מ מותנה.",
    type: "REPORT",
    category: "TAX_APPROVALS",
    month: 4, day: 30,
    legalBasis: "חוק מס ערך מוסף, תשל\"ו-1975",
  },
  {
    name: "הגשת דוח מס הכנסה שנתי",
    description: "הגשת דוח מס הכנסה לרשות המסים עבור שנת הכספים הקודמת.",
    type: "REPORT",
    category: "TAX_APPROVALS",
    month: 5, day: 31,
    legalBasis: "פקודת מס הכנסה",
  },
  {
    name: "הגשת טופס 102 — דיווח ניכויים (חודשי)",
    description: "דיווח חודשי לביטוח לאומי ורשות המסים על ניכויי מס במקור ממשכורות עובדים. מועד הגשה: עד 15 בכל חודש עבור החודש הקודם. איחור גורר קנסות והצמדה.",
    type: "REPORT",
    category: "TAX_APPROVALS",
    month: 1, day: 15,
    legalBasis: "פקודת מס הכנסה — ניכויים; חוק הביטוח הלאומי",
  },
  // ═══ ממשל ═══
  {
    name: "אסיפה כללית שנתית",
    description: "כינוס אסיפה כללית לאישור דוחות, בחירת ועד וועדת ביקורת, ואישור תקציב.",
    type: "DOCUMENT",
    category: "GOVERNANCE",
    month: 5, day: 31,
    legalBasis: "סעיפים 19-26 לחוק העמותות",
  },
  {
    name: "אישור תקציב לשנה הבאה",
    description: "אישור תקציב שנת הפעילות הבאה על-ידי הוועד או האסיפה הכללית.",
    type: "DOCUMENT",
    category: "FINANCIAL_MGMT",
    month: 10, day: 31,
    legalBasis: "הנחיות רשם העמותות — ניהול כספי",
  },
  {
    name: "סגירת שנת כספים",
    description: "סגירה חשבונאית של שנת הכספים — הכנת יתרות לדוח הכספי השנתי.",
    type: "DOCUMENT",
    category: "FINANCIAL_MGMT",
    month: 12, day: 31,
    legalBasis: "הנחיות הרשם — ניהול פנקסים",
  },
  {
    name: "הצהרות ניגוד עניינים — חברי ועד",
    description: "קבלת הצהרות שנתיות מכל חברי הועד על ניגוד עניינים — ותיעוד בפרוטוקול.",
    type: "DOCUMENT",
    category: "GOVERNANCE",
    month: 1, day: 31,
    legalBasis: "הנחיות הרשם — קרבה משפחתית וניגוד עניינים",
  },
  {
    name: "בדיקת גמול חברי ועד — עמידה בתקרות",
    description: "בדיקה שנתית שגמול חברי הועד לא חורג מהתקרות שנקבעו על-ידי הרשם.",
    type: "DOCUMENT",
    category: "GOVERNANCE",
    month: 12, day: 15,
    legalBasis: "הנחיות הרשם — תשלום גמול לחבר ועד",
  },
  {
    name: "עדכון פרטי מורשי חתימה בבנק",
    description: "בדיקה שנתית שמורשי החתימה בחשבון הבנק תואמים להחלטות הועד האחרונות.",
    type: "DOCUMENT",
    category: "FINANCIAL_MGMT",
    month: 1, day: 15,
    legalBasis: "הנחיות הרשם — פתיחת חשבונות בנק",
  },
  {
    name: "הגשת דיווח על תרומות ממישות מדינית זרה",
    description: "דיווח לרשם על תרומות שהתקבלו מגופים מדיניים זרים במהלך השנה.",
    type: "REPORT",
    category: "ANNUAL_OBLIGATIONS",
    month: 6, day: 30,
    legalBasis: "הנחיות הרשם — תרומות מישות מדינית זרה",
  },
  // ═══ מבקר ופיקוח ═══
  {
    name: "דוח ועדת ביקורת שנתי",
    description: "הכנת דוח ועדת הביקורת לאסיפה הכללית — סקירת פעולות הועד והכספים.",
    type: "REPORT",
    category: "GOVERNANCE",
    month: 4, day: 30,
    legalBasis: "סעיף 30 לחוק העמותות",
  },
  {
    name: "מינוי רואה חשבון מבקר",
    description: "וידוא מינוי רואה חשבון מבקר — חובה לעמותות מעל הסף השנתי הקבוע בחוק.",
    type: "DOCUMENT",
    category: "GOVERNANCE",
    month: 1, day: 31,
    legalBasis: "סעיף 19(ג) לחוק העמותות",
  },
  {
    name: "עדכון פרטי העמותה ברשם",
    description: "בדיקה שנתית ועדכון פרטי העמותה (כתובת, טלפון, דוא\"ל, נציג) ברשם העמותות.",
    type: "REGISTRATION",
    category: "ANNUAL_OBLIGATIONS",
    month: 1, day: 31,
    legalBasis: "הנחיות הרשם",
  },
  // ═══ כספי ותקציב ═══
  {
    name: "ביקורת פנימית — רבעון א׳",
    description: "ביקורת פנימית לסקירת ספרי החשבונות, ניהול התקציב, ותיעוד ההחלטות.",
    type: "DOCUMENT",
    category: "FINANCIAL_MGMT",
    month: 3, day: 31,
    legalBasis: "הנחיות הרשם — ניהול פנקסים",
  },
  {
    name: "ביקורת פנימית — רבעון ב׳",
    description: "ביקורת פנימית לסקירת ספרי החשבונות, ניהול התקציב, ותיעוד ההחלטות.",
    type: "DOCUMENT",
    category: "FINANCIAL_MGMT",
    month: 6, day: 30,
    legalBasis: "הנחיות הרשם — ניהול פנקסים",
  },
  {
    name: "ביקורת פנימית — רבעון ג׳",
    description: "ביקורת פנימית לסקירת ספרי החשבונות, ניהול התקציב, ותיעוד ההחלטות.",
    type: "DOCUMENT",
    category: "FINANCIAL_MGMT",
    month: 9, day: 30,
    legalBasis: "הנחיות הרשם — ניהול פנקסים",
  },
  {
    name: "ביקורת פנימית — רבעון ד׳",
    description: "ביקורת פנימית לסקירת ספרי החשבונות, ניהול התקציב, ותיעוד ההחלטות.",
    type: "DOCUMENT",
    category: "FINANCIAL_MGMT",
    month: 12, day: 15,
    legalBasis: "הנחיות הרשם — ניהול פנקסים",
  },
  {
    name: "בדיקת הוצאות הנהלה וכלליות",
    description: "בדיקה שיעור הוצאות ההנהלה והכלליות תקין ביחס לסך ההוצאות — לפני הגשת הדוח השנתי.",
    type: "DOCUMENT",
    category: "FINANCIAL_MGMT",
    month: 5, day: 15,
    legalBasis: "הנחיות הרשם — הוצאות הנהלה וכלליות",
  },
  // ═══ תשתיות ממשל ═══
  {
    name: "עדכון תקנון העמותה (אם נדרש)",
    description: "בדיקה אם נדרש עדכון תקנון — בכפוף להחלטת אסיפה כללית ורישום ברשם.",
    type: "DOCUMENT",
    category: "FOUNDING_DOCS",
    month: 2, day: 28,
    legalBasis: "סעיף 11 לחוק העמותות",
  },
  {
    name: "בחינת כהונת חברי ועד",
    description: "בדיקה שכהונת כל חברי הועד בתוקף — ובמידת הצורך קביעת בחירות.",
    type: "DOCUMENT",
    category: "GOVERNANCE",
    month: 3, day: 31,
    legalBasis: "סעיפים 19 ו-27 לחוק",
  },
  {
    name: "חידוש ביטוח אחריות נושאי משרה",
    description: "חידוש פוליסת ביטוח D&O לחברי ועד — אם קיימת.",
    type: "DOCUMENT",
    category: "INSURANCE",
    month: 1, day: 31,
    legalBasis: "פרקטיקה מומלצת",
  },
  {
    name: "עדכון ספר חברי העמותה",
    description: "עדכון ספר החברים — הוספת חברים חדשים, סימון חברים שפרשו, ווידוא עמידה בתנאי הקבלה.",
    type: "DOCUMENT",
    category: "GOVERNANCE",
    month: 4, day: 30,
    legalBasis: "סעיף 16 לחוק; הנחיות הרשם",
  },
  {
    name: "גיבוי מסמכי יסוד",
    description: "גיבוי שנתי של: תקנון, אישור ניהול תקין, פרוטוקולים, ומסמכי יסוד — בענן ובמשרד.",
    type: "DOCUMENT",
    category: "FOUNDING_DOCS",
    month: 12, day: 31,
    legalBasis: "הנחיות הרשם — ניהול פנקסים",
  },
  {
    name: "דוח שנתי למשרד הממשלתי התומך",
    description: "אם קיימת תמיכה ממשלתית — הגשת דוח ביצוע שנתי למשרד הרלוונטי.",
    type: "REPORT",
    category: "ANNUAL_OBLIGATIONS",
    month: 6, day: 30,
    legalBasis: "החלטות הממשלה; הנחיות הרשם",
  },
  {
    name: "דוח שנתי לרשות המקומית",
    description: "הגשת דוח ביצוע שנתי לעירייה/מועצה אזורית שתרמה תמיכה.",
    type: "REPORT",
    category: "ANNUAL_OBLIGATIONS",
    month: 5, day: 31,
    legalBasis: "הנחיות הרשם",
  },
  {
    name: "הצהרת ניגוד עניינים — ספקים",
    description: "בדיקה שנתית שאין ספקים הקשורים לחברי ועד ללא גילוי ואישור מתאים.",
    type: "DOCUMENT",
    category: "GOVERNANCE",
    month: 2, day: 28,
    legalBasis: "הנחיות הרשם — ניגוד עניינים",
  },
  {
    name: "בדיקת הרשאות גישה למערכות",
    description: "בדיקה שנתית של הרשאות גישה למערכות ניהול, בנק, ומסמכים — הסרת עובדים שעזבו.",
    type: "POLICY",
    category: "GOVERNANCE",
    month: 1, day: 15,
    legalBasis: "פרקטיקת אבטחת מידע מומלצת",
  },
  // ═══ העסקת קרובי משפחה (מהמסמך: קרובי משפחה בעמותה) ═══
  {
    name: "בדיקת העסקת קרובי משפחה בעמותה",
    description: "בדיקה שנתית: עד 1/3 מחברי הועד יכולים להיות קרובי משפחה. העסקת קרוב משפחה של חבר ועד מחייבת אישור הועד + תיעוד בפרוטוקול + שכר סביר.",
    type: "DOCUMENT",
    category: "EMPLOYEES_VOLUNTEERS",
    month: 2, day: 28,
    legalBasis: "סעיף 27א לחוק העמותות; הנחיות הרשם — קרבה משפחתית",
  },
  {
    name: "הצהרת קרבה משפחתית — חברי ועד",
    description: "קבלת הצהרות מכל חברי הועד על קיום/אי-קיום קרבה משפחתית בינם לבין עובדים, ספקים או נהנים של העמותה.",
    type: "DOCUMENT",
    category: "GOVERNANCE",
    month: 2, day: 28,
    legalBasis: "הנחיות הרשם — קרבה משפחתית וניגוד עניינים",
  },
  // ═══ פרוטוקולים (מהמסמך: פרוטוקולים בעמותה) ═══
  {
    name: "רישום פרוטוקולים לישיבות ועד — רבעון א׳",
    description: "תיעוד כל ישיבות הועד ברבעון: תאריך, משתתפים, סדר יום, החלטות שהתקבלו, תוצאות הצבעה. הפרוטוקול חייב להיחתם ע\"י יו\"ר הישיבה.",
    type: "DOCUMENT",
    category: "GOVERNANCE",
    month: 3, day: 31,
    legalBasis: "סעיף 28 לחוק העמותות; הנחיות הרשם — ניהול פרוטוקולים",
  },
  {
    name: "רישום פרוטוקולים לישיבות ועד — רבעון ב׳",
    description: "תיעוד כל ישיבות הועד ברבעון: תאריך, משתתפים, סדר יום, החלטות שהתקבלו, תוצאות הצבעה. הפרוטוקול חייב להיחתם ע\"י יו\"ר הישיבה.",
    type: "DOCUMENT",
    category: "GOVERNANCE",
    month: 6, day: 30,
    legalBasis: "סעיף 28 לחוק העמותות; הנחיות הרשם — ניהול פרוטוקולים",
  },
  {
    name: "רישום פרוטוקולים לישיבות ועד — רבעון ג׳",
    description: "תיעוד כל ישיבות הועד ברבעון: תאריך, משתתפים, סדר יום, החלטות שהתקבלו, תוצאות הצבעה. הפרוטוקול חייב להיחתם ע\"י יו\"ר הישיבה.",
    type: "DOCUMENT",
    category: "GOVERNANCE",
    month: 9, day: 30,
    legalBasis: "סעיף 28 לחוק העמותות; הנחיות הרשם — ניהול פרוטוקולים",
  },
  {
    name: "רישום פרוטוקולים לישיבות ועד — רבעון ד׳",
    description: "תיעוד כל ישיבות הועד ברבעון: תאריך, משתתפים, סדר יום, החלטות שהתקבלו, תוצאות הצבעה. הפרוטוקול חייב להיחתם ע\"י יו\"ר הישיבה.",
    type: "DOCUMENT",
    category: "GOVERNANCE",
    month: 12, day: 31,
    legalBasis: "סעיף 28 לחוק העמותות; הנחיות הרשם — ניהול פרוטוקולים",
  },
  // ═══ חשבון בנק ותקציב (מהמסמך: ניהול כספי) ═══
  {
    name: "חשבון בנק ייעודי לעמותה",
    description: "וידוא שלעמותה יש חשבון בנק נפרד על שמה — אסור לערבב כספי עמותה עם כספים אישיים.",
    type: "DOCUMENT",
    category: "FINANCIAL_MGMT",
    month: 1, day: 15,
    legalBasis: "הנחיות הרשם — פתיחת חשבון בנק; סעיף 38 לחוק",
  },
  // ═══ סעיף 46 — קבלות (מהמסמך: סעיף 46 לפקודת מס הכנסה) ═══
  {
    name: "הנפקת קבלות סעיף 46 לתורמים",
    description: "הנפקת קבלות תרומה לצורכי מס (זיכוי 35%) לכל תורם — חובה על עמותות בעלות אישור סעיף 46. הקבלה כוללת: שם תורם, סכום, תאריך, מספר סידורי.",
    type: "DOCUMENT",
    category: "TAX_APPROVALS",
    month: 3, day: 31,
    legalBasis: "סעיף 46 לפקודת מס הכנסה; תקנות מס הכנסה (קבלות)",
  },
  {
    name: "דוח שנתי על תרומות שהתקבלו — סעיף 46",
    description: "הגשת דוח מרוכז לרשות המסים על כל התרומות שהתקבלו ועל הקבלות שהונפקו — לפי סעיף 46.",
    type: "REPORT",
    category: "TAX_APPROVALS",
    month: 3, day: 31,
    legalBasis: "סעיף 46 לפקודת מס הכנסה; תקנות מס הכנסה",
  },
  {
    name: "דיווח דיגיטלי למערכת תרומות ישראל",
    description: "החל מ-1.1.2026, חובה לדווח דיגיטלית על כל תרומה שהתקבלה למערכת 'תרומות ישראל' של רשות המסים. תנאי לחידוש אישור סעיף 46. דיווח שוטף — מיידי עם קבלת/ביטול תרומה.",
    type: "REPORT",
    category: "TAX_APPROVALS",
    month: 1, day: 31,
    legalBasis: "סעיף 46 לפקודת מס הכנסה; חוזר מס הכנסה — דיווח תרומות דיגיטלי 2026",
  },
  // ═══ רישום ומעמד (מהמסמך: מילון מונחים) ═══
  {
    name: "בדיקת רישום כמלכ\"ר ברשות המסים",
    description: "וידוא שהעמותה רשומה כמוסד ללא כוונת רווח (מלכ\"ר) ברשות המסים — משליך על חיוב מע\"מ וביטוח לאומי.",
    type: "REGISTRATION",
    category: "TAX_APPROVALS",
    month: 1, day: 31,
    legalBasis: "סעיף 1 לחוק מס ערך מוסף; הנחיות רשות המסים",
  },
  // ═══ גילוי נאות (מהמסמך: ניגוד עניינים) ═══
  {
    name: "נוהל גילוי נאות — עסקאות עם בעלי עניין",
    description: "בדיקה ותיעוד שכל עסקה עם בעל עניין (חבר ועד, קרוב משפחה, חברה קשורה) אושרה בפרוטוקול ועד עם גילוי נאות מלא.",
    type: "POLICY",
    category: "GOVERNANCE",
    month: 6, day: 30,
    legalBasis: "הנחיות הרשם — ניגוד עניינים; סעיף 27א לחוק",
  },
  // ═══ ביטוח (מהמסמך: ביטוח) ═══
  {
    name: "ביטוח מתנדבים — חידוש שנתי",
    description: "חידוש ביטוח למתנדבים — חובה חוקית לפי חוק הביטוח הלאומי. כולל ביטוח תאונות ואחריות צד ג׳.",
    type: "DOCUMENT",
    category: "INSURANCE",
    month: 1, day: 31,
    legalBasis: "חוק הביטוח הלאומי, פרק י\"ג — מתנדבים",
  },
  {
    name: "ביטוח רכוש ותכולה של העמותה",
    description: "חידוש/בדיקת ביטוח רכוש — משרד, ציוד, מחשבים — כולל ביטוח צד שלישי לאירועים.",
    type: "DOCUMENT",
    category: "INSURANCE",
    month: 1, day: 31,
    legalBasis: "פרקטיקה מומלצת; דרישת רשם העמותות",
  },
  // ═══ תגמול ושכר (מהמסמך: תגמול חברי ועד) ═══
  {
    name: "אישור תנאי גמול חברי ועד באסיפה",
    description: "אישור שנתי באסיפה הכללית של תנאי הגמול לחברי הועד — על פי תקנות הגמול (שלוש דרגות): השתתפות, אובדן שעות, או גמול קבוע.",
    type: "DOCUMENT",
    category: "GOVERNANCE",
    month: 5, day: 31,
    legalBasis: "תקנות העמותות (גמול ליושב ראש ועד, לחבר ועד ולחבר ועדת ביקורת), תשס\"ט-2009",
  },
  // ═══ ביקורת (מהמסמך: ביקורת בעמותה) ═══
  {
    name: "ביקורת חיצונית — רואה חשבון",
    description: "ביצוע ביקורת שנתית ע\"י רואה חשבון חיצוני — חובה לעמותות עם מחזור הכנסות מעל 1,170,000 ₪ או שמקבלות תמיכה ממשלתית.",
    type: "DOCUMENT",
    category: "FINANCIAL_MGMT",
    month: 5, day: 15,
    legalBasis: "סעיף 19(ג) לחוק העמותות; תקנות רואי חשבון",
  },
];

/**
 * Seed regulatory calendar for a new organization.
 * Creates ComplianceItem records for all Israeli NGO annual deadlines.
 */
export async function seedRegulatoryCalendar(organizationId: string, { clearExisting = false } = {}): Promise<number> {
  const now = new Date();
  const currentYear = now.getFullYear();

  if (clearExisting) {
    await prisma.complianceItem.deleteMany({ where: { organizationId } });
  }

  let created = 0;

  for (const item of ANNUAL_ITEMS) {

    // Calculate this year's deadline
    let dueDate = new Date(currentYear, item.month - 1, item.day);

    // If the deadline already passed this year, set it for next year
    if (dueDate < now) {
      dueDate = new Date(currentYear + 1, item.month - 1, item.day);
    }

    // Determine initial status
    const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const status: SchemaComplianceStatus =
      daysUntil <= 0 ? "EXPIRED" : daysUntil <= 30 ? "WARNING" : "MISSING";

    await prisma.complianceItem.create({
      data: {
        organizationId,
        name: item.name,
        description: item.description,
        type: item.type,
        category: item.category,
        dueDate,
        legalBasis: item.legalBasis,
        status,
        isRequired: true,
      },
    });

    created++;
  }

  console.log(`[regulatory-calendar] Seeded ${created} items for org ${organizationId}`);
  return created;
}

export { ANNUAL_ITEMS };
