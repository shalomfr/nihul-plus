/**
 * POST /api/banking/transfers/[id]/approve-link
 * Generates approval tokens for each signatory and sends email + WhatsApp.
 * Called automatically when a transfer is created (from transfers/route.ts).
 */
import { prisma } from "@/lib/prisma";
import { requireManager, apiResponse, apiError, withErrorHandler } from "@/lib/api-helpers";
import { createApprovalToken } from "@/lib/transfer-approval-token";
import { sendEmail } from "@/lib/email";
import { sendWhatsApp, buildTransferApprovalWhatsApp } from "@/lib/whatsapp";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://matefet-app.azurewebsites.net";

export const POST = withErrorHandler(async (
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const user = await requireManager();
  const { id } = await params;

  const transfer = await prisma.bankTransfer.findFirst({
    where: { id, organizationId: user.organizationId! },
    include: {
      fromAccount: { select: { bankName: true, accountNumber: true } },
    },
  });

  if (!transfer) return apiError("העברה לא נמצאה", 404);
  if (transfer.status !== "PENDING_APPROVAL") {
    return apiError("העברה לא ממתינה לאישור", 400);
  }

  // Get all active authorized signatories for this organization
  const signatories = await prisma.boardMember.findMany({
    where: {
      organizationId: user.organizationId!,
      isActive: true,
      isAuthorizedSignatory: true,
    },
  });

  if (signatories.length === 0) {
    return apiResponse({ sent: 0, message: "אין מורשי חתימה פעילים" });
  }

  const amount = Number(transfer.amount);
  const purpose = transfer.purpose ?? "העברה בנקאית";

  let sent = 0;

  for (const signatory of signatories) {
    const token = createApprovalToken(transfer.id, signatory.id);
    const approveUrl = `${APP_URL}/approve/${token}`;

    // Send email if signatory has email
    const email = signatory.email;
    if (email) {
      await sendEmail({
        to: email,
        subject: `✍️ נדרשת חתימתך — העברת ₪${amount.toLocaleString("he-IL")}`,
        html: `
<div dir="rtl" style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
  <div style="background:#1e40af;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
    <h2 style="color:#fff;margin:0;font-size:20px;">✍️ נדרשת חתימתך</h2>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;">
    <p style="margin:0 0 16px;">שלום ${signatory.name},</p>
    <p>התבקשה חתימתך על העברה בנקאית הבאה:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr style="background:#f8fafc;"><td style="padding:10px;border:1px solid #e2e8f0;font-weight:600;">סכום</td><td style="padding:10px;border:1px solid #e2e8f0;font-size:18px;font-weight:800;color:#1e40af;">₪${amount.toLocaleString("he-IL")}</td></tr>
      <tr><td style="padding:10px;border:1px solid #e2e8f0;font-weight:600;">מטרה</td><td style="padding:10px;border:1px solid #e2e8f0;">${purpose}</td></tr>
      ${transfer.description ? `<tr style="background:#f8fafc;"><td style="padding:10px;border:1px solid #e2e8f0;font-weight:600;">תיאור</td><td style="padding:10px;border:1px solid #e2e8f0;">${transfer.description}</td></tr>` : ""}
    </table>
    <div style="text-align:center;margin:24px 0;">
      <a href="${approveUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:16px;font-weight:700;margin-left:12px;">✅ אשר העברה</a>
      <a href="${approveUrl}?action=reject" style="display:inline-block;background:#ef4444;color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:16px;font-weight:700;">❌ דחה</a>
    </div>
    <p style="font-size:12px;color:#64748b;text-align:center;">הקישור תקף ל-48 שעות בלבד.</p>
  </div>
</div>`,
      }).catch((err) => console.error(`[approve-link] Email failed to ${email}:`, err));
      sent++;
    }

    // Send WhatsApp if phone available
    const phone = signatory.phone;
    if (phone) {
      const waBody = buildTransferApprovalWhatsApp({
        signatoryName: signatory.name,
        amount,
        purpose,
        transferId: transfer.id,
        token,
        appUrl: APP_URL,
      });
      await sendWhatsApp(phone, waBody).catch((err) =>
        console.error(`[approve-link] WhatsApp failed to ${phone}:`, err)
      );
    }
  }

  return apiResponse({ sent, signatories: signatories.length });
});
