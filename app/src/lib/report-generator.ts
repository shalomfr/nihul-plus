/**
 * Report Generator — builds HTML annual report for the Registrar of Associations.
 * Used by /api/reports/annual and printable in-browser.
 */
import { prisma } from "./prisma";

export async function generateAnnualReportHtml(
  organizationId: string,
  year: number
): Promise<string> {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);

  // Fetch all data in parallel
  const [org, donations, expenses, members, volunteers, compliance, transfers] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: { where: { role: "MANAGER", status: "APPROVED" }, select: { name: true, email: true } },
      },
    }),
    prisma.donation.findMany({
      where: { organizationId, donatedAt: { gte: yearStart, lte: yearEnd }, status: "COMPLETED" },
      include: { campaign: true },
    }),
    prisma.expense.findMany({
      where: { organizationId, expenseDate: { gte: yearStart, lte: yearEnd } },
    }),
    prisma.boardMember.findMany({
      where: { organizationId },
    }),
    prisma.volunteer.findMany({
      where: { organizationId },
    }),
    prisma.complianceItem.findMany({ where: { organizationId } }),
    prisma.bankTransfer.findMany({
      where: { organizationId, createdAt: { gte: yearStart, lte: yearEnd } },
    }),
  ]);

  if (!org) throw new Error("ארגון לא נמצא");

  const fmt = (n: number) =>
    new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", minimumFractionDigits: 0 }).format(n);

  const totalDonations = donations.reduce((s, d) => s + d.amount, 0);
  const totalExpenses = expenses.filter(e => ["PAID", "APPROVED"].includes(e.status)).reduce((s, e) => s + e.amount, 0);
  const surplus = totalDonations - totalExpenses;

  // Expenses by category
  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
  }
  const categoryLabels: Record<string, string> = {
    SALARIES: "משכורות", RENT: "שכירות", ACTIVITIES: "פעילויות",
    MARKETING: "שיווק", ADMINISTRATION: "הנהלה וכלליות",
    TRANSPORTATION: "תחבורה", SUPPLIES: "ציוד",
    PROFESSIONAL_SERVICES: "שירותים מקצועיים", INSURANCE: "ביטוח",
    MAINTENANCE: "תחזוקה", OTHER: "אחר",
  };

  const activeVolunteers = volunteers.filter(v => v.status === "ACTIVE");
  const activeMembers = members.filter(m => m.isActive);

  const now = new Date();
  const reportDate = now.toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" });

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <title>דוח שנתי ${year} — ${org.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1e293b; background: #fff; direction: rtl; }
    .page { max-width: 900px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 28px; color: #1e40af; margin-bottom: 4px; }
    h2 { font-size: 18px; color: #1e293b; margin: 28px 0 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
    h3 { font-size: 14px; color: #374151; margin: 16px 0 8px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .header-left { }
    .header-right { text-align: left; color: #64748b; font-size: 12px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
    .kpi-card .value { font-size: 22px; font-weight: bold; color: #1e40af; }
    .kpi-card .label { font-size: 11px; color: #64748b; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f1f5f9; text-align: right; padding: 8px 10px; font-size: 12px; color: #475569; }
    td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
    .surplus-positive { color: #16a34a; font-weight: bold; }
    .surplus-negative { color: #dc2626; font-weight: bold; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; }
    .badge-ok { background: #d1fae5; color: #065f46; }
    .badge-warn { background: #fef3c7; color: #92400e; }
    .badge-bad { background: #fee2e2; color: #991b1b; }
    @media print { body { background: white; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <h1>${org.name}</h1>
      <p style="color:#64748b;font-size:13px;">ע"ר מספר: ${org.number ?? "—"}</p>
      ${org.address ? `<p style="color:#64748b;font-size:12px;">${org.address}</p>` : ""}
    </div>
    <div class="header-right">
      <div style="font-size:22px;font-weight:bold;color:#1e40af;">דוח שנתי ${year}</div>
      <div style="margin-top:4px;">הופק: ${reportDate}</div>
      <div>לשנת פעילות: 01/01/${year} — 31/12/${year}</div>
    </div>
  </div>

  <!-- KPIs -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="value">${fmt(totalDonations)}</div>
      <div class="label">סך הכנסות</div>
    </div>
    <div class="kpi-card">
      <div class="value">${fmt(totalExpenses)}</div>
      <div class="label">סך הוצאות</div>
    </div>
    <div class="kpi-card">
      <div class="value ${surplus >= 0 ? "surplus-positive" : "surplus-negative"}">${fmt(surplus)}</div>
      <div class="label">${surplus >= 0 ? "עודף" : "גירעון"}</div>
    </div>
    <div class="kpi-card">
      <div class="value">${donations.length}</div>
      <div class="label">תרומות שהתקבלו</div>
    </div>
  </div>

  <!-- Financial Summary -->
  <h2>📊 סיכום כספי לשנת ${year}</h2>
  <table>
    <thead>
      <tr>
        <th>קטגוריית הוצאה</th>
        <th style="text-align:left;">סכום</th>
        <th style="text-align:left;">אחוז מסך</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(byCategory)
        .sort(([, a], [, b]) => b - a)
        .map(([cat, amt]) => `
      <tr>
        <td>${categoryLabels[cat] ?? cat}</td>
        <td style="text-align:left;">${fmt(amt)}</td>
        <td style="text-align:left;">${totalExpenses > 0 ? ((amt / totalExpenses) * 100).toFixed(1) : "0"}%</td>
      </tr>`).join("")}
      <tr style="font-weight:bold;background:#f8fafc;">
        <td>סך הכל הוצאות</td>
        <td style="text-align:left;">${fmt(totalExpenses)}</td>
        <td style="text-align:left;">100%</td>
      </tr>
    </tbody>
  </table>

  <!-- Board Members -->
  <h2>👥 חברי ועד מנהל</h2>
  <table>
    <thead>
      <tr>
        <th>שם</th>
        <th>תפקיד</th>
        <th>מ-</th>
        <th>סטטוס</th>
      </tr>
    </thead>
    <tbody>
      ${members.map(m => `
      <tr>
        <td>${m.name}</td>
        <td>${m.role}</td>
        <td>${m.startDate ? new Date(m.startDate).toLocaleDateString("he-IL") : "—"}</td>
        <td><span class="badge ${m.isActive ? "badge-ok" : "badge-bad"}">${m.isActive ? "פעיל" : "לא פעיל"}</span></td>
      </tr>`).join("")}
    </tbody>
  </table>

  <!-- Volunteers -->
  <h2>🤝 מתנדבים</h2>
  <table>
    <thead><tr><th>נתון</th><th>ערך</th></tr></thead>
    <tbody>
      <tr><td>סך מתנדבים</td><td>${volunteers.length}</td></tr>
      <tr><td>מתנדבים פעילים</td><td>${activeVolunteers.length}</td></tr>
    </tbody>
  </table>

  <!-- Compliance -->
  <h2>✅ ניהול תקין ורגולציה</h2>
  <table>
    <thead>
      <tr>
        <th>פריט</th>
        <th>תוקף</th>
        <th>סטטוס</th>
      </tr>
    </thead>
    <tbody>
      ${compliance.map(c => `
      <tr>
        <td>${c.name}</td>
        <td>${c.dueDate ? new Date(c.dueDate).toLocaleDateString("he-IL") : "—"}</td>
        <td><span class="badge ${
          c.status === "OK" ? "badge-ok" :
          c.status === "WARNING" ? "badge-warn" : "badge-bad"
        }">${c.status === "OK" ? "תקין" : c.status === "WARNING" ? "בקרוב" : "בפיגור"}</span></td>
      </tr>`).join("")}
    </tbody>
  </table>

  <!-- Transfers summary -->
  ${transfers.length > 0 ? `
  <h2>💸 העברות בנקאיות</h2>
  <table>
    <thead><tr><th>נתון</th><th>ערך</th></tr></thead>
    <tbody>
      <tr><td>מספר העברות</td><td>${transfers.length}</td></tr>
      <tr><td>סכום כולל</td><td>${fmt(transfers.reduce((s, t) => s + t.amount, 0))}</td></tr>
      <tr><td>מאושרות ובוצעו</td><td>${transfers.filter(t => t.status === "EXECUTED").length}</td></tr>
    </tbody>
  </table>` : ""}

  <!-- Signature -->
  <div style="margin-top:40px;display:flex;justify-content:space-between;">
    <div style="text-align:center;">
      <div style="width:200px;border-bottom:1px solid #64748b;margin-bottom:4px;"></div>
      <div style="font-size:11px;color:#64748b;">חתימת יו"ר הועד</div>
    </div>
    <div style="text-align:center;">
      <div style="width:200px;border-bottom:1px solid #64748b;margin-bottom:4px;"></div>
      <div style="font-size:11px;color:#64748b;">חתימת גזבר</div>
    </div>
    <div style="text-align:center;">
      <div style="width:200px;border-bottom:1px solid #64748b;margin-bottom:4px;"></div>
      <div style="font-size:11px;color:#64748b;">חתימת רואה חשבון</div>
    </div>
  </div>

  <div class="footer">
    דוח זה הופק אוטומטית ע"י מערכת מעטפת — ניהול עמותות אוטומטי<br/>
    ${reportDate}
  </div>
</div>
</body>
</html>`;
}
