import { prisma } from "@/lib/prisma";
import { requireManager, apiResponse, apiError, withErrorHandler } from "@/lib/api-helpers";

export const GET = withErrorHandler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireManager();
  const { id } = await params;

  const transfer = await prisma.bankTransfer.findFirst({
    where: { id, organizationId: user.organizationId! },
    include: {
      fromAccount: { select: { bankName: true, accountNumber: true, branchNumber: true } },
      toAccount: { select: { bankName: true, accountNumber: true, branchNumber: true } },
    },
  });

  if (!transfer) return apiError("העברה לא נמצאה", 404);
  return apiResponse(transfer);
});

// Mark a transfer as manually executed in the bank
export const PATCH = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireManager();
  const { id } = await params;
  const body = await req.json();

  const transfer = await prisma.bankTransfer.findFirst({
    where: { id, organizationId: user.organizationId! },
  });

  if (!transfer) return apiError("העברה לא נמצאה", 404);
  if (transfer.status !== "APPROVED") return apiError("ניתן לסמן כבוצע רק העברות מאושרות", 400);
  if (body.status !== "COMPLETED") return apiError("סטטוס לא תקין", 400);

  const updated = await prisma.bankTransfer.update({
    where: { id },
    data: { status: "COMPLETED" },
  });

  return apiResponse(updated);
});
