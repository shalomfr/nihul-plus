/**
 * Classify Transactions Job — AI-categorizes uncategorized bank transactions.
 * Runs daily at 10:00 IL time.
 */
import { prisma } from "../prisma";
import { classifyTransaction } from "../ai-classifier";

export async function runClassifyTransactions() {
  console.log("[classify-transactions] Starting...");

  // Find uncategorized transactions (no category assigned)
  const transactions = await prisma.bankTransaction.findMany({
    where: {
      category: null,
      description: { not: "" },
    },
    take: 200, // process up to 200 per run
    orderBy: { bookingDate: "desc" },
  });

  console.log(`[classify-transactions] Found ${transactions.length} uncategorized transactions`);

  let classified = 0;
  for (const tx of transactions) {
    try {
      const result = await classifyTransaction(
        tx.description ?? "",
        tx.amount,
        tx.direction as "CREDIT" | "DEBIT"
      );

      await prisma.bankTransaction.update({
        where: { id: tx.id },
        data: { category: result.category },
      });

      classified++;
    } catch (err) {
      console.error(`[classify-transactions] Error on tx ${tx.id}:`, err);
    }
  }

  console.log(`[classify-transactions] Classified ${classified}/${transactions.length} transactions`);
}
