/**
 * Authority Email Templates — pre-built Hebrew email templates for Israeli regulators.
 * One-click send from the portal/institutions page.
 */

export type AuthorityEmailKey =
  | "registrar_extension_request"
  | "registrar_audit_response"
  | "registrar_document_submission"
  | "tax_section46_renewal"
  | "tax_foreign_donation_report"
  | "municipality_grant_request"
  | "municipality_execution_report";

export interface AuthorityEmailTemplate {
  key: AuthorityEmailKey;
  authority: string;
  subject: string;
  description: string;
  /** Returns HTML body with org details auto-filled */
  buildHtml: (params: OrgParams) => string;
  /** Returns plain text body for copy-paste */
  buildText: (params: OrgParams) => string;
  /** Official email address to send to */
  recipientEmail: string;
}

export interface OrgParams {
  orgName: string;
  orgNumber: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currentYear: number;
  chairmanName?: string;
}

// ─── Template builder helper ─────────────────────────────────────────────────

function wrap(content: string): string {
  return `
<div dir="rtl" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#1e293b;max-width:720px;margin:0 auto;padding:20px;">
${content}
<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
<p style="font-size:12px;color:#64748b;margin:0;">מייל זה הופק אוטומטית על-ידי מערכת מעטפת — ניהול עמותות אוטומטי</p>
</div>`;
}

// ─── Templates ────────────────────────────────────────────────────────────────

export const AUTHORITY_TEMPLATES: AuthorityEmailTemplate[] = [
  // 1. בקשת ארכה לרשם
  {
    key: "registrar_extension_request",
    authority: "רשם העמותות",
    subject: "בקשת ארכה להגשת דוחות — {{orgName}}",
    description: "בקשת הארכה להגשת הדוחות השנתיים",
    recipientEmail: "amutot@justice.gov.il",
    buildHtml: (p) =>
      wrap(`
        <p>לכבוד,<br/>רשם העמותות<br/>משרד המשפטים</p>
        <br/>
        <p><strong>הנדון: בקשת ארכה להגשת דוחות שנתיים לשנת ${p.currentYear - 1} — עמותת ${p.orgName} (מספר ${p.orgNumber})</strong></p>
        <p>בהמשך לחובת הגשת הדוחות השנתיים בהתאם לסעיף 38 לחוק העמותות תש"ם-1980, הננו מבקשים בזה ארכה להגשת הדוחות הכספי והמילולי לשנת ${p.currentYear - 1}.</p>
        <p>הסיבה לבקשה: _______________</p>
        <p>אנו מצהירים כי הדוחות יוגשו לא יאוחר מתאריך: _______________</p>
        <p>לפרטים נוספים ניתן לפנות:</p>
        <ul>
          <li>שם: ${p.contactName}</li>
          <li>טלפון: ${p.contactPhone}</li>
          <li>דוא"ל: ${p.contactEmail}</li>
        </ul>
        <p>בכבוד רב,<br/>${p.chairmanName ?? p.contactName}<br/>יו"ר ועד ${p.orgName}</p>`),
    buildText: (p) =>
      `לכבוד רשם העמותות,\n\nהנדון: בקשת ארכה — עמותת ${p.orgName} (${p.orgNumber})\n\nאנו מבקשים ארכה להגשת הדוחות השנתיים לשנת ${p.currentYear - 1}.\n\nסיבה: _______________\n\nתאריך מחויבות: _______________\n\nבכבוד,\n${p.contactName}\n${p.contactPhone}`,
  },
  // 2. תגובה לממצאי ביקורת
  {
    key: "registrar_audit_response",
    authority: "רשם העמותות",
    subject: "תגובה לממצאי ביקורת — {{orgName}}",
    description: "מענה לממצאים שנמצאו בביקורת הרשם",
    recipientEmail: "amutot@justice.gov.il",
    buildHtml: (p) =>
      wrap(`
        <p>לכבוד,<br/>רשם העמותות<br/>משרד המשפטים</p>
        <br/>
        <p><strong>הנדון: תגובה לממצאי ביקורת — עמותת ${p.orgName} (מספר ${p.orgNumber})</strong></p>
        <p>בהמשך למכתב הרשם מיום _______________, הננו מתכבדים להגיש את מענה העמותה לממצאים שפורטו:</p>
        <table style="border-collapse:collapse;width:100%;">
          <tr style="background:#f8fafc;">
            <th style="border:1px solid #e2e8f0;padding:8px;text-align:right;">ממצא</th>
            <th style="border:1px solid #e2e8f0;padding:8px;text-align:right;">תגובה ופעולות שננקטו</th>
            <th style="border:1px solid #e2e8f0;padding:8px;text-align:right;">תאריך תיקון</th>
          </tr>
          <tr>
            <td style="border:1px solid #e2e8f0;padding:8px;">_______________</td>
            <td style="border:1px solid #e2e8f0;padding:8px;">_______________</td>
            <td style="border:1px solid #e2e8f0;padding:8px;">_______________</td>
          </tr>
        </table>
        <p>העמותה מחויבת לניהול תקין ושקוף ופועלת לתיקון מלא של כל הממצאים.</p>
        <p>בכבוד,<br/>${p.chairmanName ?? p.contactName}<br/>יו"ר ועד ${p.orgName}<br/>${p.contactPhone}</p>`),
    buildText: (p) =>
      `לכבוד רשם העמותות,\n\nהנדון: תגובה לממצאי ביקורת — עמותת ${p.orgName} (${p.orgNumber})\n\nהממצאים הנדונים: _______________\nהפעולות שננקטו: _______________\n\nבכבוד,\n${p.contactName}`,
  },
  // 3. הגשת מסמכים
  {
    key: "registrar_document_submission",
    authority: "רשם העמותות",
    subject: "הגשת מסמכים — {{orgName}}",
    description: "הגשת מסמכים ודוחות לרשם העמותות",
    recipientEmail: "amutot@justice.gov.il",
    buildHtml: (p) =>
      wrap(`
        <p>לכבוד,<br/>רשם העמותות<br/>משרד המשפטים</p>
        <br/>
        <p><strong>הנדון: הגשת מסמכים — עמותת ${p.orgName} (מספר ${p.orgNumber})</strong></p>
        <p>בהמשך לדרישות הרשם, הננו מגישים בצירוף מייל זה את המסמכים הבאים:</p>
        <ul>
          <li>□ דוח כספי שנת ${p.currentYear - 1}</li>
          <li>□ דוח מילולי שנת ${p.currentYear - 1}</li>
          <li>□ פרוטוקול אסיפה כללית</li>
          <li>□ הצהרת ניגוד עניינים</li>
          <li>□ _______________</li>
        </ul>
        <p>לבירורים: ${p.contactName}, ${p.contactPhone}, ${p.contactEmail}</p>
        <p>בכבוד,<br/>${p.chairmanName ?? p.contactName}<br/>יו"ר ועד ${p.orgName}</p>`),
    buildText: (p) =>
      `לכבוד רשם העמותות,\n\nהנדון: הגשת מסמכים — עמותת ${p.orgName} (${p.orgNumber})\n\nמצ"ב המסמכים הנדרשים.\n\nבכבוד,\n${p.contactName}\n${p.contactPhone}`,
  },
  // 4. חידוש סעיף 46
  {
    key: "tax_section46_renewal",
    authority: "רשות המסים",
    subject: "בקשת חידוש אישור סעיף 46 — {{orgName}}",
    description: "בקשת חידוש אישור זיכוי ממס לתורמים",
    recipientEmail: "amutot@taxes.gov.il",
    buildHtml: (p) =>
      wrap(`
        <p>לכבוד,<br/>רשות המסים בישראל<br/>מחלקת עמותות</p>
        <br/>
        <p><strong>הנדון: בקשת חידוש אישור לפי סעיף 46 לפקודת מס הכנסה — עמותת ${p.orgName} (מספר ${p.orgNumber})</strong></p>
        <p>הננו מגישים בזה בקשה לחידוש האישור לפי סעיף 46 לפקודת מס הכנסה, המאפשר לתורמי העמותה לקבל זיכוי ממס על תרומותיהם.</p>
        <p><strong>פרטי העמותה:</strong></p>
        <ul>
          <li>שם: ${p.orgName}</li>
          <li>מספר עמותה: ${p.orgNumber}</li>
          <li>כתובת: ${p.address}</li>
          <li>נציג: ${p.contactName}, ${p.contactPhone}</li>
        </ul>
        <p>מצ"ב: אישור ניהול תקין בתוקף, דוחות כספיים לשנים האחרונות.</p>
        <p>בכבוד,<br/>${p.chairmanName ?? p.contactName}<br/>יו"ר ועד ${p.orgName}</p>`),
    buildText: (p) =>
      `לכבוד רשות המסים,\n\nהנדון: בקשת חידוש סעיף 46 — עמותת ${p.orgName} (${p.orgNumber})\n\nמבוקש חידוש אישור זיכוי ממס לתורמים.\n\nבכבוד,\n${p.contactName}\n${p.contactPhone}`,
  },
  // 5. דיווח תרומה מישות זרה
  {
    key: "tax_foreign_donation_report",
    authority: "רשות המסים",
    subject: "דיווח תרומה ממישות מדינית זרה — {{orgName}}",
    description: "דיווח חובה על תרומה שהתקבלה מגוף מדיני זר",
    recipientEmail: "amutot@justice.gov.il",
    buildHtml: (p) =>
      wrap(`
        <p>לכבוד,<br/>רשם העמותות<br/>משרד המשפטים</p>
        <br/>
        <p><strong>הנדון: דיווח על קבלת תרומה ממישות מדינית זרה — עמותת ${p.orgName} (מספר ${p.orgNumber})</strong></p>
        <p>בהתאם להוראות הרשם, הננו מדווחים כי התקבלה תרומה ממישות מדינית זרה:</p>
        <ul>
          <li>שם הגוף התורם: _______________</li>
          <li>מדינת מוצא: _______________</li>
          <li>סכום התרומה: ₪_______________</li>
          <li>תאריך קבלת התרומה: _______________</li>
          <li>מטרת השימוש בכספים: _______________</li>
        </ul>
        <p>בכבוד,<br/>${p.chairmanName ?? p.contactName}<br/>יו"ר ועד ${p.orgName}</p>`),
    buildText: (p) =>
      `לכבוד רשם העמותות,\n\nהנדון: דיווח תרומה מישות זרה — עמותת ${p.orgName} (${p.orgNumber})\n\nגוף תורם: _______________\nסכום: ₪_______________\nתאריך: _______________\n\nבכבוד,\n${p.contactName}`,
  },
  // 6. בקשת תמיכה מרשות מקומית
  {
    key: "municipality_grant_request",
    authority: "עירייה / רשות מקומית",
    subject: "בקשת תמיכה — {{orgName}}",
    description: "בקשה לתמיכה כספית מהרשות המקומית",
    recipientEmail: "",
    buildHtml: (p) =>
      wrap(`
        <p>לכבוד,<br/>ראש העיר / מנכ"ל הרשות המקומית</p>
        <br/>
        <p><strong>הנדון: בקשת תמיכה לשנת ${p.currentYear} — עמותת ${p.orgName}</strong></p>
        <p>הננו מגישים בזה בקשת תמיכה לשנת ${p.currentYear} עבור עמותת ${p.orgName} (מספר ${p.orgNumber}), הפועלת בתחום _______________.</p>
        <p><strong>פעילות העמותה:</strong></p>
        <p>_______________</p>
        <p><strong>הסכום המבוקש:</strong> ₪_______________</p>
        <p><strong>אישורים מצ"ב:</strong></p>
        <ul>
          <li>✅ אישור ניהול תקין בתוקף</li>
          <li>✅ דוח כספי מבוקר לשנת ${p.currentYear - 1}</li>
          <li>✅ תקציב מאושר לשנת ${p.currentYear}</li>
        </ul>
        <p>בכבוד,<br/>${p.chairmanName ?? p.contactName}<br/>יו"ר ועד ${p.orgName}<br/>${p.contactPhone} | ${p.contactEmail}</p>`),
    buildText: (p) =>
      `לכבוד ראש הרשות המקומית,\n\nהנדון: בקשת תמיכה שנת ${p.currentYear} — עמותת ${p.orgName}\n\nסכום מבוקש: ₪_______________\nתחום פעילות: _______________\n\nבכבוד,\n${p.contactName}\n${p.contactPhone}`,
  },
  // 7. דוח ביצוע תמיכה
  {
    key: "municipality_execution_report",
    authority: "עירייה / רשות מקומית",
    subject: "דוח ביצוע תמיכה — {{orgName}}",
    description: "דוח על השימוש בתמיכה הכספית שהתקבלה",
    recipientEmail: "",
    buildHtml: (p) =>
      wrap(`
        <p>לכבוד,<br/>ראש העיר / מנכ"ל הרשות המקומית</p>
        <br/>
        <p><strong>הנדון: דוח ביצוע תמיכה שנת ${p.currentYear - 1} — עמותת ${p.orgName}</strong></p>
        <p>בהמשך לתמיכה שהתקבלה בסך ₪_______________ לשנת ${p.currentYear - 1}, הננו מגישים דוח ביצוע מפורט:</p>
        <p><strong>פעילויות שבוצעו:</strong></p>
        <p>_______________</p>
        <p><strong>מוטבים שקיבלו שירות:</strong> _______________ אנשים</p>
        <p><strong>ניצול התקציב:</strong></p>
        <ul>
          <li>סכום שהתקבל: ₪_______________</li>
          <li>סכום שנוצל: ₪_______________</li>
          <li>יתרה: ₪_______________</li>
        </ul>
        <p>מצ"ב קבלות וחשבוניות לאימות.</p>
        <p>בכבוד,<br/>${p.chairmanName ?? p.contactName}<br/>יו"ר ועד ${p.orgName}<br/>${p.contactPhone}</p>`),
    buildText: (p) =>
      `לכבוד ראש הרשות המקומית,\n\nהנדון: דוח ביצוע תמיכה ${p.currentYear - 1} — עמותת ${p.orgName}\n\nניצול תקציב: ₪_______________\nמוטבים: _______________ אנשים\n\nבכבוד,\n${p.contactName}`,
  },
];

export function getTemplate(key: AuthorityEmailKey): AuthorityEmailTemplate | undefined {
  return AUTHORITY_TEMPLATES.find((t) => t.key === key);
}

export function buildSubject(template: AuthorityEmailTemplate, orgName: string): string {
  return template.subject.replace("{{orgName}}", orgName);
}
