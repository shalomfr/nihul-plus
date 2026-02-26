/**
 * Pre-built automation workflow templates for Israeli NGOs.
 * These are seeded into the DB as ACTIVE workflows for new organizations.
 * 20 templates total (10 original + 10 new).
 */

export type TriggerType =
  | "donation.created"
  | "meeting.ended"
  | "transaction.created"
  | "SCHEDULED_DAILY"
  | "SCHEDULED_WEEKLY"
  | "SCHEDULED_MONTHLY"
  | "SCHEDULED_QUARTERLY"
  | "SCHEDULED_ANNUALLY"
  | "compliance.overdue"
  | "transfer.created"
  | "transfer.approved"
  | "transfer.rejected"
  | "donor.inactive";

export type ActionType =
  | "SEND_EMAIL"
  | "SEND_NOTIFICATION"
  | "CREATE_DOCUMENT"
  | "UPDATE_RECORD"
  | "WEBHOOK";

export interface WorkflowStepTemplate {
  order: number;
  actionType: ActionType;
  actionConfig: Record<string, unknown>;
  conditionConfig?: Record<string, unknown>;
}

export interface WorkflowTemplate {
  name: string;
  description: string;
  triggerType: TriggerType;
  triggerConfig: Record<string, unknown>;
  steps: WorkflowStepTemplate[];
  category: "donations" | "board" | "compliance" | "banking" | "volunteers" | "reporting";
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // ─── 1. קבלה אוטומטית לתרומה ─────────────────────────────────────────
  {
    name: "קבלה אוטומטית לתרומה",
    description: "שולח קבלה בדוא\"ל לתורם מיד עם קבלת תרומה",
    triggerType: "donation.created",
    triggerConfig: {},
    category: "donations",
    steps: [
      {
        order: 1,
        actionType: "SEND_EMAIL",
        actionConfig: {
          template: "donation_receipt",
          to: "{{donor.email}}",
          subject: "קבלה על תרומתך — {{organization.name}}",
        },
      },
    ],
  },
  // ─── 2. תזכורת ניהול תקין (30 יום) ──────────────────────────────────
  {
    name: "תזכורת ניהול תקין — 30 יום",
    description: "מתריע 30 יום לפני כל דדליין רגולטורי",
    triggerType: "SCHEDULED_DAILY",
    triggerConfig: { checkDaysAhead: 30 },
    category: "compliance",
    steps: [
      {
        order: 1,
        actionType: "SEND_EMAIL",
        actionConfig: {
          template: "compliance_reminder",
          to: "managers",
          daysAhead: 30,
        },
      },
    ],
  },
  // ─── 3. סיכום ישיבת ועד ───────────────────────────────────────────────
  {
    name: "סיכום ישיבת ועד",
    description: "שולח סיכום ישיבה לכל חברי הועד עם סיום הישיבה",
    triggerType: "meeting.ended",
    triggerConfig: {},
    category: "board",
    steps: [
      {
        order: 1,
        actionType: "CREATE_DOCUMENT",
        actionConfig: { template: "meeting_protocol", format: "pdf" },
      },
      {
        order: 2,
        actionType: "SEND_EMAIL",
        actionConfig: {
          template: "meeting_summary",
          to: "board_members",
          subject: "סיכום ישיבת ועד — {{meeting.title}}",
        },
      },
    ],
  },
  // ─── 4. דוח חודשי אוטומטי ────────────────────────────────────────────
  {
    name: "דוח חודשי אוטומטי",
    description: "מפיק ושולח דוח פעילות חודשי ב-1 לכל חודש",
    triggerType: "SCHEDULED_MONTHLY",
    triggerConfig: { dayOfMonth: 1, hour: 9 },
    category: "reporting",
    steps: [
      {
        order: 1,
        actionType: "CREATE_DOCUMENT",
        actionConfig: { template: "monthly_report", format: "pdf" },
      },
      {
        order: 2,
        actionType: "SEND_EMAIL",
        actionConfig: { template: "monthly_report", to: "managers" },
      },
    ],
  },
  // ─── 5. תזכורת דוח שנתי (90 יום) ────────────────────────────────────
  {
    name: "תזכורת דוח שנתי — 90 יום",
    description: "מתריע 90 יום לפני מועד הגשת הדוחות השנתיים (30.6)",
    triggerType: "SCHEDULED_ANNUALLY",
    triggerConfig: { month: 4, day: 1 }, // April 1st
    category: "compliance",
    steps: [
      {
        order: 1,
        actionType: "SEND_EMAIL",
        actionConfig: {
          to: "managers",
          subject: "⚠️ 90 יום להגשת הדוחות השנתיים",
          template: "annual_report_reminder",
        },
      },
      {
        order: 2,
        actionType: "SEND_NOTIFICATION",
        actionConfig: { message: "90 יום להגשת דוחות שנתיים לרשם העמותות", severity: "warning" },
      },
    ],
  },
  // ─── 6. ברכות חג לתורמים ─────────────────────────────────────────────
  {
    name: "ברכות שנה טובה לתורמים",
    description: "שולח ברכות ראש השנה לכל התורמים הפעילים",
    triggerType: "SCHEDULED_ANNUALLY",
    triggerConfig: { month: 8, day: 15 }, // ~Elul
    category: "donations",
    steps: [
      {
        order: 1,
        actionType: "SEND_EMAIL",
        actionConfig: {
          to: "active_donors",
          subject: "שנה טובה ומתוקה — {{organization.name}}",
          template: "holiday_greeting",
        },
      },
    ],
  },
  // ─── 7. אישור שעות מתנדבים ───────────────────────────────────────────
  {
    name: "אישור שעות מתנדבים חודשי",
    description: "שולח לכל מתנדב אישור על שעות הפעילות החודשיות",
    triggerType: "SCHEDULED_MONTHLY",
    triggerConfig: { dayOfMonth: 28, hour: 10 },
    category: "volunteers",
    steps: [
      {
        order: 1,
        actionType: "SEND_EMAIL",
        actionConfig: {
          to: "active_volunteers",
          template: "volunteer_hours_confirmation",
          subject: "אישור שעות מתנדב — {{month.name}}",
        },
      },
    ],
  },
  // ─── 8. התראת חריגה מתקציב ───────────────────────────────────────────
  {
    name: "התראת חריגה מתקציב",
    description: "מתריע כשניצול תקציב עובר 80% בקטגוריה מסוימת",
    triggerType: "SCHEDULED_MONTHLY",
    triggerConfig: { checkBudgetUtilization: true, threshold: 0.8 },
    category: "reporting",
    steps: [
      {
        order: 1,
        actionType: "SEND_NOTIFICATION",
        actionConfig: { message: "⚠️ חריגה מ-80% מהתקציב", severity: "warning" },
      },
      {
        order: 2,
        actionType: "SEND_EMAIL",
        actionConfig: {
          to: "managers",
          subject: "⚠️ התראת תקציב — ניצול מעל 80%",
          template: "budget_alert",
        },
      },
    ],
  },
  // ─── 9. גיבוי מסמכים שבועי ───────────────────────────────────────────
  {
    name: "גיבוי מסמכים שבועי",
    description: "מייצר לינק לגיבוי כל המסמכים ושולח למנהל",
    triggerType: "SCHEDULED_WEEKLY",
    triggerConfig: { dayOfWeek: 0, hour: 22 }, // Sunday 22:00
    category: "reporting",
    steps: [
      {
        order: 1,
        actionType: "SEND_NOTIFICATION",
        actionConfig: { message: "גיבוי שבועי הושלם", severity: "info" },
      },
    ],
  },
  // ─── 10. בדיקת סטטוס רשם ─────────────────────────────────────────────
  {
    name: "בדיקת סטטוס ניהול תקין",
    description: "בדיקה שנתית של סטטוס אישור הניהול התקין",
    triggerType: "SCHEDULED_ANNUALLY",
    triggerConfig: { month: 1, day: 1 }, // January 1st
    category: "compliance",
    steps: [
      {
        order: 1,
        actionType: "SEND_NOTIFICATION",
        actionConfig: { message: "בצע בדיקת סטטוס ניהול תקין ברשם העמותות", severity: "info" },
      },
      {
        order: 2,
        actionType: "SEND_EMAIL",
        actionConfig: { to: "managers", template: "nihul_takin_check", subject: "בדיקת ניהול תקין שנתית" },
      },
    ],
  },
  // ─── 11. תודה לתורם — 3 ימים לאחר תרומה ────────────────────────────
  {
    name: "תודה אישית לתורם (3 ימים)",
    description: "שולח מייל תודה אישי 3 ימים לאחר כל תרומה",
    triggerType: "donation.created",
    triggerConfig: { delayHours: 72 },
    category: "donations",
    steps: [
      {
        order: 1,
        actionType: "SEND_EMAIL",
        actionConfig: {
          template: "donor_thank_you",
          to: "{{donor.email}}",
          subject: "תודה על תרומתך — {{organization.name}}",
          delay: 72 * 3600,
        },
      },
    ],
  },
  // ─── 12. התראת ניצול תקציב 80% ──────────────────────────────────────
  {
    name: "התראת תקציב 80% — חודשי",
    description: "בדיקה חודשית: כאשר ניצול תקציב עובר 80%, שולח התראה לגזבר",
    triggerType: "SCHEDULED_MONTHLY",
    triggerConfig: { dayOfMonth: 15 },
    category: "reporting",
    steps: [
      {
        order: 1,
        actionType: "SEND_EMAIL",
        actionConfig: {
          to: "treasurers",
          template: "budget_utilization_report",
          subject: "📊 דוח ניצול תקציב — {{month.name}}",
        },
      },
    ],
  },
  // ─── 13. פרוטוקול ישיבה — PDF אוטומטי ──────────────────────────────
  {
    name: "פרוטוקול ישיבת ועד — PDF",
    description: "מפיק פרוטוקול PDF ושולח לכל חברי הועד בסיום ישיבה",
    triggerType: "meeting.ended",
    triggerConfig: {},
    category: "board",
    steps: [
      {
        order: 1,
        actionType: "CREATE_DOCUMENT",
        actionConfig: { template: "board_protocol", format: "pdf", saveToOrg: true },
      },
      {
        order: 2,
        actionType: "SEND_EMAIL",
        actionConfig: {
          to: "board_members",
          subject: "פרוטוקול ישיבת ועד — {{meeting.date}}",
          template: "protocol_delivery",
        },
      },
    ],
  },
  // ─── 14. חידוש כהונת חברי ועד ───────────────────────────────────────
  {
    name: "תזכורת חידוש כהונת חבר ועד",
    description: "מתריע 60 יום לפני פקיעת כהונת חבר ועד",
    triggerType: "SCHEDULED_DAILY",
    triggerConfig: { checkBoardMemberTerms: true, daysAhead: 60 },
    category: "board",
    steps: [
      {
        order: 1,
        actionType: "SEND_EMAIL",
        actionConfig: {
          to: "managers",
          subject: "⚠️ כהונת חבר ועד פוקעת בעוד 60 יום",
          template: "board_term_expiry",
        },
      },
      {
        order: 2,
        actionType: "SEND_NOTIFICATION",
        actionConfig: { message: "כהונת חבר ועד פוקעת בקרוב — נדרשות בחירות", severity: "warning" },
      },
    ],
  },
  // ─── 15. אסיפה כללית שנתית — יצירת אירוע ───────────────────────────
  {
    name: "הכנה לאסיפה כללית שנתית",
    description: "יוצר אירוע אסיפה כללית ושולח הזמנות לחברים — מרץ כל שנה",
    triggerType: "SCHEDULED_ANNUALLY",
    triggerConfig: { month: 3, day: 1 },
    category: "board",
    steps: [
      {
        order: 1,
        actionType: "CREATE_DOCUMENT",
        actionConfig: { template: "general_assembly_notice", saveToOrg: true },
      },
      {
        order: 2,
        actionType: "SEND_EMAIL",
        actionConfig: {
          to: "all_members",
          subject: "הזמנה לאסיפה כללית שנתית — {{organization.name}}",
          template: "assembly_invitation",
        },
      },
    ],
  },
  // ─── 16. גמול ועד — בדיקת תקרות רבעונית ───────────────────────────
  {
    name: "בדיקת גמול ועד — תקרות",
    description: "בדיקה רבעונית שגמול חברי הועד לא חורג מהתקרות שנקבעו",
    triggerType: "SCHEDULED_QUARTERLY",
    triggerConfig: {},
    category: "compliance",
    steps: [
      {
        order: 1,
        actionType: "SEND_NOTIFICATION",
        actionConfig: { message: "בצע בדיקת עמידה בתקרות גמול חברי ועד", severity: "info" },
      },
      {
        order: 2,
        actionType: "SEND_EMAIL",
        actionConfig: {
          to: "managers",
          subject: "📋 בדיקת גמול ועד — רבעון {{quarter}}",
          template: "board_compensation_check",
        },
      },
    ],
  },
  // ─── 17. עסקה גדולה — התראה מיידית ─────────────────────────────────
  {
    name: "התראה על עסקה גדולה (>₪50,000)",
    description: "מתריע מיידית כשמתבצעת תנועה בנקאית מעל ₪50,000",
    triggerType: "transaction.created",
    triggerConfig: { minAmount: 50000 },
    category: "banking",
    steps: [
      {
        order: 1,
        actionType: "SEND_NOTIFICATION",
        actionConfig: { message: "⚠️ תנועה חריגה: ₪{{transaction.amount}}", severity: "danger" },
      },
      {
        order: 2,
        actionType: "SEND_EMAIL",
        actionConfig: {
          to: "managers",
          subject: "🚨 תנועה חריגה בחשבון — ₪{{transaction.amount}}",
          template: "large_transaction_alert",
        },
      },
    ],
  },
  // ─── 18. תורם לא פעיל 6 חודשים ──────────────────────────────────────
  {
    name: "ריאנגג'מנט תורמים לא פעילים",
    description: "שולח מייל ריאנגג'מנט לתורמים שלא תרמו ב-6 חודשים האחרונים",
    triggerType: "SCHEDULED_MONTHLY",
    triggerConfig: { inactiveDonorMonths: 6 },
    category: "donations",
    steps: [
      {
        order: 1,
        actionType: "SEND_EMAIL",
        actionConfig: {
          to: "inactive_donors_6m",
          subject: "אנחנו מתגעגעים אליך — {{organization.name}}",
          template: "donor_reengagement",
        },
      },
    ],
  },
  // ─── 19. תזכורת דוח שנתי (90 יום לפני 30.6) ─────────────────────
  {
    name: "תזכורת הגשת דוחות שנתיים — 90 יום",
    description: "תזכורת מוקדמת להגשת הדוחות השנתיים לרשם, 90 יום לפני המועד",
    triggerType: "SCHEDULED_ANNUALLY",
    triggerConfig: { month: 4, day: 1 },
    category: "compliance",
    steps: [
      {
        order: 1,
        actionType: "SEND_EMAIL",
        actionConfig: {
          to: "managers",
          subject: "📅 90 יום להגשת דוחות שנתיים — התחל להכין",
          template: "annual_report_90_days",
        },
      },
      {
        order: 2,
        actionType: "CREATE_DOCUMENT",
        actionConfig: { template: "annual_report_checklist", saveToOrg: true },
      },
    ],
  },
  // ─── 20. WhatsApp Digest שבועי ───────────────────────────────────────
  {
    name: "WhatsApp Digest שבועי לוועד",
    description: "שולח סיכום שבועי ב-WhatsApp לכל חברי הועד כל ראשון",
    triggerType: "SCHEDULED_WEEKLY",
    triggerConfig: { dayOfWeek: 0, hour: 8 }, // Sunday 08:00
    category: "reporting",
    steps: [
      {
        order: 1,
        actionType: "SEND_NOTIFICATION",
        actionConfig: { channel: "whatsapp", to: "board_members", template: "weekly_digest_wa" },
      },
    ],
  },
];

export function getTemplatesByCategory(category: WorkflowTemplate["category"]) {
  return WORKFLOW_TEMPLATES.filter((t) => t.category === category);
}
