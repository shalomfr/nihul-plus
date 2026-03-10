import { requireManager, apiResponse, apiError, withErrorHandler } from "@/lib/api-helpers";
import { saveFile } from "@/lib/storage";

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireManager();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return apiError("קובץ נדרש", 400);

  const buffer = Buffer.from(await file.arrayBuffer());

  const record = await saveFile({
    organizationId: user.organizationId!,
    file: buffer,
    originalName: file.name,
    mimeType: file.type,
  });

  return apiResponse({ ...record, url: `/api/files/${record.id}` }, 201);
});
