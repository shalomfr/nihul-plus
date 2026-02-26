/**
 * GET /api/authority-emails/preview?templateKey=...&customNotes=...
 * Returns the full HTML of an authority email template filled with org data.
 * Used by the institutions page for preview-before-send modal.
 */
import { prisma } from "@/lib/prisma";
import { requireManager, apiError } from "@/lib/api-helpers";
import {
  getTemplate,
  buildSubject,
  type AuthorityEmailKey,
  type OrgParams,
} from "@/lib/authority-email-templates";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  let user;
  try {
    user = await requireManager();
  } catch {
    return apiError("לא מחובר", 401);
  }

  const { searchParams } = new URL(req.url);
  const templateKey = searchParams.get("templateKey") as AuthorityEmailKey | null;
  const customNotes = searchParams.get("customNotes") ?? "";

  if (!templateKey) return apiError("templateKey חסר", 400);

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

  const subject = buildSubject(template, org.name);
  let html = template.buildHtml(params);

  if (customNotes) {
    html += `<div dir="rtl" style="margin-top:16px;padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
      <strong>הערות נוספות:</strong><br/>${customNotes.replace(/\n/g, "<br/>")}
    </div>`;
  }

  return new NextResponse(
    JSON.stringify({
      success: true,
      data: {
        subject,
        html,
        recipientEmail: template.recipientEmail,
        authority: template.authority,
      },
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
