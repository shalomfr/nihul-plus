/**
 * GET /api/donations/[id]/receipt
 * Returns a full HTML receipt for a donation (Section 46 tax receipt).
 * Accessible by the org manager and (via public share token) by the donor.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, apiError } from "@/lib/api-helpers";
import { generateReceiptHtml } from "@/lib/receipt-generator";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token"); // public share token (optional)

  const session = await getAuthSession();
  if (!session && !token) {
    return apiError("לא מחובר", 401);
  }

  const donation = await prisma.donation.findUnique({
    where: { id },
    include: {
      donor: true,
      organization: {
        include: {
          users: {
            where: { role: "MANAGER", status: "APPROVED" },
            select: { name: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!donation) return apiError("תרומה לא נמצאה", 404);

  // Auth check
  if (session && session.role !== "ADMIN") {
    if (donation.organizationId !== session.organizationId) {
      return apiError("אין הרשאה", 403);
    }
  }

  // Find receipt number (position in org donations ordered by date)
  const receiptNumber = await prisma.donation.count({
    where: {
      organizationId: donation.organizationId,
      donatedAt: { lte: donation.donatedAt },
    },
  });

  const org = donation.organization;
  const donor = donation.donor;

  const html = generateReceiptHtml({
    receiptNumber,
    donorName: donor
      ? `${donor.firstName} ${donor.lastName}`.trim()
      : "תורם אנונימי",
    donorId: donor?.idNumber ?? undefined,
    donorAddress: donor?.address ?? undefined,
    donorEmail: donor?.email ?? undefined,
    amount: donation.amount,
    currency: donation.currency ?? "ILS",
    paymentMethod: donation.method ?? undefined,
    donatedAt: donation.donatedAt,
    organizationName: org.name,
    organizationNumber: org.number ?? "",
    organizationAddress: org.address ?? undefined,
    organizationPhone: org.phone ?? undefined,
    section46Approved: true,
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
