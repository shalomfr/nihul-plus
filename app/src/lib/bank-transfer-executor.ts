/**
 * Bank Transfer Executor — Puppeteer-based screenshot relay.
 *
 * Flow:
 *   startTransferExecution() → logs into bank, navigates to transfer form,
 *                              pre-fills, takes screenshot → returns {sessionId, screenshot}
 *   confirmTransfer()        → clicks the bank's confirm button, syncs → returns {success}
 *
 * Sessions are kept in a module-level Map (persistent between Next.js requests in the same
 * server process). They expire after 5 minutes.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Page = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Browser = any;

export type TransferData = {
  id: string;
  amount: number;
  purpose: string;
  description: string | null;
  toExternalAccount: string | null;
  toExternalBankCode: string | null;
  toExternalBranchNumber: string | null;
  toExternalName: string | null;
  fromAccountNumber: string | null;
};

type ExecuteSession = {
  browser: Browser;
  page: Page;
  transferId: string;
  orgId: string;
  bankName: string;
  expiresAt: Date;
};

export type StartResult = {
  sessionId: string;
  screenshot: string; // base64 PNG
  step: "confirm" | "otp";
  message: string;
};

export type ConfirmResult = {
  success: boolean;
  screenshot?: string;
  message: string;
};

// ── Module-level session store ────────────────────────────────────────────────
const sessions = new Map<string, ExecuteSession>();

// Cleanup stale sessions every minute
const cleanupTimer = setInterval(() => {
  const now = new Date();
  for (const [id, s] of sessions) {
    if (s.expiresAt < now) {
      void cleanupSession(id);
    }
  }
}, 60_000);
// Don't prevent process exit
if (typeof cleanupTimer.unref === "function") cleanupTimer.unref();

export async function cleanupSession(sessionId: string) {
  const s = sessions.get(sessionId);
  if (!s) return;
  sessions.delete(sessionId);
  try {
    await s.browser.close();
  } catch {
    // ignore
  }
}

// ── Launch Puppeteer (same pattern as bank-scraper.ts) ────────────────────────
async function launchBrowser(): Promise<{ browser: Browser; page: Page }> {
  const [chromiumModule, puppeteerModule] = await Promise.all([
    import("@sparticuz/chromium"),
    import("puppeteer-core"),
  ]);
  const chromium = chromiumModule.default;
  const puppeteer = puppeteerModule.default;

  const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
    defaultViewport: { width: 1280, height: 900 },
    timeout: 60_000,
  });

  const page = await browser.newPage();
  await page.setDefaultTimeout(30_000);
  await page.setDefaultNavigationTimeout(60_000);

  // Block heavy resources to speed up page load
  await page.setRequestInterception(true);
  page.on("request", (req: { resourceType: () => string; abort: () => void; continue: () => void }) => {
    if (["image", "font", "media"].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  return { browser, page };
}

// ── Take a screenshot ─────────────────────────────────────────────────────────
async function screenshot(page: Page): Promise<string> {
  // Re-enable images briefly for screenshot
  await page.setRequestInterception(false);
  const buf = await page.screenshot({ type: "png", fullPage: false });
  await page.setRequestInterception(true);
  page.on("request", (req: { resourceType: () => string; abort: () => void; continue: () => void }) => {
    if (["image", "font", "media"].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });
  return Buffer.from(buf).toString("base64");
}

// ── Per-bank executor interfaces ──────────────────────────────────────────────
interface BankExecutor {
  login(page: Page, credentials: Record<string, string>): Promise<void>;
  navigateToTransferForm(page: Page, transfer: TransferData): Promise<void>;
  fillTransferForm(page: Page, transfer: TransferData): Promise<void>;
  /** Returns true if an OTP input is visible on page */
  needsOtp(page: Page): Promise<boolean>;
  fillOtp(page: Page, otp: string): Promise<void>;
  clickConfirm(page: Page): Promise<void>;
  detectSuccess(page: Page): Promise<boolean>;
}

// ── Hapoalim ─────────────────────────────────────────────────────────────────
class HapoalimExecutor implements BankExecutor {
  private readonly LOGIN_URL =
    "https://login.bankhapoalim.co.il/cgi-bin/poalwwwc?reqName=getLogonPage";

  async login(page: Page, credentials: Record<string, string>) {
    await page.goto(this.LOGIN_URL, { waitUntil: "networkidle2" });
    await page.waitForSelector("#userCode", { timeout: 20_000 });
    await page.type("#userCode", credentials.userCode ?? credentials.username ?? "");
    await page.type("#password", credentials.password ?? "");
    await page.click(".login-btn");
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60_000 });
  }

  async navigateToTransferForm(page: Page, transfer: TransferData) {
    // Navigate to Hapoalim's external transfer form
    // The exact URL for external bank transfers (non-Hapoalim recipients)
    await page.goto("https://www.bankhapoalim.co.il/myaccount/login", {
      waitUntil: "networkidle2",
    });
    // Try direct navigation to transfer page
    await page.goto(
      "https://www.bankhapoalim.co.il/myaccount/outsideTransfer",
      { waitUntil: "domcontentloaded", timeout: 30_000 }
    ).catch(() => {
      // If direct URL fails, try navigation via menu
    });
  }

  async fillTransferForm(page: Page, transfer: TransferData) {
    // Wait for form to be ready
    // NOTE: These selectors need verification against live Hapoalim UI
    try {
      // Amount field
      await page.waitForSelector('input[id*="amount"], input[name*="amount"], #transferAmount', {
        timeout: 15_000,
      });
      const amountSel = await page.$('input[id*="amount"], input[name*="amount"], #transferAmount');
      if (amountSel) {
        await amountSel.click({ clickCount: 3 });
        await amountSel.type(transfer.amount.toString());
      }

      // Description / purpose
      const descSel = await page.$(
        'input[id*="description"], input[name*="description"], textarea[id*="description"], #transferDescription'
      );
      if (descSel) {
        await descSel.click({ clickCount: 3 });
        await descSel.type(transfer.purpose ?? transfer.description ?? "");
      }

      // Beneficiary account (external transfer)
      if (transfer.toExternalAccount) {
        const acctSel = await page.$(
          'input[id*="account"], input[name*="benefAccount"], #beneficiaryAccount'
        );
        if (acctSel) {
          await acctSel.click({ clickCount: 3 });
          await acctSel.type(transfer.toExternalAccount);
        }
      }
      if (transfer.toExternalBranchNumber) {
        const branchSel = await page.$('input[id*="branch"], input[name*="branch"], #beneficiaryBranch');
        if (branchSel) {
          await branchSel.click({ clickCount: 3 });
          await branchSel.type(transfer.toExternalBranchNumber);
        }
      }
      if (transfer.toExternalBankCode) {
        const bankSel = await page.$('input[id*="bankCode"], input[name*="bankCode"], #beneficiaryBank');
        if (bankSel) {
          await bankSel.click({ clickCount: 3 });
          await bankSel.type(transfer.toExternalBankCode);
        }
      }
    } catch (err) {
      console.warn("[executor:hapoalim] fillTransferForm partial failure:", err);
    }
  }

  async needsOtp(page: Page): Promise<boolean> {
    try {
      const el = await page.$('input[id*="otp"], input[id*="sms"], input[placeholder*="קוד"]');
      return !!el;
    } catch {
      return false;
    }
  }

  async fillOtp(page: Page, otp: string) {
    const sel = await page.$('input[id*="otp"], input[id*="sms"], input[placeholder*="קוד"]');
    if (sel) {
      await sel.click({ clickCount: 3 });
      await sel.type(otp);
    }
  }

  async clickConfirm(page: Page) {
    // Try common confirm button selectors
    const confirmSels = [
      'button[id*="confirm"]',
      'button[id*="submit"]',
      'input[type="submit"]',
      'button.confirm-btn',
      'button[class*="confirm"]',
      'button[class*="submit"]',
      'a[id*="confirm"]',
    ];
    for (const sel of confirmSels) {
      const btn = await page.$(sel);
      if (btn) {
        await btn.click();
        return;
      }
    }
    // Fallback: find button with confirm text
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button, input[type=submit], a"));
      const confirmBtn = buttons.find((b) =>
        /אשר|אישור|confirm|שלח|בצע/i.test(b.textContent ?? "")
      ) as HTMLElement | undefined;
      if (confirmBtn) confirmBtn.click();
    });
  }

  async detectSuccess(page: Page): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 3000));
    const url = page.url();
    const bodyText: string = await page.evaluate(() => document.body?.innerText ?? "");
    return (
      url.includes("success") ||
      url.includes("receipt") ||
      /ההעברה בוצעה|בוצע בהצלחה|אושרה|success/i.test(bodyText)
    );
  }
}

// ── Leumi ─────────────────────────────────────────────────────────────────────
class LeumiExecutor implements BankExecutor {
  private readonly LOGIN_URL = "https://www.leumi.co.il/he";

  async login(page: Page, credentials: Record<string, string>) {
    await page.goto(this.LOGIN_URL, { waitUntil: "networkidle2" });
    // Find and click login button to navigate to login form
    const loginBtn = await page.$('a[title*="כניסה"], a[href*="login"], .login-button');
    if (loginBtn) {
      await loginBtn.click();
      await page.waitForNavigation({ waitUntil: "networkidle2" });
    }
    await page.waitForSelector('input[placeholder="שם משתמש"]', { timeout: 20_000 });
    await page.type('input[placeholder="שם משתמש"]', credentials.username ?? "");
    await page.type('input[placeholder="סיסמה"]', credentials.password ?? "");
    await page.click("button[type='submit']");
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60_000 });
  }

  async navigateToTransferForm(page: Page, _transfer: TransferData) {
    await page.goto(
      "https://hb2.bankleumi.co.il/eBanking/SO/SPA.aspx#/payments/newTransfer",
      { waitUntil: "domcontentloaded", timeout: 30_000 }
    ).catch(() => {});
  }

  async fillTransferForm(page: Page, transfer: TransferData) {
    // Leumi transfer form — selectors need verification
    try {
      await page.waitForSelector('input[id*="amount"], input[ng-model*="amount"]', { timeout: 15_000 });
      const amountSel = await page.$('input[id*="amount"], input[ng-model*="amount"]');
      if (amountSel) {
        await amountSel.click({ clickCount: 3 });
        await amountSel.type(transfer.amount.toString());
      }
    } catch (err) {
      console.warn("[executor:leumi] fillTransferForm partial failure:", err);
    }
  }

  async needsOtp(page: Page): Promise<boolean> {
    try {
      const el = await page.$('input[id*="otp"], input[placeholder*="קוד"], input[placeholder*="SMS"]');
      return !!el;
    } catch {
      return false;
    }
  }

  async fillOtp(page: Page, otp: string) {
    const sel = await page.$('input[id*="otp"], input[placeholder*="קוד"], input[placeholder*="SMS"]');
    if (sel) {
      await sel.click({ clickCount: 3 });
      await sel.type(otp);
    }
  }

  async clickConfirm(page: Page) {
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button, input[type=submit], a"));
      const confirmBtn = buttons.find((b) =>
        /אשר|אישור|confirm|שלח|בצע/i.test(b.textContent ?? "")
      ) as HTMLElement | undefined;
      if (confirmBtn) confirmBtn.click();
    });
  }

  async detectSuccess(page: Page): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 3000));
    const bodyText: string = await page.evaluate(() => document.body?.innerText ?? "");
    return /ההעברה בוצעה|בוצע בהצלחה|success/i.test(bodyText);
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────
function getExecutor(bankName: string): BankExecutor {
  const lower = bankName.toLowerCase();
  if (lower.includes("הפועלים") || lower.includes("hapoalim") || lower.includes("poalim")) {
    return new HapoalimExecutor();
  }
  if (lower.includes("לאומי") || lower.includes("leumi")) {
    return new LeumiExecutor();
  }
  throw new Error(
    `בנק "${bankName}" טרם נתמך לביצוע אוטומטי. בצע את ההעברה ידנית ולחץ "בוצע ידנית".`
  );
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function startTransferExecution(
  transfer: TransferData,
  credentials: Record<string, string>,
  bankName: string,
  orgId: string
): Promise<StartResult> {
  const executor = getExecutor(bankName);
  const { browser, page } = await launchBrowser();

  try {
    // Step 1: Login
    await executor.login(page, credentials);

    // Step 2: Navigate to transfer form
    await executor.navigateToTransferForm(page, transfer);

    // Step 3: Fill in transfer details
    await executor.fillTransferForm(page, transfer);

    // Wait for page to settle
    await new Promise((r) => setTimeout(r, 2000));

    // Step 4: Check if OTP is needed
    const needsOtp = await executor.needsOtp(page);

    // Step 5: Screenshot of current state
    const img = await screenshot(page);

    // Step 6: Store session
    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, {
      browser,
      page,
      transferId: transfer.id,
      orgId,
      bankName,
      expiresAt: new Date(Date.now() + 5 * 60_000), // 5 minutes
    });

    return {
      sessionId,
      screenshot: img,
      step: needsOtp ? "otp" : "confirm",
      message: needsOtp
        ? "נדרש קוד OTP — הכנס את הקוד שקיבלת בSMS ולחץ אישור"
        : "הבנק מוכן לאישורך — לחץ 'אשר העברה' להשלמה",
    };
  } catch (err) {
    await browser.close().catch(() => {});
    throw err;
  }
}

export async function confirmTransfer(
  sessionId: string,
  otp?: string
): Promise<ConfirmResult> {
  const session = sessions.get(sessionId);
  if (!session) {
    return { success: false, message: "הסשן פג תוקף — אנא נסה שוב" };
  }

  const executor = getExecutor(session.bankName);

  try {
    // Fill OTP if provided
    if (otp) {
      await executor.fillOtp(session.page, otp);
      await new Promise((r) => setTimeout(r, 500));
    }

    // Click confirm
    await executor.clickConfirm(session.page);

    // Wait for result
    await new Promise((r) => setTimeout(r, 4000));

    // Detect success
    const success = await executor.detectSuccess(session.page);
    const img = await screenshot(session.page);

    await cleanupSession(sessionId);

    return {
      success,
      screenshot: img,
      message: success
        ? "ההעברה בוצעה בהצלחה בבנק!"
        : "לא הצלחנו לאמת הצלחה — בדוק בבנק שהעברה אכן בוצעה",
    };
  } catch (err) {
    await cleanupSession(sessionId);
    return {
      success: false,
      message: `שגיאה בביצוע: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
