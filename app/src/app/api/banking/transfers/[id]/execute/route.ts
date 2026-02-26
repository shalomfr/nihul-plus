/**
 * POST /api/banking/transfers/[id]/execute
 *   → Starts a Puppeteer session: logs into bank, fills transfer form, returns screenshot
 *   Body: {}
 *   Returns: { sessionId, screenshot: base64, step: "confirm"|"otp", message }
 *
 * PUT /api/banking/transfers/[id]/execute
 *   → Confirms the transfer in the bank, syncs, marks as COMPLETED
 *   Body: { sessionId, otp? }
 *   Returns: { success, screenshot?, message }
 */
import { prisma } from "@/lib/prisma";
import { requireManager, apiResponse, apiError, withErrorHandler } from "@/lib/api-helpers";
import { decrypt } from "@/lib/encryption";
import {
  startTransferExecution,
  confirmTransfer,
  type TransferData,
} from "@/lib/bank-transfer-executor";
import { syncBankData } from "@/lib/bank-scraper";

export const POST = withErrorHandler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireManager();
  const { id } = await params;

  // Load transfer
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

  // Find the scraper connection for this bank
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

  // Decrypt credentials
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
  const { sessionId, otp } = body as { sessionId: string; otp?: string };

  if (!sessionId) return apiError("חסר sessionId", 400);

  // Verify transfer belongs to org
  const transfer = await prisma.bankTransfer.findFirst({
    where: { id, organizationId: user.organizationId! },
    include: { fromAccount: { select: { id: true } } },
  });
  if (!transfer) return apiError("העברה לא נמצאה", 404);

  // Execute confirm in Puppeteer
  const result = await confirmTransfer(sessionId, otp);

  if (result.success) {
    // Mark transfer as COMPLETED
    await prisma.bankTransfer.update({
      where: { id },
      data: { status: "COMPLETED" },
    });

    // Trigger bank sync to pick up the new transaction
    if (transfer.fromAccount?.id) {
      const bankAccount = await prisma.bankAccount.findFirst({
        where: { id: transfer.fromAccountId ?? "" },
      });
      if (bankAccount) {
        const conn = await prisma.bankScraperConnection.findFirst({
          where: { organizationId: user.organizationId!, status: "ACTIVE" },
        });
        if (conn) {
          void syncBankData(user.organizationId!, conn.id).catch((e) =>
            console.error("[execute] post-transfer sync failed:", e)
          );
        }
      }
    }
  }

  return apiResponse(result);
});
