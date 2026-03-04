/**
 * POST /api/authority-emails/send
 * Sends an authority email using a pre-built template.
 */
import { prisma } from "@/lib/prisma";
import { requireManager, apiResponse, apiError, withErrorHandler } from "@/lib/api-helpers";
import {
  getTemplate,
  buildSubject,
  type AuthorityEmailKey,
  type OrgParams,
} from "@/lib/authority-email-templates";
import { sendEmail } from "@/lib/email";

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireManager();
  const body = await req.json();

  const { templateKey, recipientEmail, customNotes } = body as {
    templateKey: AuthorityEmailKey;
    recipientEmail?: string;
    customNotes?: string;
  };

  const template = getTemplate(templateKey);
  if (!template) return apiError("תבנית לא נמצאה", 400);

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId! },
    include: {
      users: {
        where: { role: "MANAGER", status: "APPROVED" },
        select: { name: true, email: true },
        take: 1,
      },
    },
  });
  if (!org) return apiError("ארגון לא נמצא", 404);

  const manager = org.users[0];
  const params: OrgParams = {
    orgName: org.name,
    orgNumber: org.number ?? "",
    contactName: manager?.name ?? org.name,
    contactEmail: manager?.email ?? org.email ?? "",
    contactPhone: org.phone ?? "",
    address: org.address ?? "",
    currentYear: new Date().getFullYear(),
  };

  // Check for org-level email override
  const override = await prisma.authorityEmailOverride.findUnique({
    where: {
      organizationId_templateKey: {
        organizationId: user.organizationId!,
        templateKey,
      },
    },
  });

  const to = recipientEmail || override?.recipientEmail || template.recipientEmail;
  if (!to) return apiError("כתובת נמען נדרשת", 400);

  const subject = buildSubject(template, org.name);
  let html = template.buildHtml(params);

  if (customNotes) {
    html += `<div dir="rtl" style="margin-top:16px;padding:12px;background:#f8fafc;border-radius:8px;">
      <strong>הערות נוספות:</strong><br/>${customNotes.replace(/\n/g, "<br/>")}
    </div>`;
  }

  await sendEmail({
    to,
    subject,
    html,
    from: manager?.email ? `${params.contactName} <${manager.email}>` : undefined,
  });

  // Log in audit
  await prisma.auditLog.create({
    data: {
      organizationId: user.organizationId!,
      userId: user.id,
      action: "send_authority_email",
      entity: "authority_email",
      entityId: templateKey,
      details: { to, subject, template: templateKey },
    },
  });

  return apiResponse({ sent: true, to, subject });
});
