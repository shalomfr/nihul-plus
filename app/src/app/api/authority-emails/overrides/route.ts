/**
 * GET  /api/authority-emails/overrides — list all templates + overrides for the org
 * PUT  /api/authority-emails/overrides — save/update an override for a specific template
 */
import { prisma } from "@/lib/prisma";
import { requireManager, apiResponse, apiError, withErrorHandler } from "@/lib/api-helpers";
import { AUTHORITY_TEMPLATES } from "@/lib/authority-email-templates";

export const GET = withErrorHandler(async () => {
  const user = await requireManager();

  const overrides = await prisma.authorityEmailOverride.findMany({
    where: { organizationId: user.organizationId! },
  });

  const overrideMap = new Map(overrides.map((o) => [o.templateKey, o.recipientEmail]));

  const templates = AUTHORITY_TEMPLATES.map((t) => ({
    key: t.key,
    authority: t.authority,
    description: t.description,
    defaultEmail: t.recipientEmail,
    overrideEmail: overrideMap.get(t.key) ?? null,
    effectiveEmail: overrideMap.get(t.key) ?? t.recipientEmail,
  }));

  return apiResponse({ templates });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const user = await requireManager();
  const body = await req.json();

  const { templateKey, recipientEmail } = body as {
    templateKey: string;
    recipientEmail: string;
  };

  if (!templateKey) return apiError("templateKey חסר", 400);

  const tmpl = AUTHORITY_TEMPLATES.find((t) => t.key === templateKey);
  if (!tmpl) return apiError("תבנית לא נמצאה", 400);

  if (!recipientEmail || !recipientEmail.trim()) {
    // Delete override — revert to default
    await prisma.authorityEmailOverride.deleteMany({
      where: { organizationId: user.organizationId!, templateKey },
    });
    return apiResponse({ templateKey, recipientEmail: tmpl.recipientEmail, isOverride: false });
  }

  const override = await prisma.authorityEmailOverride.upsert({
    where: {
      organizationId_templateKey: {
        organizationId: user.organizationId!,
        templateKey,
      },
    },
    update: { recipientEmail: recipientEmail.trim() },
    create: {
      organizationId: user.organizationId!,
      templateKey,
      recipientEmail: recipientEmail.trim(),
    },
  });

  return apiResponse({ templateKey, recipientEmail: override.recipientEmail, isOverride: true });
});
