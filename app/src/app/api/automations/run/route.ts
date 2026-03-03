/**
 * POST /api/automations/run
 * Allows managers to manually trigger automation jobs on-demand.
 * Body: { action: string }
 */
import { prisma } from "@/lib/prisma";
import { requireManager, apiResponse, apiError, withErrorHandler } from "@/lib/api-helpers";
import { sendEmail } from "@/lib/email";
import { runMorningDigest } from "@/lib/jobs/morning-digest";
import { runComplianceReminders } from "@/lib/jobs/compliance-reminders";
import { runWeeklyReport } from "@/lib/jobs/weekly-report";
import { generateReceiptHtml } from "@/lib/receipt-generator";

type AutomationAction =
  | "morning_digest"
  | "compliance_reminders"
  | "weekly_report"
  | "thank_donors"
  | "send_missing_receipts";

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireManager();
  const body = await req.json();
  const { action } = body as { action: AutomationAction };

  if (!action) return apiError("action חסר", 400);

  let result: string;

  switch (action) {
    case "morning_digest": {
      await runMorningDigest();
      result = "דיג׳סט בוקר נשלח לכל המנהלים";
      break;
    }

    case "compliance_reminders": {
      await runComplianceReminders();
      result = "תזכורות ניהול תקין נשלחו";
      break;
    }

    case "weekly_report": {
      await runWeeklyReport();
      result = "דוח שבועי נשלח";
      break;
    }

    case "thank_donors": {
      // Send thank-you email to all donors who donated this year
      const yearStart = new Date(new Date().getFullYear(), 0, 1);
      const donations = await prisma.donation.findMany({
        where: {
          organizationId: user.organizationId!,
          donatedAt: { gte: yearStart },
          status: "COMPLETED",
        },
        include: { donor: true, organization: true },
        distinct: ["donorId"],
      });

      const org = donations[0]?.organization;
      let sent = 0;

      for (const d of donations) {
        if (!d.donor?.email) continue;
        await sendEmail({
          to: d.donor.email,
          subject: `תודה על תרומתך — ${d.organization.name}`,
          html: `
<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <h2 style="color:#1e40af;">💙 תודה מעומק הלב</h2>
  <p>שלום ${d.donor.firstName},</p>
  <p>תודה על תמיכתך ועל תרומתך השנה לטובת <strong>${d.organization.name}</strong>.</p>
  <p>בזכות תורמים כמוך אנו יכולים להמשיך בפעילותנו ולהשפיע.</p>
  <p>בהוקרה,<br/>צוות ${d.organization.name}</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
  <p style="font-size:11px;color:#94a3b8;">מופק אוטומטית ע"י מערכת מעטפת</p>
</div>`,
        }).catch(() => {});
        sent++;
      }
      result = `מיילי תודה נשלחו ל-${sent} תורמים`;
      break;
    }

    case "send_missing_receipts": {
      // Find donations without receipt sent, send them now
      const donations = await prisma.donation.findMany({
        where: {
          organizationId: user.organizationId!,
          status: "COMPLETED",
          receiptId: null,
        },
        include: {
          donor: true,
          organization: true,
        },
        take: 50,
      });

      let sent = 0;
      for (const donation of donations) {
        if (!donation.donor?.email) continue;

        const receiptNumber = await prisma.donation.count({
          where: {
            organizationId: donation.organizationId,
            donatedAt: { lte: donation.donatedAt },
          },
        });

        const org = donation.organization;
        const donor = donation.donor;
        const receiptHtml = generateReceiptHtml({
          receiptNumber,
          donorName: `${donor.firstName} ${donor.lastName}`.trim(),
          donorId: donor.idNumber ?? undefined,
          donorAddress: donor.address ?? undefined,
          donorEmail: donor.email ?? undefined,
          amount: donation.amount,
          currency: donation.currency ?? "ILS",
          paymentMethod: donation.method ?? undefined,
          donatedAt: donation.donatedAt,
          organizationName: org.name,
          organizationNumber: org.number ?? "",
          organizationAddress: org.address ?? undefined,
          organizationPhone: org.phone ?? undefined,
        });

        await sendEmail({
          to: donor.email!,
          subject: `קבלה מס׳ ${String(receiptNumber).padStart(6, "0")} — ${org.name}`,
          html: receiptHtml,
        }).catch(() => {});

        // Create Receipt record and link it
        const receipt = await prisma.receipt.create({
          data: {
            organizationId: donation.organizationId,
            receiptNumber,
            recipientName: `${donor.firstName} ${donor.lastName}`.trim(),
            recipientId: donor.idNumber ?? undefined,
            amount: donation.amount,
            isTaxDeductible: true,
            section46: true,
          },
        }).catch(() => null);
        if (receipt) {
          await prisma.donation.update({
            where: { id: donation.id },
            data: { receiptId: receipt.id },
          }).catch(() => {});
        }

        sent++;
      }
      result = `${sent} קבלות נשלחו לתורמים`;
      break;
    }

    default:
      return apiError(`פעולה לא מוכרת: ${action}`, 400);
  }

  // Log the action
  await prisma.auditLog.create({
    data: {
      organizationId: user.organizationId!,
      userId: user.id,
      action: `automation_run`,
      entity: "automation",
      entityId: action,
      details: { action, result },
    },
  });

  return apiResponse({ action, result });
});
