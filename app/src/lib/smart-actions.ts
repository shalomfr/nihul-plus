export type ComplianceItem = {
  id: string;
  name: string;
  type?: string;
  category: string;
  status: string;
  description?: string;
  dueDate?: string | null;
  completedAt?: string;
  frequency?: string;
  isRequired?: boolean;
};

export type SmartActionDef = {
  label: string;
  description: string;
  icon: "mail" | "upload" | "users" | "bank" | "phone" | "docs" | "zap";
  href?: string;
  emailTemplate?: string;
};

export type SmartActionsConfig = {
  headline: string;
  tip: string;
  actions: SmartActionDef[];
};

export const CATEGORY_LABELS: Record<string, string> = {
  FOUNDING_DOCS: "מסמכי יסוד",
  ANNUAL_OBLIGATIONS: "חובות שנתיות לרשם",
  TAX_APPROVALS: "אישורים מרשות המסים",
  FINANCIAL_MGMT: "ניהול כספי שוטף",
  DISTRIBUTION_DOCS: "תיעוד חלוקת כספים",
  GOVERNANCE: "ממשל ופרוטוקולים",
  EMPLOYEES_VOLUNTEERS: "עובדים ומתנדבים",
  INSURANCE: "ביטוח",
  GEMACH: "גמ\"ח כספים",
};

export function getSmartActions(item: ComplianceItem): SmartActionsConfig {
  switch (item.category) {
    case "ANNUAL_OBLIGATIONS":
      return {
        headline: "חובה שנתית לרשם העמותות",
        tip: "שלח מייל מקצועי לרשם עם תבנית מוכנה, או טפל ישירות דרך הגשה מקוונת.",
        actions: [
          { label: "📧 שלח בקשת ארכה לרשם", description: "מייל מקצועי מוכן לשליחה", icon: "mail", href: "/portal/institutions?email=registrar_extension_request" },
          { label: "📤 הגש מסמכים לרשם", description: "שלח מסמכים שהתבקשו", icon: "mail", href: "/portal/institutions?email=registrar_document_submission" },
          { label: "📁 העלה מסמך לתיק", description: "שמור עותק מקומי", icon: "upload", href: "/portal/documents" },
        ],
      };

    case "TAX_APPROVALS":
      return {
        headline: "אישורי מס — סעיף 46, מלכ\"ר, קבלות",
        tip: "סעיף 46 מאפשר לתורמים זיכוי ממס של 35% (מינימום 207 ₪, תקרה 10,354,816 ₪). חידוש עד 31.8 בשנה שפג התוקף. החל מ-2026 חובה דיווח דיגיטלי במערכת 'תרומות ישראל'.",
        actions: [
          { label: "📧 בקש חידוש סעיף 46", description: "מייל לרשות המסים", icon: "mail", href: "/portal/institutions?email=tax_section46_renewal" },
          { label: "🧾 הנפק קבלות תרומה", description: "קבלות סעיף 46 לתורמים", icon: "docs", href: "/portal/invoices" },
          { label: "📊 דוח תרומה מישות זרה", description: "אם רלוונטי לארגונך", icon: "mail", href: "/portal/institutions?email=tax_foreign_donation_report" },
          { label: "📁 העלה אישור מרשות", description: "אחרי קבלת האישור", icon: "upload", href: "/portal/documents" },
        ],
      };

    case "FOUNDING_DOCS":
      return {
        headline: "מסמך יסוד חסר",
        tip: "יש להעלות את המסמך לתיק העמותה כדי שיהיה נגיש בכל עת.",
        actions: [
          { label: "📤 העלה מסמך עכשיו", description: "הוסף לתיק הדיגיטלי", icon: "upload", href: "/portal/documents" },
          { label: "📋 תיק העמותה המלא", description: "צפה בכל המסמכים", icon: "docs", href: "/portal/org-file" },
        ],
      };

    case "FINANCIAL_MGMT":
      return {
        headline: "פעולה בנקאית / כספית נדרשת",
        tip: "עבור לדף הבנק לביצוע הפעולה הנדרשת, או ייצא דוח לרואה החשבון.",
        actions: [
          { label: "🏦 פתח דף בנק", description: "ניהול חשבונות והוצאות", icon: "bank", href: "/portal/banking" },
          { label: "🧮 דף רואה חשבון", description: "ייצוא ודוחות כספיים", icon: "docs", href: "/portal/accountant" },
        ],
      };

    case "DISTRIBUTION_DOCS":
      return {
        headline: "תיעוד חלוקת כספים חסר",
        tip: "יש לתעד כל חלוקת כספים לפי דרישות רשם העמותות — פרוטוקול החלטה + חשבונית.",
        actions: [
          { label: "📁 העלה תיעוד", description: "חשבונית / פרוטוקול", icon: "upload", href: "/portal/documents" },
          { label: "👥 הוסף פרוטוקול ועד", description: "ועד מנהל — ממשל", icon: "users", href: "/portal/board" },
        ],
      };

    case "GOVERNANCE":
      return {
        headline: "ממשל תקין — פרוטוקולים, ועד וביקורת",
        tip: "כל ישיבת ועד חייבת פרוטוקול חתום הכולל: תאריך, משתתפים, סדר יום, תוצאות הצבעה, והחלטות. פרוטוקול שלא נחתם — לא תקף.",
        actions: [
          { label: "👥 זמן ישיבת ועד", description: "שלח הזמנה לחברי הועד", icon: "users", href: "/portal/board" },
          { label: "📁 הוסף פרוטוקול", description: "העלה פרוטוקול חתום", icon: "upload", href: "/portal/documents" },
          { label: "📋 הצהרת ניגוד עניינים", description: "טופס הצהרה לחבר ועד", icon: "docs", href: "/portal/documents" },
          { label: "📅 תאם בלוח שנה", description: "הוסף ישיבה ליומן", icon: "docs", href: "/portal/calendar" },
        ],
      };

    case "EMPLOYEES_VOLUNTEERS":
      return {
        headline: "עובדים, מתנדבים וקרובי משפחה",
        tip: "בדוק את העסקת קרובי משפחה (עד 1/3 מהועד יכולים להיות קרובים). כל העסקת קרוב משפחה של חבר ועד מחייבת אישור מיוחד בפרוטוקול + שכר סביר.",
        actions: [
          { label: "📋 בדוק קרובי משפחה", description: "בדיקת העסקת קרובים בעמותה", icon: "users", href: "/portal/board" },
          { label: "📁 העלה הצהרת קרבה", description: "הצהרה חתומה מחבר ועד", icon: "upload", href: "/portal/documents" },
          { label: "📁 העלה חוזה עבודה", description: "חוזה עובד / מתנדב", icon: "upload", href: "/portal/documents" },
          { label: "📧 שלח לרשם", description: "הגשת מסמכים לרשם", icon: "mail", href: "/portal/institutions?email=registrar_document_submission" },
        ],
      };

    case "INSURANCE":
      return {
        headline: "כיסוי ביטוחי נדרש",
        tip: "ביטוח מתנדבים הוא חובה חוקית. כמו כן מומלץ ביטוח D&O לחברי ועד, ביטוח רכוש, וביטוח צד שלישי לאירועים.",
        actions: [
          { label: "📞 פנה למלווה", description: "קבל הכוונה מהמלווה שלך", icon: "phone", href: "/portal/contact" },
          { label: "📁 העלה פוליסה", description: "ביטוח מתנדבים / D&O / רכוש", icon: "upload", href: "/portal/documents" },
          { label: "📞 בקש הצעת מחיר", description: "פנה לסוכן ביטוח", icon: "phone", href: "/portal/contact" },
        ],
      };

    case "GEMACH":
      return {
        headline: "מסמך גמ\"ח חסר",
        tip: "פעילות גמ\"ח מחייבת תיעוד מיוחד לפי הנחיות רשם העמותות.",
        actions: [
          { label: "📁 העלה מסמך גמ\"ח", description: "הסכם / נוהל גמ\"ח", icon: "upload", href: "/portal/documents" },
          { label: "📧 הגש לרשם", description: "שלח עדכון לרשם", icon: "mail", href: "/portal/institutions?email=registrar_document_submission" },
        ],
      };

    default:
      return {
        headline: "דרוש טיפול",
        tip: item.description ?? "יש לטפל בפריט זה בהקדם.",
        actions: [
          { label: "📁 העלה מסמך", description: "הוסף לתיק הדיגיטלי", icon: "upload", href: "/portal/documents" },
          { label: "📧 שלח מייל לרשם", description: "פנה לרשות הרלוונטית", icon: "mail", href: "/portal/institutions" },
        ],
      };
  }
}
