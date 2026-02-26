/**
 * GET /api/accountant/export?from=2024-01-01&to=2024-12-31&type=expenses|transactions|all
 * Returns CSV suitable for import into Rav-Masar / Priority / Rivhit accounting software.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManager, apiError } from "@/lib/api-helpers";

function escapeCsv(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(...cells: unknown[]): string {
  return cells.map(escapeCsv).join(",");
}

export async function GET(req: Request) {
  let user;
  try {
    user = await requireManager();
  } catch {
    return apiError("לא מחובר", 401);
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const type = searchParams.get("type") ?? "all";

  const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
  const toDate = to ? new Date(to) : new Date();
  toDate.setHours(23, 59, 59);

  const orgId = user.organizationId!;
  const fmtDate = (d: Date | string) => new Date(d).toLocaleDateString("he-IL");

  let csvRows: string[] = [];

  // ── EXPENSES ──────────────────────────────────────────────────────────────
  if (type === "expenses" || type === "all") {
    const expenses = await prisma.expense.findMany({
      where: { organizationId: orgId, expenseDate: { gte: fromDate, lte: toDate } },
      include: { bankAccount: true },
      orderBy: { expenseDate: "asc" },
    });

    const categoryLabels: Record<string, string> = {
      SALARIES: "משכורות", RENT: "שכירות", ACTIVITIES: "פעילויות",
      MARKETING: "שיווק", ADMINISTRATION: "הנהלה וכלליות",
      TRANSPORTATION: "תחבורה", SUPPLIES: "ציוד",
      PROFESSIONAL_SERVICES: "שירותים מקצועיים", INSURANCE: "ביטוח",
      MAINTENANCE: "תחזוקה", OTHER: "אחר",
    };
    const statusLabels: Record<string, string> = {
      PENDING: "ממתין", PENDING_APPROVAL: "ממתין לאישור",
      APPROVED: "מאושר", PAID: "שולם", REJECTED: "נדחה",
    };

    csvRows.push("# הוצאות");
    csvRows.push(row("תאריך", "תיאור", "קטגוריה", "ספק", "סכום (₪)", "סטטוס", "חשבון בנק", "מזהה"));

    for (const e of expenses) {
      csvRows.push(row(
        fmtDate(e.expenseDate),
        e.description,
        categoryLabels[e.category] ?? e.category,
        e.vendor ?? "",
        e.amount,
        statusLabels[e.status] ?? e.status,
        e.bankAccount ? `${e.bankAccount.bankName} ${e.bankAccount.accountNumber}` : "",
        e.id,
      ));
    }
    csvRows.push(`# סה"כ הוצאות: ${expenses.reduce((s, e) => s + e.amount, 0)}`);
    csvRows.push("");
  }

  // ── BANK TRANSACTIONS ─────────────────────────────────────────────────────
  if (type === "transactions" || type === "all") {
    const accounts = await prisma.bankAccount.findMany({
      where: { organizationId: orgId },
      select: { id: true },
    });
    const accountIds = accounts.map(a => a.id);

    const transactions = await prisma.bankTransaction.findMany({
      where: {
        bankAccountId: { in: accountIds },
        bookingDate: { gte: fromDate, lte: toDate },
      },
      include: { bankAccount: true },
      orderBy: { bookingDate: "asc" },
    });

    csvRows.push("# תנועות בנק");
    csvRows.push(row("תאריך ערך", "תאריך רישום", "תיאור", "כיוון", "סכום (₪)", "יתרה", "בנק", "חשבון", "קטגוריה", "מזהה"));

    for (const tx of transactions) {
      csvRows.push(row(
        fmtDate(tx.valueDate),
        fmtDate(tx.bookingDate),
        tx.description,
        tx.direction === "CREDIT" ? "זיכוי" : "חיוב",
        tx.direction === "DEBIT" ? -tx.amount : tx.amount,
        tx.balance ?? "",
        tx.bankAccount.bankName,
        tx.bankAccount.accountNumber,
        tx.category ?? "",
        tx.id,
      ));
    }
    csvRows.push(`# סה"כ תנועות: ${transactions.length}`);
    csvRows.push("");
  }

  // ── DONATIONS ─────────────────────────────────────────────────────────────
  if (type === "all") {
    const donations = await prisma.donation.findMany({
      where: { organizationId: orgId, donatedAt: { gte: fromDate, lte: toDate }, status: "COMPLETED" },
      include: { donor: true },
      orderBy: { donatedAt: "asc" },
    });

    csvRows.push("# תרומות");
    csvRows.push(row("תאריך", "שם תורם", "סכום (₪)", "מטבע", "אמצעי תשלום", "קבלה נשלחה", "מזהה"));

    for (const d of donations) {
      csvRows.push(row(
        fmtDate(d.donatedAt),
        d.donor ? `${d.donor.firstName} ${d.donor.lastName}` : "אנונימי",
        d.amount,
        d.currency ?? "ILS",
        d.method ?? "",
        d.receiptId ? "כן" : "לא",
        d.id,
      ));
    }
    csvRows.push(`# סה"כ תרומות: ${donations.reduce((s, d) => s + d.amount, 0)}`);
  }

  const orgInfo = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true, number: true },
  });

  const header = [
    `# דוח כספי — ${orgInfo?.name ?? ""}`,
    `# ע"ר: ${orgInfo?.number ?? ""}`,
    `# תקופה: ${fmtDate(fromDate)} — ${fmtDate(toDate)}`,
    `# הופק: ${fmtDate(new Date())}`,
    `# מערכת מעטפת`,
    "",
  ];

  const csv = [...header, ...csvRows].join("\n");

  return new NextResponse("\uFEFF" + csv, { // BOM for Excel Hebrew
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="maatefet-export-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
