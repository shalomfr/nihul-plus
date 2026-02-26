/**
 * Weekly Report Job — sends a weekly summary to all managers every Sunday at 09:00.
 */
import { prisma } from "../prisma";
import { sendEmail } from "../email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://matefet-app.azurewebsites.net";

export async function runWeeklyReport() {
  console.log("[weekly-report] Starting...");

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

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

    const [donationStats, meetingCount, transferCount] = await Promise.all([
      prisma.donation.aggregate({
        where: { organizationId: org.id, createdAt: { gte: weekAgo } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.boardMeeting.count({
        where: { organizationId: org.id, date: { gte: weekAgo } },
      }),
      prisma.bankTransfer.count({
        where: { organizationId: org.id, createdAt: { gte: weekAgo } },
      }),
    ]);

    const totalDonations = Number(donationStats._sum.amount ?? 0);
    const donationCount = donationStats._count;

    const html = `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">
        <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:28px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">📊 דוח שבועי</h1>
          <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;font-size:13px;">${org.name} | שבוע ${weekAgo.toLocaleDateString("he-IL")} – ${now.toLocaleDateString("he-IL")}</p>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;">
          <h3 style="margin:0 0 16px;font-size:15px;">סיכום השבוע</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr style="background:#f8fafc;">
              <td style="padding:12px;border:1px solid #e2e8f0;font-size:13px;">💰 תרומות</td>
              <td style="padding:12px;border:1px solid #e2e8f0;font-size:13px;font-weight:700;">₪${totalDonations.toLocaleString("he-IL")} (${donationCount} תרומות)</td>
            </tr>
            <tr>
              <td style="padding:12px;border:1px solid #e2e8f0;font-size:13px;">🏛️ ישיבות ועד</td>
              <td style="padding:12px;border:1px solid #e2e8f0;font-size:13px;font-weight:700;">${meetingCount} ישיבות</td>
            </tr>
            <tr style="background:#f8fafc;">
              <td style="padding:12px;border:1px solid #e2e8f0;font-size:13px;">💸 העברות בנקאיות</td>
              <td style="padding:12px;border:1px solid #e2e8f0;font-size:13px;font-weight:700;">${transferCount} העברות</td>
            </tr>
          </table>
          <div style="margin-top:20px;text-align:center;">
            <a href="${APP_URL}/portal/reports" style="background:#7c3aed;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;">דוח מלא ←</a>
          </div>
        </div>
        <div style="background:#f8fafc;padding:16px;border-radius:0 0 12px 12px;text-align:center;border:1px solid #e2e8f0;border-top:none;">
          <p style="margin:0;font-size:11px;color:#94a3b8;">מערכת מעטפת — דוח שבועי אוטומטי</p>
        </div>
      </div>`;

    for (const manager of org.users) {
      await sendEmail({
        to: manager.email,
        subject: `📊 דוח שבועי — ${org.name}`,
        html,
      }).catch((err) => console.error(`[weekly-report] Email failed for ${manager.email}:`, err));
    }

    console.log(`[weekly-report] ✓ ${org.name}`);
  }

  console.log("[weekly-report] Done.");
}
