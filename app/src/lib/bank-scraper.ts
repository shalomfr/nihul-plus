import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";

/* ── Supported banks and their credential fields ── */

export type CredentialField = {
  key: string;
  label: string;
  type: "text" | "password";
};

export type SupportedBank = {
  companyId: string;
  name: string;
  icon: string;
  type: "bank" | "card";
  fields: CredentialField[];
};

export const SUPPORTED_BANKS: SupportedBank[] = [
  // Banks
  {
    companyId: "hapoalim",
    name: "בנק הפועלים",
    icon: "🏦",
    type: "bank",
    fields: [
      { key: "userCode", label: "קוד משתמש", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
  {
    companyId: "leumi",
    name: "בנק לאומי",
    icon: "🏦",
    type: "bank",
    fields: [
      { key: "username", label: "שם משתמש", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
  {
    companyId: "discount",
    name: "בנק דיסקונט",
    icon: "🏦",
    type: "bank",
    fields: [
      { key: "id", label: "תעודת זהות", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
      { key: "num", label: "קוד זיהוי", type: "text" },
    ],
  },
  {
    companyId: "mercantile",
    name: "בנק מרכנתיל",
    icon: "🏦",
    type: "bank",
    fields: [
      { key: "id", label: "תעודת זהות", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
      { key: "num", label: "קוד זיהוי", type: "text" },
    ],
  },
  {
    companyId: "mizrahi",
    name: "בנק מזרחי טפחות",
    icon: "🏦",
    type: "bank",
    fields: [
      { key: "username", label: "שם משתמש", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
  {
    companyId: "otsarHahayal",
    name: "בנק אוצר החייל",
    icon: "🏦",
    type: "bank",
    fields: [
      { key: "username", label: "שם משתמש", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
  {
    companyId: "union",
    name: "בנק איגוד",
    icon: "🏦",
    type: "bank",
    fields: [
      { key: "username", label: "שם משתמש", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
  {
    companyId: "beinleumi",
    name: "הבנק הבינלאומי",
    icon: "🏦",
    type: "bank",
    fields: [
      { key: "username", label: "שם משתמש", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
  {
    companyId: "massad",
    name: "בנק מסד",
    icon: "🏦",
    type: "bank",
    fields: [
      { key: "username", label: "שם משתמש", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
  {
    companyId: "yahav",
    name: "בנק יהב",
    icon: "🏦",
    type: "bank",
    fields: [
      { key: "username", label: "שם משתמש", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
      { key: "nationalID", label: "תעודת זהות", type: "text" },
    ],
  },
  // Credit cards
  {
    companyId: "visaCal",
    name: "ויזה כאל",
    icon: "💳",
    type: "card",
    fields: [
      { key: "username", label: "שם משתמש", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
  {
    companyId: "max",
    name: "מקס",
    icon: "💳",
    type: "card",
    fields: [
      { key: "username", label: "שם משתמש", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
  {
    companyId: "isracard",
    name: "ישראכרט",
    icon: "💳",
    type: "card",
    fields: [
      { key: "id", label: "תעודת זהות", type: "text" },
      { key: "card6Digits", label: "6 ספרות אחרונות", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
  {
    companyId: "amex",
    name: "אמריקן אקספרס",
    icon: "💳",
    type: "card",
    fields: [
      { key: "username", label: "תעודת זהות", type: "text" },
      { key: "card6Digits", label: "6 ספרות אחרונות", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
];

/* ── Helpers ── */

function getCompanyType(companyId: string): string {
  const bank = SUPPORTED_BANKS.find(b => b.companyId === companyId);
  if (!bank) throw new Error(`Unsupported bank: ${companyId}`);
  return companyId;
}

export function getBankByCompanyId(companyId: string): SupportedBank | undefined {
  return SUPPORTED_BANKS.find(b => b.companyId === companyId);
}

/* ── Scrape a bank ── */

type ScrapeResult = {
  success: boolean;
  accounts?: Array<{
    accountNumber: string;
    balance?: number;
    txns: Array<{
      date: string;
      processedDate: string;
      originalAmount: number;
      chargedAmount: number;
      description: string;
      memo?: string;
      status: string;
      type: string;
    }>;
  }>;
  errorType?: string;
  errorMessage?: string;
};

export async function scrapeBank(
  companyId: string,
  credentials: Record<string, string>,
  startDate: Date,
): Promise<ScrapeResult> {
  const companyType = getCompanyType(companyId);

  // Lazy-import heavy dependencies so the module doesn't crash on import
  // when puppeteer/chromium binaries aren't available (e.g. local dev, GET endpoints)
  const [{ createScraper, CompanyTypes }, chromiumModule] = await Promise.all([
    import("israeli-bank-scrapers"),
    import("@sparticuz/chromium"),
  ]);
  const chromium = chromiumModule.default;
  const executablePath = await chromium.executablePath();

  const scraper = createScraper({
    companyId: companyType as (typeof CompanyTypes)[keyof typeof CompanyTypes],
    startDate,
    combineInstallments: false,
    showBrowser: false,
    executablePath,
    args: chromium.args,
    timeout: 120000, // 2 minutes — Israeli bank sites can be slow
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await scraper.scrape(credentials as any);

  return {
    success: result.success,
    accounts: result.success ? result.accounts : undefined,
    errorType: result.success ? undefined : result.errorType,
    errorMessage: result.success ? undefined : result.errorMessage,
  };
}

/* ── Sync bank data into DB ── */

export async function syncBankData(
  organizationId: string,
  connectionId: string,
): Promise<{ accountsFound: number; txnsSynced: number }> {
  const connection = await prisma.bankScraperConnection.findFirst({
    where: { id: connectionId, organizationId },
  });

  if (!connection) throw new Error("Connection not found");

  // Decrypt credentials
  const credentials = JSON.parse(decrypt(connection.encryptedCreds));

  // Scrape — last 90 days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);

  const result = await scrapeBank(connection.companyId, credentials, startDate);

  if (!result.success) {
    await prisma.bankScraperConnection.update({
      where: { id: connectionId },
      data: {
        status: "ERROR",
        lastError: result.errorMessage ?? result.errorType ?? "Unknown error",
      },
    });

    const errorMsg =
      result.errorType === "INVALID_PASSWORD" ? "שם משתמש או סיסמה שגויים"
      : result.errorType === "CHANGE_PASSWORD" ? "נדרש שינוי סיסמה באתר הבנק"
      : result.errorType === "ACCOUNT_BLOCKED" ? "החשבון חסום באתר הבנק"
      : result.errorType === "TIMEOUT" ? "הבנק לא הגיב בזמן, נסה שוב"
      : result.errorMessage ?? "שגיאה לא ידועה";

    throw new Error(errorMsg);
  }

  let totalAccounts = 0;
  let totalTxns = 0;

  for (const account of result.accounts ?? []) {
    // Upsert BankAccount
    const bankAccount = await prisma.bankAccount.upsert({
      where: {
        organizationId_bankCode_branchNumber_accountNumber: {
          organizationId,
          bankCode: 0, // scraper doesn't provide bank code; use 0 as placeholder
          branchNumber: "0",
          accountNumber: account.accountNumber,
        },
      },
      create: {
        organizationId,
        bankName: connection.bankName,
        bankCode: 0,
        branchNumber: "0",
        accountNumber: account.accountNumber,
        balance: account.balance ?? 0,
        availableBalance: account.balance ?? 0,
        lastSyncAt: new Date(),
      },
      update: {
        balance: account.balance ?? undefined,
        availableBalance: account.balance ?? undefined,
        lastSyncAt: new Date(),
      },
    });

    totalAccounts++;

    // Insert transactions — skip duplicates
    for (const txn of account.txns) {
      const valueDate = new Date(txn.date);
      const bookingDate = new Date(txn.processedDate);
      const direction = txn.chargedAmount >= 0 ? "CREDIT" : "DEBIT";

      // Create a deterministic reference for dedup
      const reference = `${valueDate.toISOString().slice(0, 10)}_${txn.chargedAmount}_${txn.description?.slice(0, 30) ?? ""}`;

      const existing = await prisma.bankTransaction.findFirst({
        where: {
          bankAccountId: bankAccount.id,
          reference,
        },
      });

      if (!existing) {
        await prisma.bankTransaction.create({
          data: {
            bankAccountId: bankAccount.id,
            amount: Math.abs(txn.chargedAmount),
            direction,
            description: txn.description,
            counterpartyName: txn.description,
            reference,
            valueDate,
            bookingDate,
            balance: undefined,
            state: txn.status === "completed" ? "booked" : "pending",
          },
        });
        totalTxns++;
      }
    }
  }

  // Update connection status
  await prisma.bankScraperConnection.update({
    where: { id: connectionId },
    data: {
      status: "ACTIVE",
      lastSyncAt: new Date(),
      lastError: null,
      accountsFound: totalAccounts,
      txnsSynced: totalTxns,
    },
  });

  return { accountsFound: totalAccounts, txnsSynced: totalTxns };
}
