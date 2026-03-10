import { prisma } from "@/lib/prisma";
import { requireManager, apiResponse, apiError, withErrorHandler } from "@/lib/api-helpers";

// GET /api/organization/advisor-phone
export const GET = withErrorHandler(async () => {
  const user = await requireManager();
  if (!user.organizationId) return apiError("לא שויך לארגון", 400);

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { advisorPhone: true },
  });

  return apiResponse({ advisorPhone: org?.advisorPhone ?? "" });
});

// PUT /api/organization/advisor-phone
export const PUT = withErrorHandler(async (req: Request) => {
  const user = await requireManager();
  if (!user.organizationId) return apiError("לא שויך לארגון", 400);

  const body = await req.json();
  const phone = (body.advisorPhone ?? "").trim();

  await prisma.organization.update({
    where: { id: user.organizationId },
    data: { advisorPhone: phone || null },
  });

  return apiResponse({ advisorPhone: phone });
});
