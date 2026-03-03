/**
 * POST /api/documents/smart-upload
 * Accepts a file, runs OCR, classifies document type, saves with auto-category.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManager, apiError } from "@/lib/api-helpers";

const OCR_URL = process.env.OCR_BACKEND_URL ?? "https://hebrew-ocr-backend.onrender.com";

// Map detected content type → DocumentCategory enum values in schema
type DocumentCategory = "FOUNDING" | "FINANCIAL" | "COMPLIANCE" | "BOARD" | "GENERAL";

function classifyDocument(text: string): { category: DocumentCategory; confidence: number; label: string } {
  const lower = text.toLowerCase();

  if (/ניהול תקין|אישור ניהול|אישור בתוקף/.test(lower)) {
    return { category: "COMPLIANCE", confidence: 90, label: "ניהול תקין / ציות" };
  }
  if (/מאזן|דוח כספי|דוח רווח|תזרים|תקציב|ביקורת חשבונות/.test(lower)) {
    return { category: "FINANCIAL", confidence: 88, label: "ניהול כספי" };
  }
  if (/פרוטוקול|אסיפה|ועד|החלטה|הצבעה|רשימת חברים/.test(lower)) {
    return { category: "BOARD", confidence: 85, label: "ועד ופרוטוקולים" };
  }
  if (/תקנון|חוזה|הסכם|ייפוי כוח|תצהיר|רישום עמותה|מייסד/.test(lower)) {
    return { category: "FOUNDING", confidence: 85, label: "מסמכי יסוד" };
  }

  return { category: "GENERAL", confidence: 50, label: "כללי" };
}

export async function POST(req: Request) {
  let user;
  try {
    user = await requireManager();
  } catch {
    return apiError("לא מחובר", 401);
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const manualCategory = form.get("category") as string | null;

  if (!file) return apiError("קובץ חסר", 400);

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mimeType = file.type || "image/jpeg";

  let ocrText = "";
  try {
    const ocrRes = await fetch(`${OCR_URL}/ocr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64, mime_type: mimeType }),
      signal: AbortSignal.timeout(30_000),
    });
    if (ocrRes.ok) {
      const data = await ocrRes.json();
      ocrText = data.text ?? data.result ?? "";
    }
  } catch {
    // OCR failed — proceed without text extraction
  }

  const { category, confidence, label } = manualCategory
    ? { category: manualCategory as DocumentCategory, confidence: 100, label: manualCategory }
    : classifyDocument(ocrText);

  // Save document to DB using OrganizationDocument model
  const doc = await prisma.organizationDocument.create({
    data: {
      organizationId: user.organizationId!,
      name: file.name,
      fileUrl: "", // Updated after actual file upload to storage
      mimeType,
      fileSize: buffer.byteLength,
      category,
      description: ocrText ? `OCR: ${ocrText.slice(0, 200)}` : undefined,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      documentId: doc.id,
      category,
      categoryLabel: label,
      confidence,
      ocrPreview: ocrText.slice(0, 500),
      name: file.name,
    },
  });
}
