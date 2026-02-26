/**
 * Bank Sync Job — scrapes all active bank accounts for all organizations.
 * Runs at 07:45 every morning.
 */
import { prisma } from "../prisma";
import { syncBankData } from "../bank-scraper";

export async function runBankSync() {
  console.log("[bank-sync] Starting daily bank sync...");

  const connections = await prisma.bankScraperConnection.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, organizationId: true, bankName: true },
  });

  if (connections.length === 0) {
    console.log("[bank-sync] No active connections found.");
    return;
  }

  let synced = 0;
  let failed = 0;

  for (const conn of connections) {
    try {
      await syncBankData(conn.organizationId, conn.id);
      synced++;
      console.log(`[bank-sync] ✓ ${conn.bankName} (org: ${conn.organizationId})`);
    } catch (err) {
      failed++;
      console.error(`[bank-sync] ✗ ${conn.bankName} (org: ${conn.organizationId}):`, err);
      await prisma.bankScraperConnection.update({
        where: { id: conn.id },
        data: {
          status: "ERROR",
          lastError: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }

  console.log(`[bank-sync] Done. Synced: ${synced}, Failed: ${failed}`);
}
