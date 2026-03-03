/**
 * GET /api/reports/annual?year=2024
 * Returns full HTML annual report for printing/saving as PDF.
 */
import { NextResponse } from "next/server";
import { requireManager, apiError } from "@/lib/api-helpers";
import { generateAnnualReportHtml } from "@/lib/report-generator";

export async function GET(req: Request) {
  let user;
  try {
    user = await requireManager();
  } catch {
    return apiError("לא מחובר", 401);
  }

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());

  if (isNaN(year) || year < 2000 || year > 2099) {
    return apiError("שנה לא תקינה", 400);
  }

  try {
    const html = await generateAnnualReportHtml(user.organizationId!, year);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return apiError("שגיאה ביצירת הדוח", 500);
  }
}
