import { prisma } from "@/lib/prisma";
import { requireManager, apiResponse, withErrorHandler } from "@/lib/api-helpers";

export const GET = withErrorHandler(async () => {
  const user = await requireManager();
  const orgId = user.organizationId!;

  const signatories = await prisma.boardMember.findMany({
    where: {
      organizationId: orgId,
      isActive: true,
      isAuthorizedSignatory: true,
    },
    select: {
      id: true,
      name: true,
      role: true,
      email: true,
      phone: true,
    },
    orderBy: { name: "asc" },
  });

  return apiResponse(signatories);
});
