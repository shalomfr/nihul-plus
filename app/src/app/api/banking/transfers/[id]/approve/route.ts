import { prisma } from "@/lib/prisma";
import { requireManager, apiResponse, apiError, withErrorHandler } from "@/lib/api-helpers";
import { approveTransferSchema } from "@/lib/validators";

export const POST = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireManager();
  const { id } = await params;
  const body = await req.json();
  const data = approveTransferSchema.parse(body);

  // Verify transfer exists and belongs to org
  const transfer = await prisma.bankTransfer.findFirst({
    where: { id, organizationId: user.organizationId! },
    include: { approvals: true },
  });

  if (!transfer) return apiError("העברה לא נמצאה", 404);
  if (transfer.status !== "PENDING_APPROVAL") {
    return apiError("העברה כבר אושרה או נדחתה", 400);
  }

  // Verify signatory is authorized, active, and belongs to this org
  const signatory = await prisma.boardMember.findFirst({
    where: {
      id: data.signatoryId,
      organizationId: user.organizationId!,
      isActive: true,
      isAuthorizedSignatory: true,
    },
  });

  if (!signatory) {
    return apiError("מורשה חתימה לא נמצא או לא מורשה", 400);
  }

  // Verify signatory hasn't already signed
  const existingApproval = transfer.approvals.find(a => a.signatoryId === data.signatoryId);
  if (existingApproval) {
    return apiError("מורשה חתימה זה כבר חתם על העברה זו", 400);
  }

  // Create approval record
  const approval = await prisma.transferApproval.create({
    data: {
      transferId: id,
      signatoryId: data.signatoryId,
      action: data.action,
      notes: data.notes,
    },
    include: {
      signatory: { select: { name: true, role: true } },
    },
  });

  // Update transfer status based on action
  if (data.action === "REJECTED") {
    await prisma.bankTransfer.update({
      where: { id },
      data: { status: "REJECTED" },
    });
  } else {
    // Count approvals (not rejections)
    const approvalCount = transfer.approvals.filter(a => a.action === "APPROVED").length + 1;
    if (approvalCount >= transfer.requiredApprovals) {
      await prisma.bankTransfer.update({
        where: { id },
        data: { status: "APPROVED" },
      });
    }
  }

  // Return updated transfer
  const updated = await prisma.bankTransfer.findUnique({
    where: { id },
    include: {
      fromAccount: { select: { bankName: true, accountNumber: true } },
      toAccount: { select: { bankName: true, accountNumber: true } },
      requestedBy: { select: { name: true } },
      approvals: {
        include: { signatory: { select: { id: true, name: true, role: true } } },
        orderBy: { signedAt: "asc" },
      },
    },
  });

  return apiResponse(updated);
});
