/**
 * GET /api/accountant/summary?from=...&to=...
 * Returns JSON financial summary for the accountant portal.
 */
import { prisma } from "@/lib/prisma";
import { requireManager, apiResponse, apiError } from "@/lib/api-helpers";

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

  const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
  const toDate = to ? new Date(to) : new Date();
  toDate.setHours(23, 59, 59);

  const orgId = user.organizationId!;

  const [expenses, donations, accounts, complianceItems] = await Promise.all([
    prisma.expense.findMany({
      where: { organizationId: orgId, expenseDate: { gte: fromDate, lte: toDate } },
    }),
    prisma.donation.findMany({
      where: { organizationId: orgId, donatedAt: { gte: fromDate, lte: toDate }, status: "COMPLETED" },
    }),
    prisma.bankAccount.findMany({
      where: { organizationId: orgId },
      select: { bankName: true, accountNumber: true, balance: true, isPrimary: true },
    }),
    prisma.complianceItem.findMany({
      where: { organizationId: orgId },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
  ]);

  // Expenses by category
  const expensesByCategory: Record<string, number> = {};
  for (const e of expenses) {
    expensesByCategory[e.category] = (expensesByCategory[e.category] ?? 0) + e.amount;
  }

  // Monthly income trend
  const monthlyIncome: Record<string, number> = {};
  for (const d of donations) {
    const key = `${d.donatedAt.getFullYear()}-${String(d.donatedAt.getMonth() + 1).padStart(2, "0")}`;
    monthlyIncome[key] = (monthlyIncome[key] ?? 0) + d.amount;
  }

  const totalIncome = donations.reduce((s, d) => s + d.amount, 0);
  const totalExpenses = expenses.filter(e => ["PAID", "APPROVED"].includes(e.status)).reduce((s, e) => s + e.amount, 0);
  const pendingExpenses = expenses.filter(e => ["PENDING", "PENDING_APPROVAL"].includes(e.status)).reduce((s, e) => s + e.amount, 0);

  return apiResponse({
    period: { from: fromDate.toISOString(), to: toDate.toISOString() },
    summary: {
      totalIncome,
      totalExpenses,
      pendingExpenses,
      surplus: totalIncome - totalExpenses,
      donationCount: donations.length,
      expenseCount: expenses.length,
    },
    bankAccounts: accounts,
    expensesByCategory,
    monthlyIncome,
    compliance: complianceItems.map(c => ({
      itemName: c.name,
      dueDate: c.dueDate,
      status: c.status,
    })),
    missingReceipts: await prisma.donation.count({
      where: { organizationId: orgId, status: "COMPLETED", receiptId: null },
    }),
  });
}
