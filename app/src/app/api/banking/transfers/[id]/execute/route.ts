/**
 * Bank Transfer Execute API — 3-step Puppeteer screenshot relay
 *
 * POST /api/banking/transfers/[id]/execute
 *   → Start: login, fill form, screenshot confirmation page
 *   Body: {}
 *   Returns: { sessionId, screenshot, step:"confirm", message }
 *
 * PUT /api/banking/transfers/[id]/execute
 *   → Step forward in the flow
 *   Body: { sessionId, action: "confirm" | "otp", otp?: string }
 *
 *   action="confirm" → clicks confirm button → returns { screenshot, step:"otp", message }
 *   action="otp"     → submits OTP code → returns { success, screenshot, step:"success"|"error", message }
 */
import { prisma } from "@/lib/prisma";
import { requireManager, apiResponse, apiError, withErrorHandler } from "@/lib/api-helpers";
import { decrypt } from "@/lib/encryption";
import {
  startTransferExecution,
  confirmTransferStep,
  submitOtp,
  type TransferData,
} from "@/lib/bank-transfer-executor";
import { syncBankData } from "@/lib/bank-scraper";

export const POST = withErrorHandler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireManager();
  const { id } = await params;

  const transfer = await prisma.bankTransfer.findFirst({
    where: { id, organizationId: user.organizationId! },
    include: {
      fromAccount: { select: { bankName: true, accountNumber: true } },
    },
  });

  if (!transfer) return apiError("העברה לא נמצאה", 404);
  if (transfer.status !== "APPROVED") return apiError("ניתן לבצע רק העברות מאושרות", 400);

  const bankName = transfer.fromAccount?.bankName ?? "";
  if (!bankName) return apiError("לא מוגדר חשבון מוצא", 400);

  const connection = await prisma.bankScraperConnection.findFirst({
    where: {
      organizationId: user.organizationId!,
      bankName: { contains: bankName.includes("הפועלים") ? "הפועלים" : bankName.includes("לאומי") ? "לאומי" : bankName },
      status: "ACTIVE",
    },
  });

  if (!connection) {
    return apiError(
      `לא נמצא חיבור בנק פעיל עבור ${bankName}. חבר את הבנק תחילה בלשונית "חשבונות".`,
      400
    );
  }

  let credentials: Record<string, string>;
  try {
    credentials = JSON.parse(decrypt(connection.encryptedCreds));
  } catch {
    return apiError("שגיאה בפענוח פרטי הגישה לבנק", 500);
  }

  const transferData: TransferData = {
    id: transfer.id,
    amount: Number(transfer.amount),
    purpose: transfer.purpose ?? "",
    description: transfer.description,
    toExternalAccount: transfer.toExternalAccount,
    toExternalBankCode: transfer.toExternalBankCode ? String(transfer.toExternalBankCode) : null,
    toExternalBranchNumber: transfer.toExternalBranchNumber,
    toExternalName: transfer.toExternalName,
    fromAccountNumber: transfer.fromAccount?.accountNumber ?? null,
  };

  try {
    const result = await startTransferExecution(
      transferData,
      credentials,
      bankName,
      user.organizationId!
    );
    return apiResponse(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "שגיאה בהפעלת הדפדפן";
    return apiError(msg, 500);
  }
});

export const PUT = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireManager();
  const { id } = await params;
  const body = await req.json();
  const { sessionId, action, otp } = body as { sessionId: string; action?: "confirm" | "otp"; otp?: string };

  if (!sessionId) return apiError("חסר sessionId", 400);

  const transfer = await prisma.bankTransfer.findFirst({
    where: { id, organizationId: user.organizationId! },
    include: { fromAccount: { select: { id: true } } },
  });
  if (!transfer) return apiError("העברה לא נמצאה", 404);

  // Determine which step to execute
  const effectiveAction = action ?? (otp ? "otp" : "confirm");

  if (effectiveAction === "confirm") {
    // Step 2: Click confirm on bank's confirmation page → triggers OTP
    const result = await confirmTransferStep(sessionId);

    if (result.step === "success" && result.success) {
      await markCompleted(id, transfer.fromAccountId, user.organizationId!);
    }

    return apiResponse(result);
  }

  if (effectiveAction === "otp") {
    if (!otp) return apiError("חסר קוד OTP", 400);

    // Step 3: Submit OTP → complete transfer
    const result = await submitOtp(sessionId, otp);

    if (result.success) {
      await markCompleted(id, transfer.fromAccountId, user.organizationId!);
    }

    return apiResponse(result);
  }

  return apiError(`פעולה לא מוכרת: ${effectiveAction}`, 400);
});

async function markCompleted(transferId: string, fromAccountId: string | null, orgId: string) {
  await prisma.bankTransfer.update({
    where: { id: transferId },
    data: { status: "COMPLETED" },
  });

  if (fromAccountId) {
    const conn = await prisma.bankScraperConnection.findFirst({
      where: { organizationId: orgId, status: "ACTIVE" },
    });
    if (conn) {
      void syncBankData(orgId, conn.id).catch(() => {});
    }
  }
}
