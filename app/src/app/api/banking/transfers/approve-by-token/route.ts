/**
 * Transfer approval via signed token — no login required.
 * GET  → returns transfer info for display on approval page
 * POST → records the approval/rejection
 */
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, withErrorHandler } from "@/lib/api-helpers";
import { verifyApprovalToken } from "@/lib/transfer-approval-token";
import { sendEmail } from "@/lib/email";
import { sendWhatsApp } from "@/lib/whatsapp";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://matefet-app.azurewebsites.net";

// ── GET — load transfer info from token ───────────────────────────────────────
export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return apiError("חסר token", 400);

  let payload: { transferId: string; signatoryId: string };
  try {
    payload = verifyApprovalToken(token);
  } catch (err) {
    const msg = err instanceof Error && err.message === "Token expired"
      ? "הקישור פג תוקף (48 שעות)"
      : "קישור לא תקף";
    return apiError(msg, 401);
  }

  const [transfer, signatory] = await Promise.all([
    prisma.bankTransfer.findUnique({
      where: { id: payload.transferId },
      include: {
        fromAccount: { select: { bankName: true, accountNumber: true } },
        approvals: { select: { signatoryId: true, action: true } },
      },
    }),
    prisma.boardMember.findUnique({
      where: { id: payload.signatoryId },
    }),
  ]);

  if (!transfer) return apiError("העברה לא נמצאה", 404);
  if (!signatory) return apiError("מורשה חתימה לא נמצא", 404);

  const existingApproval = transfer.approvals.find((a) => a.signatoryId === payload.signatoryId);
  const approvalCount = transfer.approvals.filter((a) => a.action === "APPROVED").length;

  return apiResponse({
    id: transfer.id,
    amount: Number(transfer.amount),
    purpose: transfer.purpose ?? "",
    description: transfer.description ?? undefined,
    fromAccount: transfer.fromAccount
      ? { bankName: transfer.fromAccount.bankName, accountNumber: transfer.fromAccount.accountNumber }
      : undefined,
    toExternalName: transfer.toExternalName ?? undefined,
    transferDate: transfer.transferDate.toISOString(),
    requiredApprovals: transfer.requiredApprovals,
    approvalCount,
    status: transfer.status,
    signatoryName: signatory.name,
    alreadySigned: !!existingApproval,
  });
});

// ── POST — record approval or rejection ───────────────────────────────────────
export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const { token, action, notes } = body as {
    token: string;
    action: "APPROVED" | "REJECTED";
    notes?: string;
  };

  if (!token) return apiError("חסר token", 400);
  if (!["APPROVED", "REJECTED"].includes(action)) return apiError("פעולה לא תקינה", 400);

  let payload: { transferId: string; signatoryId: string };
  try {
    payload = verifyApprovalToken(token);
  } catch {
    return apiError("קישור לא תקף או פג תוקף", 401);
  }

  const transfer = await prisma.bankTransfer.findUnique({
    where: { id: payload.transferId },
    include: {
      organization: { include: { users: { where: { role: "MANAGER", status: "APPROVED" }, select: { email: true } } } },
      approvals: { select: { signatoryId: true, action: true } },
    },
  });

  if (!transfer) return apiError("העברה לא נמצאה", 404);
  if (transfer.status !== "PENDING_APPROVAL") {
    return apiError("העברה כבר טופלה", 400);
  }

  const signatory = await prisma.boardMember.findUnique({ where: { id: payload.signatoryId } });
  if (!signatory) return apiError("מורשה חתימה לא נמצא", 404);

  // Check already signed
  const alreadySigned = transfer.approvals.some((a) => a.signatoryId === payload.signatoryId);
  if (alreadySigned) return apiError("כבר חתמת על העברה זו", 400);

  // Record approval
  await prisma.transferApproval.create({
    data: {
      transferId: transfer.id,
      signatoryId: payload.signatoryId,
      action,
      notes: notes ?? null,
    },
  });

  // Update transfer status
  if (action === "REJECTED") {
    await prisma.bankTransfer.update({
      where: { id: transfer.id },
      data: { status: "REJECTED" },
    });

    // Notify managers of rejection
    const managerEmails = transfer.organization.users.map((u) => u.email);
    for (const email of managerEmails) {
      await sendEmail({
        to: email,
        subject: `❌ העברה נדחתה — ₪${Number(transfer.amount).toLocaleString("he-IL")}`,
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:560px;">
          <h2 style="color:#ef4444;">❌ העברה נדחתה</h2>
          <p>מורשה החתימה <strong>${signatory.name}</strong> דחה את ההעברה בסך ₪${Number(transfer.amount).toLocaleString("he-IL")}.</p>
          ${notes ? `<p>סיבה: ${notes}</p>` : ""}
          <a href="${APP_URL}/portal/banking" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px;">צפה בפרטים ←</a>
        </div>`,
      }).catch(console.error);
    }
  } else {
    // Count approved (including this one)
    const approvedCount = transfer.approvals.filter((a) => a.action === "APPROVED").length + 1;

    if (approvedCount >= transfer.requiredApprovals) {
      await prisma.bankTransfer.update({
        where: { id: transfer.id },
        data: { status: "APPROVED" },
      });

      // Notify managers of full approval
      const managerEmails = transfer.organization.users.map((u) => u.email);
      for (const email of managerEmails) {
        await sendEmail({
          to: email,
          subject: `✅ העברה אושרה במלואה — ₪${Number(transfer.amount).toLocaleString("he-IL")}`,
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:560px;">
            <h2 style="color:#10b981;">✅ העברה אושרה</h2>
            <p>כל ${transfer.requiredApprovals} החתימות התקבלו. ההעברה בסך ₪${Number(transfer.amount).toLocaleString("he-IL")} אושרה.</p>
            <a href="${APP_URL}/portal/banking" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px;">צפה בפרטים ←</a>
          </div>`,
        }).catch(console.error);
      }
    }
  }

  return apiResponse({ action, signatoryName: signatory.name });
});
