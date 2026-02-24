import { prisma } from "@/lib/prisma";
import { requireManager, apiResponse, apiError, withErrorHandler } from "@/lib/api-helpers";
import { syncBankData } from "@/lib/bank-scraper";

export const POST = withErrorHandler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireManager();
  const { id } = await params;

  const connection = await prisma.bankScraperConnection.findFirst({
    where: { id, organizationId: user.organizationId! },
  });

  if (!connection) return apiError("חיבור לא נמצא", 404);

  try {
    const result = await syncBankData(user.organizationId!, id);
    return apiResponse({
      connection: {
        id: connection.id,
        companyId: connection.companyId,
        bankName: connection.bankName,
        status: "ACTIVE",
        lastSyncAt: new Date(),
        accountsFound: result.accountsFound,
        txnsSynced: result.txnsSynced,
      },
      sync: result,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "שגיאה בסנכרון";
    return apiError(errorMsg, 400);
  }
});

export const DELETE = withErrorHandler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireManager();
  const { id } = await params;

  const connection = await prisma.bankScraperConnection.findFirst({
    where: { id, organizationId: user.organizationId! },
  });

  if (!connection) return apiError("חיבור לא נמצא", 404);

  await prisma.bankScraperConnection.delete({ where: { id } });

  return apiResponse({ deleted: true });
});
