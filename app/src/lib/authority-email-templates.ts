/**
 * Authority Email Templates — pre-built Hebrew email templates for Israeli regulators.
 * One-click send from the portal/institutions page.
 */

export type AuthorityEmailKey =
  | "registrar_extension_request"
  | "registrar_audit_response"
  | "registrar_document_submission"
  | "registrar_board_change"
  | "registrar_update_details"
  | "tax_section46_renewal"
  | "tax_foreign_donation_report"
  | "tax_bookkeeping_approval"
  | "municipality_grant_request"
  | "municipality_execution_report"
  | "bituach_leumi_volunteers"
  | "bank_signatories_update"
  | "board_meeting_protocol"
  | "general_assembly_protocol"
  | "conflict_of_interest_declaration"
  | "family_relationship_declaration"
  | "no_criminal_record_declaration"
  | "section46_receipt"
  | "volunteer_certificate";

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
    description: "בקשת ארכה להגשת דוחות — ההגשה הרשמית דרך האזור האישי באתר רשות התאגידים, המייל משמש לגיבוי ותמיכה",
    recipientEmail: "moked-amutot@justice.gov.il",
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
    description: "מענה לממצאי ביקורת — ההגשה הרשמית דרך האזור האישי באתר רשות התאגידים, המייל משמש לגיבוי ותמיכה",
    recipientEmail: "moked-amutot@justice.gov.il",
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
    description: "הגשת מסמכים לרשם — ההגשה הרשמית דרך האזור האישי באתר רשות התאגידים, המייל משמש לגיבוי ותמיכה",
    recipientEmail: "moked-amutot@justice.gov.il",
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
    description: "בקשת חידוש אישור זיכוי ממס לתורמים — יש להגיש עד סוף אוגוסט בשנה שפג התוקף",
    recipientEmail: "malkar@taxes.gov.il",
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
        <p>מצ"ב: אישור ניהול תקין בתוקף, דוחות כספיים מבוקרים לשנתיים האחרונות.</p>
        <p style="font-size:12px;color:#64748b;">📅 מועד הגשה: עד 31 באוגוסט בשנה שפג תוקף האישור. חלק מהאישורים מחודשים אוטומטית מאז 2016.</p>
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
    recipientEmail: "malkar@taxes.gov.il",
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
  // 8. הודעה על שינוי חברי ועד
  {
    key: "registrar_board_change",
    authority: "רשם העמותות",
    subject: "הודעה על שינוי חברי ועד — {{orgName}}",
    description: "דיווח על שינוי חברי ועד — חובה להגיש דרך המערכת המקוונת באתר רשות התאגידים, המייל משמש לגיבוי ותמיכה",
    recipientEmail: "moked-amutot@justice.gov.il",
    buildHtml: (p) =>
      wrap(`
        <p>לכבוד,<br/>רשם העמותות<br/>משרד המשפטים</p>
        <br/>
        <p><strong>הנדון: הודעה על שינוי חברי ועד מנהל — עמותת ${p.orgName} (מספר ${p.orgNumber})</strong></p>
        <p>בהתאם לסעיף 27 לחוק העמותות תש"ם-1980, הננו מודיעים בזה על שינוי בהרכב הועד המנהל של העמותה:</p>
        <p><strong>חברים שסיימו כהונתם:</strong></p>
        <ul><li>_______________</li></ul>
        <p><strong>חברים חדשים שנבחרו:</strong></p>
        <ul><li>שם: _______________ | ת.ז.: _______________ | תפקיד: _______________</li></ul>
        <p>השינוי אושר באסיפה הכללית / ישיבת ועד מיום _______________.</p>
        <p>בכבוד,<br/>${p.chairmanName ?? p.contactName}<br/>יו"ר ועד ${p.orgName}<br/>${p.contactPhone}</p>`),
    buildText: (p) =>
      `לכבוד רשם העמותות,\n\nהנדון: שינוי חברי ועד — עמותת ${p.orgName} (${p.orgNumber})\n\nחברים שסיימו: _______________\nחברים חדשים: _______________\n\nבכבוד,\n${p.contactName}`,
  },
  // 9. עדכון פרטי עמותה
  {
    key: "registrar_update_details",
    authority: "רשם העמותות",
    subject: "עדכון פרטי עמותה — {{orgName}}",
    description: "עדכון פרטי עמותה — חובה להגיש דרך המערכת המקוונת באתר רשות התאגידים, המייל משמש לגיבוי ותמיכה",
    recipientEmail: "moked-amutot@justice.gov.il",
    buildHtml: (p) =>
      wrap(`
        <p>לכבוד,<br/>רשם העמותות<br/>משרד המשפטים</p>
        <br/>
        <p><strong>הנדון: עדכון פרטי עמותה — ${p.orgName} (מספר ${p.orgNumber})</strong></p>
        <p>הננו מודיעים בזה על עדכון הפרטים הבאים:</p>
        <table style="border-collapse:collapse;width:100%;">
          <tr style="background:#f8fafc;">
            <th style="border:1px solid #e2e8f0;padding:8px;text-align:right;">שדה</th>
            <th style="border:1px solid #e2e8f0;padding:8px;text-align:right;">פרט ישן</th>
            <th style="border:1px solid #e2e8f0;padding:8px;text-align:right;">פרט חדש</th>
          </tr>
          <tr>
            <td style="border:1px solid #e2e8f0;padding:8px;">_______________</td>
            <td style="border:1px solid #e2e8f0;padding:8px;">_______________</td>
            <td style="border:1px solid #e2e8f0;padding:8px;">_______________</td>
          </tr>
        </table>
        <p>בכבוד,<br/>${p.chairmanName ?? p.contactName}<br/>יו"ר ועד ${p.orgName}<br/>${p.contactPhone}</p>`),
    buildText: (p) =>
      `לכבוד רשם העמותות,\n\nהנדון: עדכון פרטי עמותה — ${p.orgName} (${p.orgNumber})\n\nשדה: _______________\nפרט ישן: _______________\nפרט חדש: _______________\n\nבכבוד,\n${p.contactName}`,
  },
  // 10. בקשת אישור ניהול ספרים
  {
    key: "tax_bookkeeping_approval",
    authority: "רשות המסים",
    subject: "בקשת אישור ניהול ספרים — {{orgName}}",
    description: "בקשה לאישור ניהול ספרים — יש להגיש לפקיד השומה האזורי דרך מערכת מפ\"ל או במייל ישיר",
    recipientEmail: "",
    buildHtml: (p) =>
      wrap(`
        <p>לכבוד,<br/>פקיד השומה האזורי<br/>רשות המסים בישראל</p>
        <br/>
        <p><strong>הנדון: בקשת אישור ניהול ספרים — עמותת ${p.orgName} (מספר ${p.orgNumber})</strong></p>
        <p>הננו מבקשים בזה לקבל/לחדש אישור ניהול ספרים בהתאם לדרישות פקודת מס הכנסה.</p>
        <p style="background:#fef3c7;padding:10px;border-radius:6px;font-size:13px;">💡 <strong>שים לב:</strong> הגשת הבקשה מומלצת דרך מערכת הפניות לציבור (מפ"ל) באתר רשות המסים, או ישירות לפקיד השומה האזורי שבו מתנהל תיק העמותה.</p>
        <p><strong>פרטי העמותה:</strong></p>
        <ul>
          <li>שם: ${p.orgName}</li>
          <li>מספר עמותה: ${p.orgNumber}</li>
          <li>כתובת: ${p.address}</li>
          <li>נציג: ${p.contactName}, ${p.contactPhone}</li>
        </ul>
        <p>מצ"ב: דוחות כספיים לשנה האחרונה, אישור ניהול תקין.</p>
        <p>בכבוד,<br/>${p.chairmanName ?? p.contactName}<br/>יו"ר ועד ${p.orgName}</p>`),
    buildText: (p) =>
      `לכבוד פקיד השומה האזורי,\n\nהנדון: בקשת אישור ניהול ספרים — עמותת ${p.orgName} (${p.orgNumber})\n\nמבוקש אישור ניהול ספרים.\n\nשים לב: מומלץ להגיש דרך מערכת מפ"ל באתר רשות המסים.\n\nבכבוד,\n${p.contactName}\n${p.contactPhone}`,
  },
  // 11. רישום מתנדבים בביטוח לאומי
  {
    key: "bituach_leumi_volunteers",
    authority: "ביטוח לאומי",
    subject: "רישום מתנדבים — {{orgName}}",
    description: "רישום מתנדבים — הדרך התקנית היא דרך פורטל המעסיקים של ביטוח לאומי, המייל משמש לבירורים ותקלות",
    recipientEmail: "maasikim@nioi.gov.il",
    buildHtml: (p) =>
      wrap(`
        <p>לכבוד,<br/>המוסד לביטוח לאומי<br/>מחלקת מעסיקים</p>
        <br/>
        <p><strong>הנדון: רישום מתנדבים — עמותת ${p.orgName} (מספר ${p.orgNumber})</strong></p>
        <p>בהתאם לחוק ביטוח לאומי, הננו מבקשים לרשום את המתנדבים הבאים בביטוח:</p>
        <table style="border-collapse:collapse;width:100%;">
          <tr style="background:#f8fafc;">
            <th style="border:1px solid #e2e8f0;padding:8px;text-align:right;">שם מלא</th>
            <th style="border:1px solid #e2e8f0;padding:8px;text-align:right;">ת.ז.</th>
            <th style="border:1px solid #e2e8f0;padding:8px;text-align:right;">תאריך תחילה</th>
            <th style="border:1px solid #e2e8f0;padding:8px;text-align:right;">שעות שבועיות</th>
          </tr>
          <tr>
            <td style="border:1px solid #e2e8f0;padding:8px;">_______________</td>
            <td style="border:1px solid #e2e8f0;padding:8px;">_______________</td>
            <td style="border:1px solid #e2e8f0;padding:8px;">_______________</td>
            <td style="border:1px solid #e2e8f0;padding:8px;">_______________</td>
          </tr>
        </table>
        <p>בכבוד,<br/>${p.chairmanName ?? p.contactName}<br/>${p.orgName}<br/>${p.contactPhone}</p>`),
    buildText: (p) =>
      `לכבוד ביטוח לאומי,\n\nהנדון: רישום מתנדבים — עמותת ${p.orgName} (${p.orgNumber})\n\nשם: _______________\nת.ז.: _______________\n\nבכבוד,\n${p.contactName}`,
  },
  // 12. עדכון מורשי חתימה בבנק
  {
    key: "bank_signatories_update",
    authority: "בנק",
    subject: "עדכון מורשי חתימה — {{orgName}}",
    description: "עדכון מורשי חתימה — הבנק דורש פרוטוקול מקורי חתום ע\"י עו\"ד (אישור חתימה), יש לשלוח למייל הבנקאי בסניף",
    recipientEmail: "",
    buildHtml: (p) =>
      wrap(`
        <p>לכבוד,<br/>מנהל/ת סניף הבנק</p>
        <br/>
        <p><strong>הנדון: עדכון מורשי חתימה — עמותת ${p.orgName} (מספר ${p.orgNumber})</strong></p>
        <p style="background:#fef3c7;padding:10px;border-radius:6px;font-size:13px;">💡 <strong>שים לב:</strong> הבנק דורש פרוטוקול מקורי חתום על ידי עורך דין (אישור חתימה). יש לצרף את המסמך הסרוק למייל זה ולשלוח לבנקאי האישי בסניף.</p>
        <p>בהתאם להחלטת הועד המנהל מיום _______________, הננו מבקשים לעדכן את רשימת מורשי החתימה בחשבון העמותה:</p>
        <p><strong>מורשי חתימה שיש להסיר:</strong></p>
        <ul><li>_______________</li></ul>
        <p><strong>מורשי חתימה חדשים:</strong></p>
        <ul><li>שם: _______________ | ת.ז.: _______________ | תפקיד: _______________</li></ul>
        <p><strong>אופן החתימה:</strong> כל שניים מתוך רשימת מורשי החתימה / _______________</p>
        <p>מצ"ב: פרוטוקול ישיבת ועד, צילומי ת.ז. של מורשי חתימה חדשים.</p>
        <p>בכבוד,<br/>${p.chairmanName ?? p.contactName}<br/>יו"ר ועד ${p.orgName}<br/>${p.contactPhone}</p>`),
    buildText: (p) =>
      `לכבוד מנהל הסניף,\n\nהנדון: עדכון מורשי חתימה — עמותת ${p.orgName} (${p.orgNumber})\n\nלהסיר: _______________\nלהוסיף: _______________\n\nבכבוד,\n${p.contactName}`,
  },
  // 13. פרוטוקול ישיבת ועד
  {
    key: "board_meeting_protocol",
    authority: "פנימי",
    subject: "פרוטוקול ישיבת ועד — {{orgName}}",
    description: "תבנית פרוטוקול לישיבת ועד מנהל",
    recipientEmail: "",
    buildHtml: (p) =>
      wrap(`
        <h2 style="text-align:center;color:#1e293b;">פרוטוקול ישיבת ועד מנהל</h2>
        <h3 style="text-align:center;color:#475569;">עמותת ${p.orgName} (${p.orgNumber})</h3>
        <p><strong>תאריך:</strong> _______________</p>
        <p><strong>מקום:</strong> _______________</p>
        <p><strong>נוכחים:</strong> _______________</p>
        <p><strong>חסרים:</strong> _______________</p>
        <p><strong>יו"ר הישיבה:</strong> ${p.chairmanName ?? "_______________"}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
        <p><strong>סדר יום:</strong></p>
        <ol><li>_______________</li><li>_______________</li></ol>
        <p><strong>דיון:</strong></p>
        <p>_______________</p>
        <p><strong>החלטות:</strong></p>
        <ol><li>_______________</li></ol>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
        <p>הישיבה ננעלה בשעה _______________</p>
        <p>חתימת יו"ר: _______________ &nbsp;&nbsp; חתימת מזכיר: _______________</p>`),
    buildText: (p) =>
      `פרוטוקול ישיבת ועד מנהל — ${p.orgName}\n\nתאריך: _______________\nנוכחים: _______________\nסדר יום: _______________\nהחלטות: _______________`,
  },
  // 14. פרוטוקול אסיפה כללית
  {
    key: "general_assembly_protocol",
    authority: "פנימי",
    subject: "פרוטוקול אסיפה כללית — {{orgName}}",
    description: "תבנית פרוטוקול לאסיפה כללית של העמותה",
    recipientEmail: "",
    buildHtml: (p) =>
      wrap(`
        <h2 style="text-align:center;color:#1e293b;">פרוטוקול אסיפה כללית</h2>
        <h3 style="text-align:center;color:#475569;">עמותת ${p.orgName} (${p.orgNumber})</h3>
        <p><strong>תאריך:</strong> _______________</p>
        <p><strong>מקום:</strong> _______________</p>
        <p><strong>מספר חברים שנכחו:</strong> _______________ מתוך _______________ חברים רשומים</p>
        <p><strong>יו"ר האסיפה:</strong> ${p.chairmanName ?? "_______________"}</p>
        <p><strong>מנויה כדין:</strong> כן / לא (אסיפה נדחית)</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
        <p><strong>סדר יום:</strong></p>
        <ol><li>אישור דוחות כספיים לשנת ${p.currentYear - 1}</li><li>בחירת ועד מנהל</li><li>בחירת ועדת ביקורת</li><li>שונות</li></ol>
        <p><strong>החלטות:</strong></p>
        <ol><li>_______________</li></ol>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
        <p>חתימת יו"ר: _______________ &nbsp;&nbsp; חתימת מזכיר: _______________</p>`),
    buildText: (p) =>
      `פרוטוקול אסיפה כללית — ${p.orgName}\n\nתאריך: _______________\nנוכחים: _______________\nהחלטות: _______________`,
  },
  // 15. הצהרת ניגוד עניינים
  {
    key: "conflict_of_interest_declaration",
    authority: "פנימי",
    subject: "הצהרת ניגוד עניינים — {{orgName}}",
    description: "הצהרת חבר ועד על העדר ניגוד עניינים",
    recipientEmail: "",
    buildHtml: (p) =>
      wrap(`
        <h2 style="text-align:center;color:#1e293b;">הצהרה בדבר העדר ניגוד עניינים</h2>
        <h3 style="text-align:center;color:#475569;">עמותת ${p.orgName} (${p.orgNumber})</h3>
        <br/>
        <p>אני, _______________, ת.ז. _______________, חבר/ת ועד מנהל בעמותת ${p.orgName}, מצהיר/ה בזה כדלקמן:</p>
        <ol>
          <li>אין לי כל עניין אישי, עסקי, כספי או אחר העלול ליצור ניגוד עניינים עם תפקידי בעמותה.</li>
          <li>אינני קשור/ה בקשר עסקי, משפחתי או אחר עם ספקים, יועצים או גורמים המקבלים תשלום מהעמותה.</li>
          <li>אם יתעורר מצב של ניגוד עניינים, אודיע על כך מיידית לועד ואימנע מהשתתפות בדיון ובהצבעה בנושא.</li>
        </ol>
        <br/>
        <p>תאריך: _______________ &nbsp;&nbsp; חתימה: _______________</p>`),
    buildText: (p) =>
      `הצהרת ניגוד עניינים — ${p.orgName}\n\nאני _____________ מצהיר/ה כי אין לי ניגוד עניינים עם תפקידי בעמותה.\n\nתאריך: _______________ חתימה: _______________`,
  },
  // 16. הצהרת קרבה משפחתית
  {
    key: "family_relationship_declaration",
    authority: "פנימי",
    subject: "הצהרת קרבה משפחתית — {{orgName}}",
    description: "הצהרת חבר ועד על קשרי משפחה בעמותה",
    recipientEmail: "",
    buildHtml: (p) =>
      wrap(`
        <h2 style="text-align:center;color:#1e293b;">הצהרה בדבר קרבה משפחתית</h2>
        <h3 style="text-align:center;color:#475569;">עמותת ${p.orgName} (${p.orgNumber})</h3>
        <br/>
        <p>אני, _______________, ת.ז. _______________, חבר/ת ועד מנהל בעמותת ${p.orgName}, מצהיר/ה כדלקמן:</p>
        <p>□ אין לי קרובי משפחה (מדרגה ראשונה או שנייה) המכהנים כחברי ועד, עובדים, או נותני שירותים לעמותה.</p>
        <p>□ יש לי קרובי משפחה כמפורט:</p>
        <table style="border-collapse:collapse;width:100%;">
          <tr style="background:#f8fafc;">
            <th style="border:1px solid #e2e8f0;padding:8px;text-align:right;">שם הקרוב</th>
            <th style="border:1px solid #e2e8f0;padding:8px;text-align:right;">קרבה</th>
            <th style="border:1px solid #e2e8f0;padding:8px;text-align:right;">תפקיד בעמותה</th>
          </tr>
          <tr>
            <td style="border:1px solid #e2e8f0;padding:8px;">_______________</td>
            <td style="border:1px solid #e2e8f0;padding:8px;">_______________</td>
            <td style="border:1px solid #e2e8f0;padding:8px;">_______________</td>
          </tr>
        </table>
        <br/>
        <p>תאריך: _______________ &nbsp;&nbsp; חתימה: _______________</p>`),
    buildText: (p) =>
      `הצהרת קרבה משפחתית — ${p.orgName}\n\nאני _____________ מצהיר/ה: אין / יש לי קרובי משפחה בעמותה.\n\nתאריך: _______________ חתימה: _______________`,
  },
  // 17. הצהרת העדר עבירות
  {
    key: "no_criminal_record_declaration",
    authority: "פנימי",
    subject: "הצהרת העדר עבירות — {{orgName}}",
    description: "הצהרת חבר ועד על העדר הרשעות פליליות",
    recipientEmail: "",
    buildHtml: (p) =>
      wrap(`
        <h2 style="text-align:center;color:#1e293b;">הצהרה בדבר העדר הרשעות</h2>
        <h3 style="text-align:center;color:#475569;">עמותת ${p.orgName} (${p.orgNumber})</h3>
        <br/>
        <p>אני, _______________, ת.ז. _______________, המכהן/ת כחבר/ת ועד מנהל בעמותת ${p.orgName}, מצהיר/ה כדלקמן:</p>
        <ol>
          <li>לא הורשעתי בעבירה שיש עמה קלון בחמש השנים שקדמו למועד הצהרה זו.</li>
          <li>אינני פסול/ה מלכהן כחבר/ת ועד מנהל של עמותה בהתאם לסעיף 33 לחוק העמותות.</li>
          <li>אם ישתנה מצבי בעניין זה, אודיע על כך מיידית לועד.</li>
        </ol>
        <br/>
        <p>תאריך: _______________ &nbsp;&nbsp; חתימה: _______________</p>`),
    buildText: (p) =>
      `הצהרת העדר עבירות — ${p.orgName}\n\nאני _____________ מצהיר/ה כי לא הורשעתי בעבירה שיש עמה קלון.\n\nתאריך: _______________ חתימה: _______________`,
  },
  // 18. קבלה על תרומה סעיף 46
  {
    key: "section46_receipt",
    authority: "פנימי",
    subject: "קבלה על תרומה לפי סעיף 46 — {{orgName}}",
    description: "קבלה רשמית לתורם — חובה לכלול ח\"פ/ת\"ז התורם ולדווח דיגיטלית במערכת \"תרומות ישראל\" (החל מ-2026)",
    recipientEmail: "",
    buildHtml: (p) =>
      wrap(`
        <h2 style="text-align:center;color:#1e293b;">קבלה על תרומה לפי סעיף 46 לפקודת מס הכנסה</h2>
        <h3 style="text-align:center;color:#475569;">עמותת ${p.orgName} (${p.orgNumber})</h3>
        <br/>
        <p style="background:#fef3c7;padding:10px;border-radius:6px;font-size:13px;">💡 <strong>חובת דיווח 2026:</strong> החל משנת 2026, כל תרומה (מעל 207 ₪ לזיכוי מס) חייבת לכלול מספר ח"פ/ת"ז של התורם ולהיות מדווחת דיגיטלית לרשות המסים במערכת <strong>"תרומות ישראל"</strong>. תקרת תרומה מזכה: 10,354,816 ₪ או 30% מההכנסה החייבת (הנמוך). זיכוי: 35%.</p>
        <br/>
        <p><strong>מספר קבלה:</strong> _______________</p>
        <p><strong>תאריך:</strong> _______________</p>
        <p><strong>שם התורם:</strong> _______________</p>
        <p><strong>ת.ז. / ח.פ. התורם:</strong> _______________ <span style="color:#dc2626;font-size:12px;">(חובה)</span></p>
        <p><strong>כתובת התורם:</strong> _______________</p>
        <p><strong>סכום התרומה:</strong> ₪_______________</p>
        <p><strong>אמצעי תשלום:</strong> _______________</p>
        <br/>
        <p>עמותת ${p.orgName} מאושרת כמוסד ציבורי לעניין סעיף 46 לפקודת מס הכנסה. תרומה זו מזכה את התורם בזיכוי ממס בהתאם להוראות החוק.</p>
        <br/>
        <p>חתימה: _______________ &nbsp;&nbsp; חותמת העמותה</p>`),
    buildText: (p) =>
      `קבלה על תרומה — ${p.orgName}\n\nמספר: _______________\nשם תורם: _______________\nת.ז./ח.פ. תורם: _______________ (חובה)\nסכום: ₪_______________\n\nהתרומה מזכה בזיכוי מס לפי סעיף 46.\nשים לב: החל מ-2026 חובה לדווח דיגיטלית במערכת "תרומות ישראל".`,
  },
  // 19. אישור התנדבות
  {
    key: "volunteer_certificate",
    authority: "פנימי",
    subject: "אישור התנדבות — {{orgName}}",
    description: "אישור רשמי למתנדב על שעות ופעילות ההתנדבות",
    recipientEmail: "",
    buildHtml: (p) =>
      wrap(`
        <h2 style="text-align:center;color:#1e293b;">אישור התנדבות</h2>
        <h3 style="text-align:center;color:#475569;">עמותת ${p.orgName} (${p.orgNumber})</h3>
        <br/>
        <p>ניתן בזה אישור כי:</p>
        <p><strong>שם המתנדב/ת:</strong> _______________</p>
        <p><strong>ת.ז.:</strong> _______________</p>
        <p><strong>תקופת התנדבות:</strong> מ-_______________ עד _______________</p>
        <p><strong>תחום פעילות:</strong> _______________</p>
        <p><strong>היקף שעות:</strong> כ-_______________ שעות בשבוע</p>
        <br/>
        <p>מתנדב/ת זו תרמ/ה רבות לפעילות העמותה ואנו מודים לו/ה על מסירותו/ה.</p>
        <br/>
        <p>${p.chairmanName ?? p.contactName}<br/>יו"ר ועד ${p.orgName}<br/>${p.contactPhone}</p>
        <p>תאריך: _______________ &nbsp;&nbsp; חותמת העמותה</p>`),
    buildText: (p) =>
      `אישור התנדבות — ${p.orgName}\n\nשם: _______________\nתקופה: _______________\nתחום: _______________\n\n${p.contactName}\nיו"ר ועד ${p.orgName}`,
  },
];

export function getTemplate(key: AuthorityEmailKey): AuthorityEmailTemplate | undefined {
  return AUTHORITY_TEMPLATES.find((t) => t.key === key);
}

export function buildSubject(template: AuthorityEmailTemplate, orgName: string): string {
  return template.subject.replace("{{orgName}}", orgName);
}
