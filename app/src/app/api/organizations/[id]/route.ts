import { prisma } from "@/lib/prisma";
import { requireAdmin, apiResponse, apiError, withErrorHandler } from "@/lib/api-helpers";
import { z } from "zod";

const updateOrgSchema = z.object({
  name: z.string().min(2, "שם ארגון חייב להכיל לפחות 2 תווים").optional(),
  number: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("אימייל לא תקין").optional(),
});

export const GET = withErrorHandler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      _count: {
        select: { users: true, workflows: true, donations: true },
      },
    },
  });

  if (!org) return apiError("ארגון לא נמצא", 404);

  return apiResponse(org);
});

export const PUT = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;

  const existing = await prisma.organization.findUnique({ where: { id } });
  if (!existing) return apiError("ארגון לא נמצא", 404);

  const body = await req.json();
  const data = updateOrgSchema.parse(body);

  const updated = await prisma.organization.update({
    where: { id },
    data,
  });

  return apiResponse(updated);
});

export const DELETE = withErrorHandler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;

  const existing = await prisma.organization.findUnique({ where: { id } });
  if (!existing) return apiError("ארגון לא נמצא", 404);

  await prisma.organization.delete({ where: { id } });

  return apiResponse({ deleted: true });
});
