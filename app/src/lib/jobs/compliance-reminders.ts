/**
 * Compliance Reminders Job — sends alerts for upcoming deadlines.
 * Runs at 08:30 every morning.
 * Reminder schedule: 90, 60, 30, 14, 7, 3, 1 days before deadline.
 */
import { prisma } from "../prisma";
import { sendEmail } from "../email";
import { complianceReminderHtml } from "../email";

const REMINDER_DAYS = [90, 60, 30, 14, 7, 3, 1];
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://matefet-app.azurewebsites.net";

export async function runComplianceReminders() {
  console.log("[compliance-reminders] Starting...");

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let sent = 0;

  for (const daysLeft of REMINDER_DAYS) {
    const targetDate = new Date(now.getTime() + daysLeft * 24 * 60 * 60 * 1000);
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const items = await prisma.complianceItem.findMany({
      where: {
        status: { not: "OK" },
        dueDate: { gte: dayStart, lte: dayEnd },
      },
      include: {
        organization: {
          include: {
            users: {
              where: { role: { in: ["MANAGER"] }, status: "APPROVED" },
              select: { email: true, name: true },
            },
          },
        },
      },
    });

    for (const item of items) {
      for (const manager of item.organization.users) {
        try {
          await sendEmail({
            to: manager.email,
            subject: `⚠️ תזכורת ניהול תקין — ${item.name} (${daysLeft} ימים)`,
            html: complianceReminderHtml({
              itemName: item.name,
              dueDate: item.dueDate?.toLocaleDateString("he-IL") ?? "",
              organizationName: item.organization.name,
              daysLeft,
            }) + `
              <div dir="rtl" style="margin-top:16px;text-align:center;">
                <a href="${APP_URL}/portal/status" style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;">פתח במערכת ←</a>
              </div>`,
          });
          sent++;
        } catch (err) {
          console.error(`[compliance-reminders] Email failed for ${manager.email}:`, err);
        }
      }
    }
  }

  // Also find overdue items (past due date, not yet OK) and send urgent alerts
  const overdueItems = await prisma.complianceItem.findMany({
    where: {
      status: { in: ["EXPIRED", "WARNING", "MISSING"] },
      dueDate: { lt: now },
    },
    include: {
      organization: {
        include: {
          users: {
            where: { role: { in: ["MANAGER"] }, status: "APPROVED" },
            select: { email: true, name: true },
          },
        },
      },
    },
    take: 50,
  });

  for (const item of overdueItems) {
    for (const manager of item.organization.users) {
      try {
        const daysOverdue = Math.floor((now.getTime() - (item.dueDate?.getTime() ?? 0)) / (1000 * 60 * 60 * 24));
        await sendEmail({
          to: manager.email,
          subject: `🚨 דחוף: ${item.name} — באיחור של ${daysOverdue} ימים!`,
          html: complianceReminderHtml({
            itemName: item.name,
            dueDate: item.dueDate?.toLocaleDateString("he-IL") ?? "",
            organizationName: item.organization.name,
            daysLeft: -daysOverdue,
          }),
        });
        sent++;
      } catch (err) {
        console.error(`[compliance-reminders] Overdue email failed:`, err);
      }
    }
  }

  console.log(`[compliance-reminders] Done. Sent ${sent} reminders.`);
}
