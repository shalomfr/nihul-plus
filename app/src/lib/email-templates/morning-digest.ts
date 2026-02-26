/**
 * Morning Digest email template — sent every day at 08:00 to all managers.
 */

export interface MorningDigestParams {
  orgName: string;
  managerName: string;
  date: string; // formatted date string e.g. "יום שלישי, 26 בפברואר 2026"
  bankBalance: number | null;
  bankName: string | null;
  pendingTransfers: number;
  upcomingDeadlines: Array<{
    name: string;
    dueDate: string;
    daysLeft: number;
  }>;
  alerts: Array<{
    type: "danger" | "warning" | "info";
    message: string;
  }>;
  appUrl: string;
}

export function morningDigestHtml(p: MorningDigestParams): string {
  const balance =
    p.bankBalance !== null
      ? `₪${p.bankBalance.toLocaleString("he-IL")}`
      : "לא מחובר";

  const deadlineRows = p.upcomingDeadlines
    .slice(0, 5)
    .map(
      (d) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;">${d.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">${d.dueDate}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:700;color:${d.daysLeft <= 7 ? "#ef4444" : d.daysLeft <= 30 ? "#f59e0b" : "#10b981"};">${d.daysLeft} ימים</td>
      </tr>`
    )
    .join("");

  const alertRows = p.alerts
    .slice(0, 3)
    .map(
      (a) => `
      <div style="padding:10px 14px;border-radius:8px;margin-bottom:8px;background:${a.type === "danger" ? "#fef2f2" : a.type === "warning" ? "#fffbeb" : "#eff6ff"};border-right:4px solid ${a.type === "danger" ? "#ef4444" : a.type === "warning" ? "#f59e0b" : "#3b82f6"}">
        <span style="font-size:13px;color:${a.type === "danger" ? "#b91c1c" : a.type === "warning" ? "#92400e" : "#1d4ed8"};">${a.message}</span>
      </div>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>דיג׳סט בוקר — ${p.orgName}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:16px 16px 0 0;padding:32px;text-align:center;">
              <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;">${p.date}</p>
              <h1 style="margin:8px 0 4px;color:#ffffff;font-size:24px;font-weight:800;">☀️ בוקר טוב, ${p.managerName}</h1>
              <p style="margin:0;color:rgba(255,255,255,0.9);font-size:14px;">${p.orgName}</p>
            </td>
          </tr>

          <!-- Stats row -->
          <tr>
            <td style="background:#ffffff;padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Bank balance -->
                  <td style="width:33%;padding:20px 16px;text-align:center;border-left:1px solid #f1f5f9;">
                    <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">💰 יתרת בנק</div>
                    <div style="font-size:22px;font-weight:800;color:#1e293b;">${balance}</div>
                    ${p.bankName ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px;">${p.bankName}</div>` : ""}
                  </td>
                  <!-- Pending transfers -->
                  <td style="width:33%;padding:20px 16px;text-align:center;border-left:1px solid #f1f5f9;">
                    <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">✍️ אישורים</div>
                    <div style="font-size:22px;font-weight:800;color:${p.pendingTransfers > 0 ? "#f59e0b" : "#10b981"};">${p.pendingTransfers}</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:2px;">העברות ממתינות</div>
                  </td>
                  <!-- Upcoming deadlines -->
                  <td style="width:33%;padding:20px 16px;text-align:center;">
                    <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">📅 דדליינים</div>
                    <div style="font-size:22px;font-weight:800;color:${p.upcomingDeadlines.length > 0 ? "#f59e0b" : "#10b981"};">${p.upcomingDeadlines.length}</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:2px;">ב-30 הימים הקרובים</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Alerts -->
          ${
            p.alerts.length > 0
              ? `<tr>
            <td style="background:#ffffff;padding:0 24px 16px;">
              <div style="border-top:1px solid #f1f5f9;padding-top:16px;">
                <h3 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1e293b;">🚨 התראות</h3>
                ${alertRows}
              </div>
            </td>
          </tr>`
              : ""
          }

          <!-- Upcoming deadlines table -->
          ${
            p.upcomingDeadlines.length > 0
              ? `<tr>
            <td style="background:#ffffff;padding:0 24px 16px;">
              <div style="border-top:1px solid #f1f5f9;padding-top:16px;">
                <h3 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1e293b;">📋 דדליינים קרובים</h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #f1f5f9;">
                  <tr style="background:#f8fafc;">
                    <th style="padding:8px 12px;text-align:right;font-size:12px;color:#64748b;font-weight:600;">פריט</th>
                    <th style="padding:8px 12px;text-align:right;font-size:12px;color:#64748b;font-weight:600;">תאריך</th>
                    <th style="padding:8px 12px;text-align:right;font-size:12px;color:#64748b;font-weight:600;">נותר</th>
                  </tr>
                  ${deadlineRows}
                </table>
              </div>
            </td>
          </tr>`
              : ""
          }

          <!-- CTA Button -->
          <tr>
            <td style="background:#ffffff;padding:16px 24px 32px;text-align:center;">
              <a href="${p.appUrl}/portal" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.3px;">כניסה למערכת ←</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:20px 24px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">מערכת מעטפת — ניהול עמותות אוטומטי 100%</p>
              <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">הודעה זו נשלחת אוטומטית כל בוקר בשעה 08:00</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
