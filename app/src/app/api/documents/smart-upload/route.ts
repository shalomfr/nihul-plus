/**
 * POST /api/documents/smart-upload
 * Accepts a file, runs OCR, classifies document type, saves with auto-category.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManager, apiError } from "@/lib/api-helpers";

const OCR_URL = process.env.OCR_BACKEND_URL ?? "https://hebrew-ocr-backend.onrender.com";

type DocumentCategory =
  | "CERTIFICATE"
  | "FINANCIAL_MGMT"
  | "GOVERNANCE"
  | "LEGAL"
  | "HR"
  | "CORRESPONDENCE"
  | "OTHER";

function classifyDocument(text: string): { category: DocumentCategory; confidence: number } {
  const lower = text.toLowerCase();

  // Certificate of good standing
  if (/ניהול תקין|אישור ניהול|אישור בתוקף/.test(lower)) {
    return { category: "CERTIFICATE", confidence: 90 };
  }
  // Financial documents
  if (/מאזן|דוח כספי|דוח רווח|תזרים|תקציב|ביקורת חשבונות/.test(lower)) {
    return { category: "FINANCIAL_MGMT", confidence: 88 };
  }
  // Governance
  if (/פרוטוקול|אסיפה|ועד|החלטה|הצבעה|רשימת חברים/.test(lower)) {
    return { category: "GOVERNANCE", confidence: 85 };
  }
  // Legal
  if (/תקנון|חוזה|הסכם|ייפוי כוח|תצהיר|בית משפט/.test(lower)) {
    return { category: "LEGAL", confidence: 85 };
  }
  // HR
  if (/חוזה עבודה|שכר|פיטורין|מכתב אישור|עובד/.test(lower)) {
    return { category: "HR", confidence: 80 };
  }
  // Correspondence
  if (/לכבוד|בכבוד רב|מכתב|פניה|בקשה/.test(lower)) {
    return { category: "CORRESPONDENCE", confidence: 70 };
  }

  return { category: "OTHER", confidence: 50 };
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
  } catch (err) {
    console.warn("[smart-upload] OCR failed:", err);
  }

  const { category, confidence } = manualCategory
    ? { category: manualCategory as DocumentCategory, confidence: 100 }
    : classifyDocument(ocrText);

  // Save document to DB
  const doc = await prisma.document.create({
    data: {
      organizationId: user.organizationId!,
      uploadedById: user.id,
      name: file.name,
      fileUrl: "", // Will be updated after actual file upload to storage
      mimeType,
      fileSize: buffer.byteLength,
      category,
      ocrText: ocrText.slice(0, 5000) || null,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      documentId: doc.id,
      category,
      confidence,
      ocrPreview: ocrText.slice(0, 500),
      name: file.name,
    },
  });
}
