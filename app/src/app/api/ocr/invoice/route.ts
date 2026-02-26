/**
 * POST /api/ocr/invoice
 * Accepts an image (base64 or FormData), sends to hebrew-ocr-backend,
 * parses extracted text for: amount, date, vendor, invoice number.
 * Returns extracted fields for user review before creating an expense.
 */
import { NextResponse } from "next/server";
import { requireManager, apiError } from "@/lib/api-helpers";

const OCR_URL = process.env.OCR_BACKEND_URL ?? "https://hebrew-ocr-backend.onrender.com";

function parseHebrewAmount(text: string): number | null {
  // Look for ₪ or שקל or "סך הכל" patterns
  const patterns = [
    /סך\s*הכל[:\s]*₪?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /לתשלום[:\s]*₪?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /סכום[:\s]*₪?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /₪\s*([\d,]+(?:\.\d{1,2})?)/,
    /(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\s*₪/,
    /(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\s*שקל/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const num = parseFloat(m[1].replace(/,/g, ""));
      if (num > 0 && num < 10_000_000) return num;
    }
  }
  return null;
}

function parseHebrewDate(text: string): string | null {
  // dd/mm/yyyy or dd.mm.yyyy
  const m = text.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if (m) {
    const [, d, mo, y] = m;
    const date = new Date(`${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`);
    if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];
  }
  return null;
}

function parseVendor(text: string): string | null {
  // Look for "ע"ש" or "מוכר:" or "ספק:" or "שם העסק" patterns
  const patterns = [
    /ע["\u05F4]ש\s*([^\n\r,]{2,40})/,
    /מוכר[:\s]+([^\n\r,]{2,40})/i,
    /ספק[:\s]+([^\n\r,]{2,40})/i,
    /שם\s*(?:ה)?עסק[:\s]+([^\n\r,]{2,40})/i,
    /לכבוד[:\s]+([^\n\r,]{2,40})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

function parseInvoiceNumber(text: string): string | null {
  const patterns = [
    /חשבונית\s*(?:מס\'?|מספר)[:\s]*([A-Z\d\-\/]+)/i,
    /מספר\s*(?:חשבונית|מסמך)[:\s]*([A-Z\d\-\/]+)/i,
    /invoice\s*#?\s*([A-Z\d\-\/]+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

export async function POST(req: Request) {
  try {
    await requireManager();
  } catch {
    return apiError("לא מחובר", 401);
  }

  let imageBase64: string;
  let mimeType = "image/jpeg";

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return apiError("קובץ חסר", 400);
    mimeType = file.type || "image/jpeg";
    const buffer = await file.arrayBuffer();
    imageBase64 = Buffer.from(buffer).toString("base64");
  } else {
    const body = await req.json();
    imageBase64 = body.image;
    mimeType = body.mimeType ?? "image/jpeg";
    if (!imageBase64) return apiError("תמונה חסרה", 400);
  }

  // Send to OCR backend
  let ocrText = "";
  try {
    const ocrRes = await fetch(`${OCR_URL}/ocr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageBase64, mime_type: mimeType }),
      signal: AbortSignal.timeout(30_000),
    });

    if (ocrRes.ok) {
      const ocrData = await ocrRes.json();
      ocrText = ocrData.text ?? ocrData.result ?? "";
    } else {
      console.warn("[OCR] Backend returned", ocrRes.status);
    }
  } catch (err) {
    console.error("[OCR] Backend error:", err);
    // Proceed with empty text — user can fill manually
  }

  // Parse extracted fields
  const amount = parseHebrewAmount(ocrText);
  const date = parseHebrewDate(ocrText);
  const vendor = parseVendor(ocrText);
  const invoiceNumber = parseInvoiceNumber(ocrText);

  return NextResponse.json({
    success: true,
    data: {
      rawText: ocrText.slice(0, 2000),
      extracted: {
        amount,
        date: date ?? new Date().toISOString().split("T")[0],
        vendor,
        invoiceNumber,
        description: vendor ? `חשבונית — ${vendor}` : "חשבונית",
        category: "OTHER",
      },
    },
  });
}
