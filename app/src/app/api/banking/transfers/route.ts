import { prisma } from "@/lib/prisma";
import { requireManager, apiResponse, withErrorHandler } from "@/lib/api-helpers";
import { createBankTransferSchema } from "@/lib/validators";

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

  return apiResponse(transfer, 201);
});
