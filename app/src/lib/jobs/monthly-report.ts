/**
 * Monthly Report Job — sends a full activity report on the 1st of every month.
 */
import { prisma } from "../prisma";
import { sendEmail } from "../email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://matefet-app.azurewebsites.net";

export async function runMonthlyReport() {
  console.log("[monthly-report] Starting...");

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthStart = lastMonth;
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const monthName = lastMonth.toLocaleDateString("he-IL", { month: "long", year: "numeric" });

  const organizations = await prisma.organization.findMany({
    include: {
      users: {
        where: { role: { in: ["MANAGER"] }, status: "APPROVED" },
        select: { email: true, name: true },
      },
    },
  });

  for (const org of organizations) {
    if (org.users.length === 0) continue;

    const [donationStats, volunteerHours, newDonors, meetingCount, transferStats] =
      await Promise.all([
        prisma.donation.aggregate({
          where: { organizationId: org.id, createdAt: { gte: monthStart, lte: monthEnd } },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.volunteer.count({
          where: { organizationId: org.id, status: "ACTIVE" },
        }),
        prisma.donor.count({
          where: { organizationId: org.id, createdAt: { gte: monthStart, lte: monthEnd } },
        }),
        prisma.boardMeeting.count({
          where: { organizationId: org.id, date: { gte: monthStart, lte: monthEnd } },
        }),
        prisma.bankTransfer.aggregate({
          where: { organizationId: org.id, createdAt: { gte: monthStart, lte: monthEnd } },
          _sum: { amount: true },
          _count: true,
        }),
      ]);

    const html = `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">
        <div style="background:linear-gradient(135deg,#0f766e,#14b8a6);padding:28px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">📈 דוח חודשי</h1>
          <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;">${org.name} | ${monthName}</p>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;">
          <div style="display:grid;gap:12px;">
            <div style="background:#f0fdf4;padding:16px;border-radius:8px;border-right:4px solid #22c55e;">
              <div style="font-size:12px;color:#166534;">💰 תרומות החודש</div>
              <div style="font-size:24px;font-weight:800;color:#14532d;">₪${Number(donationStats._sum.amount ?? 0).toLocaleString("he-IL")}</div>
              <div style="font-size:12px;color:#166534;">${donationStats._count} תרומות | ${newDonors} תורמים חדשים</div>
            </div>
            <div style="background:#eff6ff;padding:16px;border-radius:8px;border-right:4px solid #3b82f6;">
              <div style="font-size:12px;color:#1e40af;">🏛️ ישיבות ועד</div>
              <div style="font-size:24px;font-weight:800;color:#1e3a8a;">${meetingCount}</div>
            </div>
            <div style="background:#fefce8;padding:16px;border-radius:8px;border-right:4px solid #eab308;">
              <div style="font-size:12px;color:#713f12;">💸 העברות בנקאיות</div>
              <div style="font-size:24px;font-weight:800;color:#422006;">₪${Number(transferStats._sum.amount ?? 0).toLocaleString("he-IL")}</div>
              <div style="font-size:12px;color:#713f12;">${transferStats._count} העברות</div>
            </div>
            <div style="background:#fdf4ff;padding:16px;border-radius:8px;border-right:4px solid #a855f7;">
              <div style="font-size:12px;color:#581c87;">🙋 מתנדבים פעילים</div>
              <div style="font-size:24px;font-weight:800;color:#3b0764;">${volunteerHours}</div>
            </div>
          </div>
          <div style="margin-top:20px;text-align:center;">
            <a href="${APP_URL}/portal/reports" style="background:#0f766e;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;">דוח מלא ←</a>
          </div>
        </div>
        <div style="background:#f8fafc;padding:16px;border-radius:0 0 12px 12px;text-align:center;border:1px solid #e2e8f0;border-top:none;">
          <p style="margin:0;font-size:11px;color:#94a3b8;">מערכת מעטפת — דוח חודשי אוטומטי</p>
        </div>
      </div>`;

    for (const manager of org.users) {
      await sendEmail({
        to: manager.email,
        subject: `📈 דוח חודשי — ${org.name} | ${monthName}`,
        html,
      }).catch((err) => console.error(`[monthly-report] Email failed:`, err));
    }

    console.log(`[monthly-report] ✓ ${org.name}`);
  }

  console.log("[monthly-report] Done.");
}
