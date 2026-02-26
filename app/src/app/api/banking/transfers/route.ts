import { prisma } from "@/lib/prisma";
import { requireManager, apiResponse, withErrorHandler } from "@/lib/api-helpers";
import { createBankTransferSchema } from "@/lib/validators";
import { createApprovalToken } from "@/lib/transfer-approval-token";
import { sendEmail } from "@/lib/email";
import { sendWhatsApp, buildTransferApprovalWhatsApp } from "@/lib/whatsapp";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://matefet-app.azurewebsites.net";

export const GET = withErrorHandler(async () => {
  const user = await requireManager();
  const orgId = user.organizationId!;

  const transfers = await prisma.bankTransfer.findMany({
    where: { organizationId: orgId },
    include: {
      fromAccount: { select: { bankName: true, accountNumber: true, branchNumber: true } },
      toAccount: { select: { bankName: true, accountNumber: true, branchNumber: true } },
      requestedBy: { select: { name: true } },
      approvals: {
        include: {
          signatory: { select: { id: true, name: true, role: true } },
        },
        orderBy: { signedAt: "asc" },
      },
    },
    orderBy: { transferDate: "desc" },
  });

  return apiResponse(transfers);
});

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireManager();
  const body = await req.json();
  const data = createBankTransferSchema.parse(body);

  const transfer = await prisma.bankTransfer.create({
    data: {
      organizationId: user.organizationId!,
      fromAccountId: data.fromAccountId,
      toAccountId: data.toAccountId,
      toExternalAccount: data.toExternalAccount,
      toExternalBankCode: data.toExternalBankCode,
      toExternalName: data.toExternalName,
      amount: data.amount,
      purpose: data.purpose,
      description: data.description,
      reference: data.reference,
      supportingDocUrl: data.supportingDocUrl,
      transferDate: new Date(data.transferDate),
      requestedById: user.id,
      status: "PENDING_APPROVAL",
    },
    include: {
      fromAccount: { select: { bankName: true, accountNumber: true } },
      toAccount: { select: { bankName: true, accountNumber: true } },
      approvals: true,
    },
  });

  // Auto-send approval notifications to all authorized signatories
  void sendApprovalNotifications(transfer.id, user.organizationId!, Number(transfer.amount), transfer.purpose ?? "העברה בנקאית");

  return apiResponse(transfer, 201);
});

async function sendApprovalNotifications(
  transferId: string,
  orgId: string,
  amount: number,
  purpose: string
) {
  try {
    const signatories = await prisma.boardMember.findMany({
      where: { organizationId: orgId, isActive: true, isAuthorizedSignatory: true },
    });

    for (const signatory of signatories) {
      const token = createApprovalToken(transferId, signatory.id);
      const approveUrl = `${APP_URL}/approve/${token}`;

      if (signatory.email) {
        await sendEmail({
          to: signatory.email,
          subject: `✍️ נדרשת חתימתך — העברת ₪${amount.toLocaleString("he-IL")}`,
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
  <div style="background:#1e40af;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
    <h2 style="color:#fff;margin:0;font-size:20px;">✍️ נדרשת חתימתך</h2>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;">
    <p>שלום ${signatory.name},</p>
    <p>התבקשה חתימתך על העברה בנקאית בסך <strong>₪${amount.toLocaleString("he-IL")}</strong> למטרה: ${purpose}</p>
    <div style="text-align:center;margin:24px 0;display:flex;gap:12px;justify-content:center;">
      <a href="${approveUrl}" style="background:#16a34a;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:700;">✅ אשר</a>
      <a href="${approveUrl}?action=reject" style="background:#dc2626;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:700;">❌ דחה</a>
    </div>
    <p style="font-size:12px;color:#64748b;text-align:center;">הקישור תקף ל-48 שעות.</p>
  </div>
</div>`,
        }).catch((err) => console.error("[transfers] Email failed:", err));
      }

      if (signatory.phone) {
        await sendWhatsApp(
          signatory.phone,
          buildTransferApprovalWhatsApp({
            signatoryName: signatory.name,
            amount,
            purpose,
            transferId,
            token,
            appUrl: APP_URL,
          })
        ).catch((err) => console.error("[transfers] WhatsApp failed:", err));
      }
    }
  } catch (err) {
    console.error("[transfers] sendApprovalNotifications failed:", err);
  }
}
