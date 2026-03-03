import nodemailer from "nodemailer";

const transport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  const from = options.from ?? process.env.EMAIL_FROM ?? "noreply@maatafet.co.il";

  if (!transport) {
    return { messageId: `dev-${Date.now()}` };
  }

  return transport.sendMail({ from, to: options.to, subject: options.subject, html: options.html });
}

// Template helpers

export function donationReceiptHtml(params: {
  donorName: string;
  amount: number;
  receiptNumber: number;
  organizationName: string;
  date: string;
}) {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">קבלה מס׳ ${params.receiptNumber}</h2>
      <p>שלום ${params.donorName},</p>
      <p>תודה על תרומתך בסך <strong>₪${params.amount.toLocaleString()}</strong> לטובת ${params.organizationName}.</p>
      <p>תאריך: ${params.date}</p>
      <hr style="border: 1px solid #e8ecf4;" />
      <p style="color: #64748b; font-size: 12px;">מסמך זה הופק אוטומטית על ידי מערכת מעטפת</p>
    </div>
  `;
}

export function complianceReminderHtml(params: {
  itemName: string;
  dueDate: string;
  organizationName: string;
  daysLeft: number;
}) {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f59e0b;">⚠️ תזכורת ניהול תקין</h2>
      <p>שלום,</p>
      <p>נותרו <strong>${params.daysLeft} ימים</strong> עד תום התוקף של: <strong>${params.itemName}</strong></p>
      <p>ארגון: ${params.organizationName}</p>
      <p>תאריך יעד: ${params.dueDate}</p>
      <hr style="border: 1px solid #e8ecf4;" />
      <p style="color: #64748b; font-size: 12px;">מערכת מעטפת - ניהול תקין אוטומטי</p>
    </div>
  `;
}

export function meetingSummaryHtml(params: {
  title: string;
  date: string;
  summary: string;
  resolutions: string[];
}) {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">סיכום ישיבת ועד</h2>
      <p><strong>${params.title}</strong> — ${params.date}</p>
      <p>${params.summary}</p>
      ${params.resolutions.length > 0 ? `
        <h3>החלטות:</h3>
        <ul>${params.resolutions.map(r => `<li>${r}</li>`).join("")}</ul>
      ` : ""}
      <hr style="border: 1px solid #e8ecf4;" />
      <p style="color: #64748b; font-size: 12px;">מערכת מעטפת</p>
    </div>
  `;
}
