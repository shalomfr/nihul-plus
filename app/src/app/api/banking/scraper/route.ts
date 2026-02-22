import { prisma } from "@/lib/prisma";
import { requireManager, apiResponse, apiError, withErrorHandler } from "@/lib/api-helpers";
import { connectBankScraperSchema } from "@/lib/validators";
import { encrypt } from "@/lib/encryption";
import { getBankByCompanyId, syncBankData, SUPPORTED_BANKS } from "@/lib/bank-scraper";

export const GET = withErrorHandler(async () => {
  const user = await requireManager();

  const connections = await prisma.bankScraperConnection.findMany({
    where: { organizationId: user.organizationId! },
    select: {
      id: true,
      companyId: true,
      bankName: true,
      status: true,
      lastSyncAt: true,
      lastError: true,
      accountsFound: true,
      txnsSynced: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return apiResponse({
    connections,
    supportedBanks: SUPPORTED_BANKS,
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireManager();
  const body = await req.json();
  const data = connectBankScraperSchema.parse(body);

  const bank = getBankByCompanyId(data.companyId);
  if (!bank) return apiError("בנק לא נתמך", 400);

  // Validate that all required credential fields are provided
  for (const field of bank.fields) {
    if (!data.credentials[field.key]?.trim()) {
      return apiError(`חסר שדה: ${field.label}`, 400);
    }
  }

  // Encrypt credentials
  const encryptedCreds = encrypt(JSON.stringify(data.credentials));

  // Upsert connection
  const connection = await prisma.bankScraperConnection.upsert({
    where: {
      organizationId_companyId: {
        organizationId: user.organizationId!,
        companyId: data.companyId,
      },
    },
    create: {
      organizationId: user.organizationId!,
      companyId: data.companyId,
      bankName: bank.name,
      encryptedCreds,
      status: "PENDING_CONSENT",
    },
    update: {
      encryptedCreds,
      status: "PENDING_CONSENT",
      lastError: null,
    },
  });

  // Run initial sync
  try {
    const result = await syncBankData(user.organizationId!, connection.id);
    return apiResponse({
      connection: {
        id: connection.id,
        companyId: connection.companyId,
        bankName: connection.bankName,
        status: "ACTIVE",
        accountsFound: result.accountsFound,
        txnsSynced: result.txnsSynced,
      },
      sync: result,
    }, 201);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "שגיאה בסנכרון";
    return apiResponse({
      connection: {
        id: connection.id,
        companyId: connection.companyId,
        bankName: connection.bankName,
        status: "ERROR",
        lastError: errorMsg,
      },
      sync: null,
      error: errorMsg,
    }, 201);
  }
});
