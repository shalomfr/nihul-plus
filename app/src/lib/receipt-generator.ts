/**
 * Receipt Generator — Section 46 (סעיף 46) tax receipt for donations.
 * Produces a professional Hebrew HTML receipt that:
 *  - Can be printed by the donor
 *  - Complies with Israeli tax law (Income Tax Ordinance § 46)
 *  - Is emailed automatically on donation.created
 */

export interface ReceiptParams {
  receiptNumber: number;
  donorName: string;
  donorId?: string;       // t.z. / passport
  donorAddress?: string;
  donorEmail?: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  donatedAt: Date;
  organizationName: string;
  organizationNumber: string;  // ע"ר מספר
  organizationAddress?: string;
  organizationPhone?: string;
  section46Approved?: boolean; // has current § 46 approval
}

/** Convert number to Hebrew words (for legal receipts) */
function amountInWords(n: number): string {
  const ones = ["", "אחד", "שניים", "שלושה", "ארבעה", "חמישה", "שישה", "שבעה", "שמונה", "תשעה",
    "עשרה", "אחד עשר", "שניים עשר", "שלושה עשר", "ארבעה עשר", "חמישה עשר",
    "שישה עשר", "שבעה עשר", "שמונה עשר", "תשעה עשר"];
  const tens = ["", "", "עשרים", "שלושים", "ארבעים", "חמישים", "שישים", "שבעים", "שמונים", "תשעים"];

  const intN = Math.floor(n);
  if (intN === 0) return "אפס";
  if (intN < 20) return ones[intN];
  if (intN < 100) {
    const t = tens[Math.floor(intN / 10)];
    const o = ones[intN % 10];
    return o ? `${t} ו${o}` : t;
  }
  if (intN < 1000) {
    const h = Math.floor(intN / 100);
    const rest = intN % 100;
    const hWord = h === 1 ? "מאה" : h === 2 ? "מאתיים" : `${ones[h]} מאות`;
    return rest ? `${hWord} ו${amountInWords(rest)}` : hWord;
  }
  if (intN < 10000) {
    const th = Math.floor(intN / 1000);
    const rest = intN % 1000;
    const thWord = th === 1 ? "אלף" : th === 2 ? "אלפיים" : `${ones[th]} אלפים`;
    return rest ? `${thWord} ו${amountInWords(rest)}` : thWord;
  }
  // Fallback for large numbers
  return `${intN.toLocaleString("he-IL")}`;
}

const fmtDate = (d: Date) =>
  d.toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" });

const fmtMoney = (n: number, currency = "ILS") =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency, minimumFractionDigits: 0 }).format(n);

const methodLabel: Record<string, string> = {
  CASH: "מזומן",
  CHECK: "שיק",
  BANK_TRANSFER: "העברה בנקאית",
  CREDIT_CARD: "כרטיס אשראי",
  CRYPTO: "מטבע דיגיטלי",
  OTHER: "אחר",
};

export function generateReceiptHtml(p: ReceiptParams): string {
  const receiptId = String(p.receiptNumber).padStart(6, "0");
  const dateStr = fmtDate(p.donatedAt);
  const amountWords = amountInWords(p.amount);
  const currency = p.currency ?? "ILS";

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>קבלה מס׳ ${receiptId} — ${p.organizationName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 13px;
      color: #1e293b;
      background: #fff;
      direction: rtl;
    }
    .page {
      max-width: 720px;
      margin: 0 auto;
      padding: 32px;
      border: 2px solid #1e40af;
      border-radius: 8px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    .org-info h1 {
      font-size: 20px;
      font-weight: bold;
      color: #1e40af;
    }
    .org-info p { font-size: 12px; color: #64748b; margin-top: 2px; }
    .receipt-badge {
      background: #1e40af;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      text-align: center;
    }
    .receipt-badge .label { font-size: 11px; opacity: 0.8; }
    .receipt-badge .number { font-size: 22px; font-weight: bold; }
    .section46-banner {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 20px;
      font-size: 12px;
      color: #1e40af;
      font-weight: bold;
      text-align: center;
    }
    table.details {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    table.details td {
      padding: 6px 8px;
      border-bottom: 1px solid #f1f5f9;
    }
    table.details td:first-child {
      color: #64748b;
      font-size: 12px;
      width: 140px;
    }
    table.details td:last-child {
      font-weight: 600;
    }
    .amount-box {
      background: #f0fdf4;
      border: 2px solid #bbf7d0;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 20px;
      text-align: center;
    }
    .amount-box .amount {
      font-size: 32px;
      font-weight: bold;
      color: #16a34a;
    }
    .amount-box .words {
      font-size: 13px;
      color: #374151;
      margin-top: 4px;
    }
    .legal-text {
      background: #fefce8;
      border: 1px solid #fde68a;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 20px;
      font-size: 11px;
      color: #78350f;
      line-height: 1.6;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }
    .signature-area {
      text-align: center;
    }
    .signature-line {
      width: 160px;
      border-bottom: 1px solid #64748b;
      margin-bottom: 4px;
    }
    .signature-label { font-size: 11px; color: #64748b; }
    .generated-by {
      font-size: 10px;
      color: #94a3b8;
      text-align: left;
    }
    @media print {
      body { background: white; }
      .page { border: 2px solid #1e40af; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="org-info">
      <h1>${p.organizationName}</h1>
      <p>ע"ר מספר: ${p.organizationNumber}</p>
      ${p.organizationAddress ? `<p>${p.organizationAddress}</p>` : ""}
      ${p.organizationPhone ? `<p>טל׳: ${p.organizationPhone}</p>` : ""}
    </div>
    <div class="receipt-badge">
      <div class="label">קבלה / Receipt</div>
      <div class="number">${receiptId}</div>
      <div class="label">${dateStr}</div>
    </div>
  </div>

  ${p.section46Approved !== false ? `
  <div class="section46-banner">
    ✅ אישור תרומה לצורכי מס — סעיף 46 לפקודת מס הכנסה
  </div>` : ""}

  <div class="amount-box">
    <div class="amount">${fmtMoney(p.amount, currency)}</div>
    <div class="words">(${amountWords} שקלים חדשים)</div>
  </div>

  <table class="details">
    <tr>
      <td>שם התורם</td>
      <td>${p.donorName}</td>
    </tr>
    ${p.donorId ? `<tr><td>ת.ז. / דרכון</td><td>${p.donorId}</td></tr>` : ""}
    ${p.donorAddress ? `<tr><td>כתובת</td><td>${p.donorAddress}</td></tr>` : ""}
    ${p.donorEmail ? `<tr><td>דוא"ל</td><td>${p.donorEmail}</td></tr>` : ""}
    <tr>
      <td>תאריך תרומה</td>
      <td>${dateStr}</td>
    </tr>
    <tr>
      <td>אמצעי תשלום</td>
      <td>${methodLabel[p.paymentMethod ?? ""] ?? p.paymentMethod ?? "—"}</td>
    </tr>
    <tr>
      <td>מקבל התרומה</td>
      <td>${p.organizationName} (ע"ר ${p.organizationNumber})</td>
    </tr>
  </table>

  <div class="legal-text">
    <strong>הצהרת העמותה:</strong> אנו מאשרים בזאת כי קיבלנו מ<strong>${p.donorName}</strong> תרומה
    בסך <strong>${fmtMoney(p.amount, currency)}</strong> (${amountWords} שקלים חדשים) בתאריך ${dateStr}.
    עמותת ${p.organizationName} מחזיקה באישור בתוקף לפי סעיף 46 לפקודת מס הכנסה,
    המאפשר לתורמים לקבל זיכוי ממס בגין תרומות.
    קבלה זו תקפה לצורכי מס בהתאם לתקנות.
  </div>

  <div class="footer">
    <div class="signature-area">
      <div class="signature-line"></div>
      <div class="signature-label">חתימה וחותמת</div>
    </div>
    <div class="generated-by">
      הופק אוטומטית ב-${fmtDate(new Date())}<br/>
      מערכת מעטפת — ניהול עמותות
    </div>
  </div>
</div>
</body>
</html>`;
}

/** Minimal text version (for email subject/snippet) */
export function generateReceiptText(p: ReceiptParams): string {
  const receiptId = String(p.receiptNumber).padStart(6, "0");
  return [
    `קבלה מס׳ ${receiptId}`,
    `תורם: ${p.donorName}`,
    `סכום: ₪${p.amount.toLocaleString("he-IL")}`,
    `תאריך: ${fmtDate(p.donatedAt)}`,
    `ארגון: ${p.organizationName} (ע"ר ${p.organizationNumber})`,
    ``,
    `אישור תרומה לצורכי מס — סעיף 46 לפקודת מס הכנסה`,
  ].join("\n");
}
