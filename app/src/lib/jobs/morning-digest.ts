/**
 * Morning Digest Job — sends daily summary to all managers at 08:00.
 * Includes: bank balance, pending transfers, upcoming deadlines, alerts.
 */
import { prisma } from "../prisma";
import { sendEmail } from "../email";
import { sendWhatsApp, buildMorningDigestWhatsApp } from "../whatsapp";
import { morningDigestHtml } from "../email-templates/morning-digest";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://matefet-app.azurewebsites.net";

export async function runMorningDigest() {
  console.log("[morning-digest] Starting...");

  // Get all active organizations with their managers
  const organizations = await prisma.organization.findMany({
    include: {
      users: {
        where: { role: { in: ["MANAGER"] }, status: "APPROVED" },
        select: { id: true, name: true, email: true },
      },
    },
  });

  for (const org of organizations) {
    if (org.users.length === 0) continue;

    try {
      const digest = await buildDigestData(org.id);

      // Send WhatsApp to board members who have phones (since User has no phone field)
      const boardMembersWithPhone = await prisma.boardMember.findMany({
        where: { organizationId: org.id, isActive: true, phone: { not: null } },
        select: { phone: true },
      });
      for (const bm of boardMembersWithPhone) {
        if (!bm.phone) continue;
        const wa = buildMorningDigestWhatsApp({
          orgName: org.name,
          bankBalance: digest.bankBalance,
          pendingTransfers: digest.pendingTransfers,
          upcomingDeadlines: digest.upcomingDeadlines.length,
          alerts: digest.alerts.length,
          appUrl: APP_URL,
        });
        await sendWhatsApp(bm.phone, wa).catch((err) =>
          console.error(`[morning-digest] WhatsApp failed to ${bm.phone}:`, err)
        );
      }

      for (const manager of org.users) {
        // Build Hebrew date string
        const now = new Date();
        const hebrewDate = now.toLocaleDateString("he-IL", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        // Send email
        await sendEmail({
          to: manager.email,
          subject: `☀️ דיג׳סט בוקר — ${org.name} | ${now.toLocaleDateString("he-IL")}`,
          html: morningDigestHtml({
            orgName: org.name,
            managerName: manager.name ?? "מנהל",
            date: hebrewDate,
            bankBalance: digest.bankBalance,
            bankName: digest.bankName,
            pendingTransfers: digest.pendingTransfers,
            upcomingDeadlines: digest.upcomingDeadlines,
            alerts: digest.alerts,
            appUrl: APP_URL,
          }),
        }).catch((err) => console.error(`[morning-digest] Email failed for ${manager.email}:`, err));
      }

      console.log(`[morning-digest] ✓ ${org.name} (${org.users.length} managers)`);
    } catch (err) {
      console.error(`[morning-digest] ✗ ${org.name}:`, err);
    }
  }

  console.log("[morning-digest] Done.");
}

async function buildDigestData(orgId: string) {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [latestAccount, pendingTransferCount, upcomingComplianceItems] = await Promise.all([
    // Latest bank account balance
    prisma.bankAccount.findFirst({
      where: { organizationId: orgId },
      orderBy: { updatedAt: "desc" },
      select: { balance: true, bankName: true },
    }),
    // Pending transfer approvals
    prisma.bankTransfer.count({
      where: { organizationId: orgId, status: "PENDING_APPROVAL" },
    }),
    // Upcoming compliance deadlines
    prisma.complianceItem.findMany({
      where: {
        organizationId: orgId,
        status: { not: "OK" },
        dueDate: { gte: now, lte: in30Days },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: { name: true, dueDate: true, status: true },
    }),
  ]);

  const alerts: Array<{ type: "danger" | "warning" | "info"; message: string }> = [];

  // Add alerts for overdue items
  const overdueCount = await prisma.complianceItem.count({
    where: { organizationId: orgId, status: "EXPIRED", dueDate: { lt: now } },
  });
  if (overdueCount > 0) {
    alerts.push({ type: "danger", message: `${overdueCount} פריטי ניהול תקין באיחור — דורשים טיפול מיידי` });
  }

  if (pendingTransferCount > 0) {
    alerts.push({ type: "warning", message: `${pendingTransferCount} העברות בנקאיות ממתינות לאישורך` });
  }

  const upcomingDeadlines = upcomingComplianceItems.map((item) => {
    const dueDate = item.dueDate ?? new Date();
    const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      name: item.name,
      dueDate: dueDate.toLocaleDateString("he-IL"),
      daysLeft,
    };
  });

  return {
    bankBalance: latestAccount ? Number(latestAccount.balance) : null,
    bankName: latestAccount?.bankName ?? null,
    pendingTransfers: pendingTransferCount,
    upcomingDeadlines,
    alerts,
  };
}
