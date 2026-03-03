import { prisma } from "@/lib/prisma";
import { requireAdmin, apiResponse, apiError, withErrorHandler } from "@/lib/api-helpers";
import { z } from "zod";
import { seedRegulatoryCalendar } from "@/lib/regulatory-calendar-seeds";

const createOrgSchema = z.object({
  name: z.string().min(2, "שם ארגון חייב להכיל לפחות 2 תווים"),
  number: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("אימייל לא תקין").optional(),
});

export const GET = withErrorHandler(async () => {
  await requireAdmin();

  const organizations = await prisma.organization.findMany({
    include: {
      _count: {
        select: {
          users: true,
          workflows: true,
          donations: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = organizations.map((org) => ({
    id: org.id,
    name: org.name,
    number: org.number,
    users: org._count.users,
    workflows: org._count.workflows,
    donations: org._count.donations,
    createdAt: org.createdAt.toISOString(),
  }));

  return apiResponse(formatted);
});

export const POST = withErrorHandler(async (req: Request) => {
  await requireAdmin();

  const body = await req.json();
  const data = createOrgSchema.parse(body);

  const org = await prisma.organization.create({
    data: {
      name: data.name,
      number: data.number ?? null,
      address: data.address,
      phone: data.phone,
      email: data.email,
    },
  });

  await seedRegulatoryCalendar(org.id);

  return apiResponse(org, 201);
});
