import { prisma } from "./prisma";
import path from "path";

export async function saveFile(params: {
  organizationId: string;
  file: Buffer;
  originalName: string;
  mimeType: string;
}) {
  const ext = path.extname(params.originalName);
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

  const record = await prisma.fileUpload.create({
    data: {
      organizationId: params.organizationId,
      fileName,
      originalName: params.originalName,
      mimeType: params.mimeType,
      fileSize: params.file.length,
      fileData: params.file,
    },
  });

  return record;
}

export async function getFile(fileId: string) {
  const record = await prisma.fileUpload.findUnique({ where: { id: fileId } });
  if (!record) return null;

  return {
    ...record,
    buffer: record.fileData ? Buffer.from(record.fileData) : null,
  };
}

export async function deleteFile(fileId: string) {
  const record = await prisma.fileUpload.findUnique({ where: { id: fileId } });
  if (!record) return false;

  await prisma.fileUpload.delete({ where: { id: fileId } });
  return true;
}
