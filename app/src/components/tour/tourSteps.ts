export type TourStepType = "welcome" | "highlight" | "completion" | "chapter-intro";
export type TourPosition = "bottom" | "top" | "left" | "right" | "bottom-left" | "bottom-right" | "top-left" | "top-right";

export interface TourStep {
  id: string;
  type: TourStepType;
  target?: string; // data-tour attribute value
  title: string;
  description: string;
  position?: TourPosition;
  mobileSkip?: boolean;
  page?: string;        // route path for multi-page navigation
  chapter?: string;     // chapter key for grouping
  icon?: string;        // emoji for chapter-intro cards
}

export interface TourChapter {
  key: string;
  title: string;
  icon: string;
  startIndex: number;
  stepCount: number;
}

// ========================================
// FULL PORTAL TOUR — 11 chapters, ~85 steps
// ========================================

export const portalTourSteps: TourStep[] = [

  // ── Chapter 1: Welcome ──
  {
    id: "welcome",
    type: "welcome",
    chapter: "welcome",
    title: "!ברוכים הבאים למעטפת",
    description: "המערכת שתעזור לכם לנהל את העמותה בצורה תקינה ומסודרת. בואו נכיר את כל הכלים — צעד אחר צעד.",
    icon: "👋",
    page: "/portal",
  },
  {
    id: "portal-sidebar",
    type: "highlight",
    chapter: "welcome",
    target: "portal-sidebar",
    title: "תפריט הניווט",
    description: "מכאן תוכלו לנווט בין כל חלקי המערכת — ניהול תקין, מסמכים, ועד, בנק, דוחות ועוד. תמיד זמין בצד ימין.",
    position: "left",
    mobileSkip: true,
    page: "/portal",
  },

  // ── Chapter 2: Dashboard ──
  {
    id: "chapter-dashboard",
    type: "chapter-intro",
    chapter: "dashboard",
    title: "הדשבורד שלי",
    description: "נתחיל מדף הבית — כאן תראו את כל המידע החשוב במבט אחד: ציון ציות, כספים, ופעילות.",
    icon: "🏠",
    page: "/portal",
  },
  {
    id: "dashboard-compliance-card",
    type: "highlight",
    chapter: "dashboard",
    target: "dashboard-compliance-card",
    title: "כרטיס ציות",
    description: "הציון הכללי של העמותה — ירוק זה מצוין, כתום דורש תשומת לב, אדום דורש טיפול מיידי.",
    position: "bottom",
    page: "/portal",
  },
  {
    id: "dashboard-financial-card",
    type: "highlight",
    chapter: "dashboard",
    target: "dashboard-financial-card",
    title: "סיכום כספי",
    description: "סך התרומות, הוצאות ויתרות — תמונה מהירה של המצב הפיננסי של העמותה.",
    position: "bottom",
    page: "/portal",
  },
  {
    id: "dashboard-alerts",
    type: "highlight",
    chapter: "dashboard",
    target: "dashboard-alerts",
    title: "התראות ומשימות דחופות",
    description: "פריטים שדורשים טיפול מופיעים כאן — ניתן לטפל בהם ישירות מהדשבורד בלחיצה אחת.",
    position: "top",
    page: "/portal",
  },
  {
    id: "dashboard-quick-actions",
    type: "highlight",
    chapter: "dashboard",
    target: "dashboard-quick-actions",
    title: "גישה מהירה",
    description: "12 כפתורים צבעוניים לכל חלקי המערכת — מסמכים, בנק, דוחות, הגדרות ועוד. קיצור הדרך שלכם.",
    position: "top",
    page: "/portal",
  },

  // ── Chapter 3: Compliance & Status ──
  {
    id: "chapter-status",
    type: "chapter-intro",
    chapter: "status",
    title: "ניהול תקין וציות",
    description: "הלב של המערכת — כאן תוכלו לראות את מצב הציות של העמותה בכל קטגוריה ולטפל בפריטים חסרים.",
    icon: "✅",
    page: "/portal/status",
  },
  {
    id: "status-score",
    type: "highlight",
    chapter: "status",
    target: "status-score",
    title: "ציון ציות כללי",
    description: "הציון המרכזי שמסכם את מצב הניהול התקין — אחוז מתוך 100, עם פירוט כמה פריטים תקינים וכמה דורשים טיפול.",
    position: "bottom",
    page: "/portal/status",
  },
  {
    id: "status-categories",
    type: "highlight",
    chapter: "status",
    target: "status-categories",
    title: "קטגוריות ציות",
    description: "כל קטגוריה — מסמכי ייסוד, כספי, מס, ממשל תקין — מוצגת עם ציון משלה. לחצו על קטגוריה כדי לראות פרטים.",
    position: "bottom",
    page: "/portal/status",
  },
  {
    id: "status-filters",
    type: "highlight",
    chapter: "status",
    target: "status-filters",
    title: "סינון וחיפוש",
    description: "סננו לפי סטטוס — הכל, דורשים טיפול, או הושלמו. אפשר גם לחפש פריט ספציפי לפי שם.",
    position: "bottom",
    page: "/portal/status",
  },
  {
    id: "status-accordion",
    type: "highlight",
    chapter: "status",
    target: "status-accordion",
    title: "פרטי פריטים",
    description: "כל קטגוריה נפתחת לרשימת פריטים עם סטטוס, תיאור, ואפשרות לטפל מיידית בכל פריט חסר או פג תוקף.",
    position: "top",
    page: "/portal/status",
  },

  // ── Chapter 4: Calendar ──
  {
    id: "chapter-calendar",
    type: "chapter-intro",
    chapter: "calendar",
    title: "לוח שנה ומועדים",
    description: "לעולם לא תפספסו מועד הגשה או ישיבה — הכל מסודר בלוח שנה אחד עם התראות צבעוניות.",
    icon: "📅",
    page: "/portal/calendar",
  },
  {
    id: "calendar-mini",
    type: "highlight",
    chapter: "calendar",
    target: "calendar-mini",
    title: "לוח חודשי",
    description: "לוח שנה חודשי עם סימונים על ימים שיש בהם אירועים. נווטו בין חודשים עם החצים.",
    position: "bottom",
    page: "/portal/calendar",
  },
  {
    id: "calendar-events",
    type: "highlight",
    chapter: "calendar",
    target: "calendar-events",
    title: "רשימת אירועים",
    description: "כל האירועים הקרובים — ישיבות, מועדי הגשה, תוקף מסמכים — ממוינים לפי תאריך עם צבעי דחיפות.",
    position: "top",
    page: "/portal/calendar",
  },

  // ── Chapter 5: Documents ──
  {
    id: "chapter-documents",
    type: "chapter-intro",
    chapter: "documents",
    title: "ספריית מסמכים",
    description: "כל המסמכים של העמותה במקום אחד — תקנון, אישורים, פרוטוקולים ועוד. העלו, חפשו והורידו בקלות.",
    icon: "📄",
    page: "/portal/documents",
  },
  {
    id: "documents-search",
    type: "highlight",
    chapter: "documents",
    target: "documents-search",
    title: "חיפוש והעלאה",
    description: "חפשו מסמך לפי שם, או לחצו \"העלה מסמך\" כדי להוסיף קובץ חדש עם שם וקטגוריה.",
    position: "bottom",
    page: "/portal/documents",
  },
  {
    id: "documents-tabs",
    type: "highlight",
    chapter: "documents",
    target: "documents-tabs",
    title: "סינון לפי קטגוריה",
    description: "סננו את המסמכים לפי קטגוריה — מסמכי ייסוד, כספי, ציות, ועד או כללי.",
    position: "bottom",
    page: "/portal/documents",
  },
  {
    id: "documents-list",
    type: "highlight",
    chapter: "documents",
    target: "documents-list",
    title: "רשימת מסמכים",
    description: "כל המסמכים מוצגים כאן עם סוג הקובץ, קטגוריה ותאריך. לחצו על אייקון ההורדה לצפייה בקובץ.",
    position: "top",
    page: "/portal/documents",
  },

  // ── Chapter 6: Board Management ──
  {
    id: "chapter-board",
    type: "chapter-intro",
    chapter: "board",
    title: "הועד שלי",
    description: "ניהול חברי ועד, ישיבות, פרוטוקולים והחלטות — הכל במקום אחד. כולל יצירת פרוטוקולים עם AI.",
    icon: "👥",
    page: "/portal/board",
  },
  {
    id: "board-members",
    type: "highlight",
    chapter: "board",
    target: "board-members",
    title: "חברי ועד",
    description: "רשימת חברי הועד הפעילים עם שם, תפקיד וטלפון. לחצו \"הוסף חבר ועד\" כדי להוסיף חדש.",
    position: "bottom",
    page: "/portal/board",
  },
  {
    id: "board-next-meeting",
    type: "highlight",
    chapter: "board",
    target: "board-next-meeting",
    title: "הישיבה הבאה",
    description: "פרטי הישיבה הבאה — תאריך, שעה, מיקום, סדר יום והצבעות. אפשר גם לקבוע ישיבה חדשה.",
    position: "bottom",
    page: "/portal/board",
  },
  {
    id: "board-stats",
    type: "highlight",
    chapter: "board",
    target: "board-stats",
    title: "סטטיסטיקות ישיבות",
    description: "כמה ישיבות התקיימו וכמה אחוז מהפרוטוקולים אושרו — מדד חשוב לניהול תקין.",
    position: "bottom",
    page: "/portal/board",
  },
  {
    id: "board-past-meetings",
    type: "highlight",
    chapter: "board",
    target: "board-past-meetings",
    title: "ישיבות אחרונות + פרוטוקולים",
    description: "היסטוריית ישיבות עם אפשרות הורדת פרוטוקול. לחצו \"צור פרוטוקול\" ליצירה חכמה עם AI.",
    position: "top",
    page: "/portal/board",
  },
  {
    id: "board-protocol",
    type: "highlight",
    chapter: "board",
    target: "board-protocol",
    title: "יצירת פרוטוקול עם AI",
    description: "שאלון חכם שמנחה אתכם — עונים על שאלות פשוטות ומקבלים פרוטוקול רשמי מוכן להדפסה.",
    position: "bottom",
    page: "/portal/board/protocol",
  },

  // ── Chapter 7: Banking & Finance ──
  {
    id: "chapter-banking",
    type: "chapter-intro",
    chapter: "banking",
    title: "בנק וכספים",
    description: "חיבור לחשבון הבנק, צפייה בתנועות, ביצוע העברות ובקרת הוצאות — הכל ממקום אחד.",
    icon: "🏦",
    page: "/portal/banking",
  },
  {
    id: "banking-accounts",
    type: "highlight",
    chapter: "banking",
    target: "banking-accounts",
    title: "חשבונות בנק",
    description: "כל חשבונות הבנק המחוברים עם יתרות עדכניות. לחצו על חשבון כדי לראות את התנועות שלו.",
    position: "bottom",
    page: "/portal/banking",
  },
  {
    id: "banking-transactions",
    type: "highlight",
    chapter: "banking",
    target: "banking-transactions",
    title: "תנועות בנק",
    description: "רשימת כל התנועות — הכנסות והוצאות — עם סינון לפי תאריך, סכום וקטגוריה.",
    position: "top",
    page: "/portal/banking",
  },
  {
    id: "banking-transfers",
    type: "highlight",
    chapter: "banking",
    target: "banking-transfers",
    title: "העברות בנקאיות",
    description: "ביצוע העברות בנקאיות ישירות מהמערכת — עם אישור דו-שלבי ומעקב סטטוס.",
    position: "top",
    page: "/portal/banking",
  },
  {
    id: "bank-sync-connections",
    type: "highlight",
    chapter: "banking",
    target: "bank-sync-connections",
    title: "סנכרון בנק",
    description: "חברו חשבון בנק חדש או סנכרנו תנועות קיימות. הנתונים מוצפנים בהצפנת AES-256.",
    position: "bottom",
    page: "/portal/bank-sync",
  },

  // ── Chapter 8: Reports & Budget ──
  {
    id: "chapter-reports",
    type: "chapter-intro",
    chapter: "reports",
    title: "דוחות ותקציב",
    description: "דוחות כספיים, תקציבים עם מעקב ביצוע, ורשימת תרומות — עם אפשרות ייצוא ל-CSV.",
    icon: "📊",
    page: "/portal/reports",
  },
  {
    id: "reports-export",
    type: "highlight",
    chapter: "reports",
    target: "reports-export",
    title: "ייצוא דוחות",
    description: "הורידו את כל הנתונים כקובץ CSV לשימוש ב-Excel או העברה לרואה חשבון.",
    position: "bottom",
    page: "/portal/reports",
  },
  {
    id: "reports-budgets",
    type: "highlight",
    chapter: "reports",
    target: "reports-budgets",
    title: "תקציבים ומעקב ביצוע",
    description: "כל תקציב מוצג עם פס התקדמות — כמה תוקצב, כמה נוצל, ופירוט לפי סעיפים.",
    position: "bottom",
    page: "/portal/reports",
  },
  {
    id: "reports-donations",
    type: "highlight",
    chapter: "reports",
    target: "reports-donations",
    title: "תרומות אחרונות",
    description: "רשימת התרומות האחרונות עם שם תורם, סכום, תאריך ואמצעי תשלום.",
    position: "top",
    page: "/portal/reports",
  },

  // ── Chapter 9: Invoices & Accountant ──
  {
    id: "chapter-invoices",
    type: "chapter-intro",
    chapter: "invoices",
    title: "חשבוניות ורואה חשבון",
    description: "סריקת חשבוניות עם OCR, קישור להוצאות, ודשבורד מלא לרואה חשבון עם ייצוא.",
    icon: "🧾",
    page: "/portal/invoices",
  },
  {
    id: "invoices-actions",
    type: "highlight",
    chapter: "invoices",
    target: "invoices-actions",
    title: "סריקה וקישור חשבוניות",
    description: "סרקו חשבונית — המערכת תזהה אוטומטית סכום, ספק ותאריך. אפשר גם לקשר חשבונית להוצאה קיימת.",
    position: "bottom",
    page: "/portal/invoices",
  },
  {
    id: "invoices-list",
    type: "highlight",
    chapter: "invoices",
    target: "invoices-list",
    title: "רשימת הוצאות",
    description: "כל ההוצאות עם סטטוס חשבונית — ירוק אם מצורפת, כתום אם חסרה. אפשר לסנן ולחפש.",
    position: "top",
    page: "/portal/invoices",
  },
  {
    id: "accountant-period",
    type: "highlight",
    chapter: "invoices",
    target: "accountant-period",
    title: "בחירת תקופה",
    description: "בחרו תקופה — חודש, רבעון, שנה, או טווח מותאם אישית. כל הנתונים מתעדכנים בהתאם.",
    position: "bottom",
    page: "/portal/accountant",
  },
  {
    id: "accountant-summary",
    type: "highlight",
    chapter: "invoices",
    target: "accountant-summary",
    title: "סיכום לרואה חשבון",
    description: "כל הנתונים שרואה חשבון צריך — הכנסות, הוצאות, יתרות, חשבוניות חסרות, ואפשרות ייצוא.",
    position: "top",
    page: "/portal/accountant",
  },

  // ── Chapter 10: Organization & Governance ──
  {
    id: "chapter-org",
    type: "chapter-intro",
    chapter: "org",
    title: "ארגון ומוסדות",
    description: "תיק העמותה, מוסדות (ועד, ועדת ביקורת, אסיפה), נהלים ותקשורת עם רשויות.",
    icon: "🏛️",
    page: "/portal/org-file",
  },
  {
    id: "org-file-items",
    type: "highlight",
    chapter: "org",
    target: "org-file-items",
    title: "תיק עמותה",
    description: "7 מסמכים רגולטוריים חיוניים — תעודת רישום, ניהול תקין, פטור ממס ועוד. כל אחד עם סטטוס וטיפול.",
    position: "bottom",
    page: "/portal/org-file",
  },
  {
    id: "institutions-bodies",
    type: "highlight",
    chapter: "org",
    target: "institutions-bodies",
    title: "מוסדות העמותה",
    description: "ועד מנהל, ועדת ביקורת ואסיפה כללית — מספר חברים וגישה לניהול מלא.",
    position: "bottom",
    page: "/portal/institutions",
  },
  {
    id: "institutions-email-bot",
    type: "highlight",
    chapter: "org",
    target: "institutions-email-bot",
    title: "בוט דוא\"ל לרשויות",
    description: "שלחו מיילים מקצועיים לרשם העמותות, רשות המסים ועוד — בחרו תבנית, ערכו ושלחו.",
    position: "top",
    page: "/portal/institutions",
  },
  {
    id: "procedures-list",
    type: "highlight",
    chapter: "org",
    target: "procedures-list",
    title: "נהלים",
    description: "נהלי העמותה — ניהול כספים, ניגוד עניינים, מדיניות התרמה. כל נוהל עם סטטוס אישור ותיעוד.",
    position: "bottom",
    page: "/portal/procedures",
  },

  // ── Chapter 11: Settings & Automations ──
  {
    id: "chapter-settings",
    type: "chapter-intro",
    chapter: "settings",
    title: "הגדרות ואוטומציות",
    description: "חיבור WhatsApp, תבניות מייל, אוטומציות חכמות, קשר עם יועץ ופנייה למלווה.",
    icon: "⚙️",
    page: "/portal/automations",
  },
  {
    id: "automations-cards",
    type: "highlight",
    chapter: "settings",
    target: "automations-cards",
    title: "אוטומציות",
    description: "6 פעולות אוטומטיות — בדיקת ציות, סנכרון בנק, שליחת תזכורות ועוד. הפעילו בלחיצה אחת.",
    position: "bottom",
    page: "/portal/automations",
  },
  {
    id: "settings-whatsapp",
    type: "highlight",
    chapter: "settings",
    target: "settings-whatsapp",
    title: "חיבור WhatsApp",
    description: "חברו את מספר ה-WhatsApp שלכם כדי לקבל התראות ועדכונים ישירות לטלפון.",
    position: "bottom",
    page: "/portal/settings",
  },
  {
    id: "settings-email-templates",
    type: "highlight",
    chapter: "settings",
    target: "settings-email-templates",
    title: "תבניות מייל",
    description: "התאימו את כתובות המייל של הרשויות — רשם העמותות, רשות המסים ועוד. המערכת שולחת בשמכם.",
    position: "top",
    page: "/portal/settings",
  },
  {
    id: "advisor-contact",
    type: "highlight",
    chapter: "settings",
    target: "advisor-contact",
    title: "יעוץ ותמיכה",
    description: "פרטי היועץ האישי שלכם — טלפון, WhatsApp ומייל. אפשר גם לשלוח הודעה ישירה.",
    position: "bottom",
    page: "/portal/advisor",
  },
  {
    id: "contact-form",
    type: "highlight",
    chapter: "settings",
    target: "contact-form",
    title: "פנייה למלווה",
    description: "שלחו הודעה למלווה שלכם — בחרו נושא, כתבו את ההודעה, ותקבלו מענה. כל ההיסטוריה נשמרת.",
    position: "bottom",
    page: "/portal/contact",
  },

  // ── Completion ──
  {
    id: "completion",
    type: "completion",
    chapter: "completion",
    title: "סיימתם את הסיור!",
    description: "עכשיו אתם מכירים את כל הכלים של מעטפת. תוכלו תמיד להפעיל את הסיור מחדש מתפריט הניווט, או לבחור סיור ממוקד לדף ספציפי.",
  },
];

// ── Helper: extract chapter metadata ──
export function extractChapters(steps: TourStep[]): TourChapter[] {
  const chapters: TourChapter[] = [];
  let currentChapter: string | null = null;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (step.chapter && step.chapter !== currentChapter) {
      currentChapter = step.chapter;
      const chapterSteps = steps.filter(s => s.chapter === currentChapter);
      const introStep = chapterSteps.find(s => s.type === "chapter-intro" || s.type === "welcome");
      chapters.push({
        key: currentChapter,
        title: introStep?.title ?? currentChapter,
        icon: introStep?.icon ?? "",
        startIndex: i,
        stepCount: chapterSteps.length,
      });
    }
  }

  return chapters;
}

// ── Admin tour (unchanged) ──
export const adminTourSteps: TourStep[] = [
  {
    id: "welcome",
    type: "welcome",
    title: "!ברוכים הבאים לפאנל הניהול",
    description: "כאן תנהלו ארגונים, משתמשים, אינטגרציות ואוטומציות. בואו נסתכל על הכלים העיקריים.",
  },
  {
    id: "admin-sidebar",
    type: "highlight",
    target: "admin-sidebar",
    title: "תפריט ניהול",
    description: "גישה מהירה לכל מודולי הניהול — ארגונים, משתמשים, אוטומציות, דוחות ואינטגרציות.",
    position: "left",
    mobileSkip: true,
  },
  {
    id: "admin-stats",
    type: "highlight",
    target: "admin-stats",
    title: "סקירה כללית",
    description: "מספר ארגונים רשומים, משתמשים פעילים, בקשות ממתינות ואוטומציות — הכל במבט אחד.",
    position: "bottom",
  },
  {
    id: "admin-orgs",
    type: "highlight",
    target: "admin-orgs",
    title: "ניהול ארגונים",
    description: "רשימת הארגונים הרשומים עם הסטטוס שלהם, ניתן ללחוץ על ארגון לצפייה בפרטים.",
    position: "top",
  },
  {
    id: "admin-quicklinks",
    type: "highlight",
    target: "admin-quicklinks",
    title: "קישורים מהירים",
    description: "גישה מהירה לפעולות נפוצות — אישור בקשות, הוספת ארגון, הגדרת אוטומציות.",
    position: "top",
  },
  {
    id: "completion",
    type: "completion",
    title: "!מוכנים להתחיל",
    description: "עכשיו אתם מכירים את פאנל הניהול. תוכלו תמיד להפעיל את הסיור מחדש מהתפריט.",
  },
];
