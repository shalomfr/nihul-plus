import { prisma } from "@/lib/prisma";
import { requireManager, apiResponse, apiError, withErrorHandler } from "@/lib/api-helpers";

export const GET = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireManager();
  const { id } = await params;

  const member = await prisma.boardMember.findFirst({
    where: { id, organizationId: user.organizationId! },
  });

  if (!member) return apiError("חבר ועד לא נמצא", 404);
  return apiResponse(member);
});

export const PUT = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireManager();
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.boardMember.findFirst({
    where: { id, organizationId: user.organizationId! },
  });
  if (!existing) return apiError("חבר ועד לא נמצא", 404);

  const member = await prisma.boardMember.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.role !== undefined ? { role: body.role } : {}),
      ...(body.email !== undefined ? { email: body.email } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      ...(body.isAuthorizedSignatory !== undefined ? { isAuthorizedSignatory: body.isAuthorizedSignatory } : {}),
      ...(body.signatureFileId !== undefined ? { signatureFileId: body.signatureFileId } : {}),
    },
  });

  return apiResponse(member);
});

export const DELETE = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireManager();
  const { id } = await params;

  const deleted = await prisma.boardMember.deleteMany({
    where: { id, organizationId: user.organizationId! },
  });

  if (deleted.count === 0) return apiError("חבר ועד לא נמצא", 404);
  return apiResponse({ deleted: true });
});
