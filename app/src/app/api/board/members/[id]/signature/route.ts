import { prisma } from "@/lib/prisma";
import { requireManager, apiResponse, apiError, withErrorHandler } from "@/lib/api-helpers";
import { saveFile } from "@/lib/storage";

// POST /api/board/members/[id]/signature - upload signature image
export const POST = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireManager();
  const { id } = await params;

  const member = await prisma.boardMember.findFirst({
    where: { id, organizationId: user.organizationId! },
  });
  if (!member) return apiError("חבר ועד לא נמצא", 404);

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return apiError("קובץ חתימה נדרש", 400);

  if (!file.type.startsWith("image/")) {
    return apiError("יש להעלות קובץ תמונה בלבד", 400);
  }

  if (file.size > 2 * 1024 * 1024) {
    return apiError("גודל הקובץ מקסימלי 2MB", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const record = await saveFile({
    organizationId: user.organizationId!,
    file: buffer,
    originalName: file.name,
    mimeType: file.type,
  });

  // Update member with signature file ID
  await prisma.boardMember.update({
    where: { id },
    data: { signatureFileId: record.id },
  });

  return apiResponse({ signatureUrl: `/api/files/${record.id}` }, 201);
});

// DELETE /api/board/members/[id]/signature - remove signature
export const DELETE = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireManager();
  const { id } = await params;

  const member = await prisma.boardMember.findFirst({
    where: { id, organizationId: user.organizationId! },
  });
  if (!member) return apiError("חבר ועד לא נמצא", 404);

  await prisma.boardMember.update({
    where: { id },
    data: { signatureFileId: null },
  });

  return apiResponse({ deleted: true });
});
