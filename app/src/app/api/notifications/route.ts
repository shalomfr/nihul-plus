import { prisma } from "@/lib/prisma";
import { getAuthSession, requireManager, apiResponse, apiError, withErrorHandler } from "@/lib/api-helpers";
import { markNotificationReadSchema } from "@/lib/validators";
import { sendWhatsApp, isWhatsAppConfigured } from "@/lib/whatsapp";

export const GET = withErrorHandler(async (req: Request) => {
  const user = await getAuthSession();
  if (!user) return apiError("לא מחובר", 401);

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";
  const limit = Number(searchParams.get("limit") ?? 20);

  const orgId = user.role === "ADMIN"
    ? searchParams.get("organizationId") ?? undefined
    : user.organizationId;

  const notifications = await prisma.notification.findMany({
    where: {
      ...(orgId ? { organizationId: orgId } : {}),
      ...(user.role !== "ADMIN" ? { OR: [{ userId: user.id }, { userId: null }] } : {}),
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const unreadCount = await prisma.notification.count({
    where: {
      ...(orgId ? { organizationId: orgId } : {}),
      ...(user.role !== "ADMIN" ? { OR: [{ userId: user.id }, { userId: null }] } : {}),
      isRead: false,
    },
  });

  return apiResponse({ notifications, unreadCount });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const user = await getAuthSession();
  if (!user) return apiError("לא מחובר", 401);

  const body = await req.json();
  const data = markNotificationReadSchema.parse(body);

  if (data.all) {
    await prisma.notification.updateMany({
      where: {
        ...(user.organizationId ? { organizationId: user.organizationId } : {}),
        OR: [{ userId: user.id }, { userId: null }],
        isRead: false,
      },
      data: { isRead: true },
    });
  } else if (data.ids && data.ids.length > 0) {
    await prisma.notification.updateMany({
      where: { id: { in: data.ids } },
      data: { isRead: true },
    });
  }

  return apiResponse({ updated: true });
});

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireManager();
  const body = await req.json();

  // Contact form — creates a notification for the org
  const notification = await prisma.notification.create({
    data: {
      organizationId: user.organizationId!,
      type: "INFO",
      title: body.title ?? "פנייה חדשה",
      message: body.message ?? "",
      link: body.link,
    },
  });

  // Send WhatsApp to advisor if configured
  if (isWhatsAppConfigured() && user.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { advisorPhone: true, name: true },
    });

    if (org?.advisorPhone) {
      const waMessage = [
        `📩 *פנייה חדשה מ${org.name}*`,
        ``,
        `*נושא:* ${body.title ?? "פנייה חדשה"}`,
        `*הודעה:* ${body.message ?? ""}`,
        ``,
        `*שולח:* ${user.name} (${user.email})`,
      ].join("\n");

      sendWhatsApp(org.advisorPhone, waMessage).catch(err =>
        console.error("[Contact] WhatsApp send failed:", err)
      );
    }
  }

  return apiResponse(notification, 201);
});
