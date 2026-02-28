/**
 * Bank Transfer Executor — Puppeteer-based screenshot relay.
 *
 * Real flow for Bank Hapoalim (from live site analysis):
 *
 *   1. POST /execute → login → select account → navigate to transfer → fill form
 *      → click "המשך" → screenshot CONFIRMATION page → return {sessionId, screenshot, step:"confirm"}
 *
 *   2. PUT /execute {action:"confirm"} → click "אישור העברה" on confirmation page
 *      → OTP SMS dialog appears → screenshot → return {screenshot, step:"otp"}
 *
 *   3. PUT /execute {action:"otp", code:"123456"} → fill OTP → click "להמשך"
 *      → screenshot success page → return {screenshot, step:"success"}
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

export type StepResult = {
  success: boolean;
  screenshot?: string; // base64 PNG
  step: "confirm" | "otp" | "success" | "error";
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

  return { browser, page };
}

// ── Take a screenshot ─────────────────────────────────────────────────────────
async function screenshot(page: Page): Promise<string> {
  const buf = await page.screenshot({ type: "png", fullPage: false });
  return Buffer.from(buf).toString("base64");
}

// ── Helper: wait & retry for a selector ───────────────────────────────────────
async function waitForAny(page: Page, selectors: string[], timeout = 15_000): Promise<string | null> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    for (const sel of selectors) {
      try {
        const el = await page.$(sel);
        if (el) return sel;
      } catch { /* continue */ }
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

// ── Per-bank executor interfaces ──────────────────────────────────────────────
interface BankExecutor {
  /** Step 1: Login to the bank website */
  login(page: Page, credentials: Record<string, string>): Promise<void>;
  /** Step 2: Select source account if multiple accounts exist */
  selectAccount(page: Page, accountNumber: string | null): Promise<void>;
  /** Step 3: Navigate to transfer form */
  navigateToTransferForm(page: Page): Promise<void>;
  /** Step 4: Fill form fields and submit to get to confirmation page */
  fillAndSubmitForm(page: Page, transfer: TransferData): Promise<void>;
  /** Step 5: On confirmation page, click the confirm button (triggers OTP) */
  clickConfirmTransfer(page: Page): Promise<void>;
  /** Step 6: Check if OTP dialog appeared */
  hasOtpDialog(page: Page): Promise<boolean>;
  /** Step 7: Fill OTP code and submit */
  fillOtpAndSubmit(page: Page, otp: string): Promise<void>;
  /** Step 8: Detect if transfer was successful */
  detectSuccess(page: Page): Promise<boolean>;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Bank Hapoalim (בנק הפועלים) ─────────────────────────────────────────────
// Based on real site flow documented from login.bankhapoalim.co.il
//
// Login page: login.bankhapoalim.co.il/ng-portals/auth/he/
//   Fields: "קוד משתמש" (userCode), "סיסמה" (password)
//   Button: "כניסה" (red button)
//
// After login: account selector dropdown (e.g. 655-193393, 655-379039)
//
// Transfer page: login.bankhapoalim.co.il/ng-portals/rb/he/current-account/transfer
//   3-step wizard: 1.פרטי העברה  2.אישור  3.סיום
//   Form fields: למי (לאחר/בין חשבונותיי), שם בעל החשבון, בנק, סניף, מס' חשבון, סכום, תאריך, סיבה
//
// Confirmation page (Step 2):
//   Shows summary: amount, from/to accounts, date
//   Button: "אישור העברה" → triggers SMS OTP
//
// OTP dialog:
//   Title: "היקן הוראה"
//   Text: "שלחנו לך קוד אימות ב-SMS למספר 054-******8"
//   Input: "מה הקוד שקיבלת?"
//   Button: "להמשך" (red)
//   Fallback: phone call option
//
// Success (Step 3): "סיום"
// ══════════════════════════════════════════════════════════════════════════════
class HapoalimExecutor implements BankExecutor {
  private readonly LOGIN_URL = "https://login.bankhapoalim.co.il/ng-portals/auth/he/";
  private readonly TRANSFER_URL = "https://login.bankhapoalim.co.il/ng-portals/rb/he/current-account/transfer";

  async login(page: Page, credentials: Record<string, string>) {
    console.log("[hapoalim] Navigating to login page...");
    await page.goto(this.LOGIN_URL, { waitUntil: "networkidle2", timeout: 60_000 });

    // Wait for login form — "קוד משתמש" and "סיסמה" fields
    const userCodeSelectors = [
      'input[formcontrolname="userCode"]',
      'input[name="userCode"]',
      'input[id="userCode"]',
      'input[placeholder*="קוד משתמש"]',
      'input[type="text"]',
    ];
    const userCodeSel = await waitForAny(page, userCodeSelectors, 20_000);
    if (!userCodeSel) throw new Error("לא נמצא שדה קוד משתמש בדף ההתחברות");

    console.log("[hapoalim] Filling login credentials...");
    const userCode = credentials.userCode ?? credentials.username ?? "";
    const password = credentials.password ?? "";

    // Clear and type user code
    await page.click(userCodeSel);
    await page.evaluate((sel: string) => {
      const el = document.querySelector(sel) as HTMLInputElement;
      if (el) el.value = "";
    }, userCodeSel);
    await page.type(userCodeSel, userCode, { delay: 50 });

    // Find and fill password field
    const passwordSelectors = [
      'input[formcontrolname="password"]',
      'input[name="password"]',
      'input[id="password"]',
      'input[type="password"]',
    ];
    const passwordSel = await waitForAny(page, passwordSelectors, 5_000);
    if (!passwordSel) throw new Error("לא נמצא שדה סיסמה בדף ההתחברות");

    await page.click(passwordSel);
    await page.type(passwordSel, password, { delay: 50 });

    // Click the "כניסה" (login) button — red button
    const loginBtnSelectors = [
      'button[type="submit"]',
      'button.login-btn',
      'button[class*="login"]',
      'button[class*="submit"]',
    ];
    const loginBtn = await waitForAny(page, loginBtnSelectors, 5_000);
    if (loginBtn) {
      await page.click(loginBtn);
    } else {
      // Fallback: find button with "כניסה" text
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button, input[type=submit]"));
        const btn = buttons.find((b) => /כניסה/i.test(b.textContent ?? "")) as HTMLElement | undefined;
        if (btn) btn.click();
      });
    }

    console.log("[hapoalim] Waiting for login to complete...");
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60_000 }).catch(() => {
      // Some SPAs don't trigger a full navigation
    });
    // Extra wait for SPA to settle
    await new Promise((r) => setTimeout(r, 3000));

    // Verify we're logged in
    const pageContent: string = await page.evaluate(() => document.body?.innerText ?? "");
    if (pageContent.includes("קוד משתמש") && pageContent.includes("סיסמה") && !pageContent.includes("שלום")) {
      throw new Error("ההתחברות נכשלה — בדוק קוד משתמש וסיסמה");
    }
    console.log("[hapoalim] Login successful");
  }

  async selectAccount(page: Page, accountNumber: string | null) {
    if (!accountNumber) return;

    // After login, bank may show account selector (e.g. "655-193393", "655-379039")
    console.log(`[hapoalim] Looking for account selector (${accountNumber})...`);

    try {
      await new Promise((r) => setTimeout(r, 2000));

      const hasSelector = await page.evaluate((acct: string) => {
        const elements = Array.from(document.querySelectorAll("button, a, div[role='option'], li, span"));
        const match = elements.find((el) => (el.textContent ?? "").includes(acct));
        if (match) {
          (match as HTMLElement).click();
          return true;
        }
        return false;
      }, accountNumber);

      if (hasSelector) {
        console.log(`[hapoalim] Selected account ${accountNumber}`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch {
      console.log("[hapoalim] No account selector found, continuing...");
    }
  }

  async navigateToTransferForm(page: Page) {
    console.log("[hapoalim] Navigating to transfer form...");

    // Direct navigation to transfer page
    await page.goto(this.TRANSFER_URL, { waitUntil: "networkidle2", timeout: 30_000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 3000));

    // Verify we're on the transfer page
    const isTransferPage = await page.evaluate(() => {
      const text = document.body?.innerText ?? "";
      return text.includes("העברה רגילה") || text.includes("פרטי העברה") || text.includes("למי") || text.includes("כמה");
    });

    if (!isTransferPage) {
      // Try clicking "העברת כסף" from the menu
      console.log("[hapoalim] Direct URL didn't work, trying menu navigation...");
      await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll("a, button, div[role='button']"));
        const transferLink = links.find((el) =>
          /העברת כסף|העברה רגילה/i.test(el.textContent ?? "")
        ) as HTMLElement | undefined;
        if (transferLink) transferLink.click();
      });
      await new Promise((r) => setTimeout(r, 3000));
    }

    console.log("[hapoalim] On transfer form page");
  }

  async fillAndSubmitForm(page: Page, transfer: TransferData) {
    console.log("[hapoalim] Filling transfer form...");

    // Ensure "לאחר" (to another person) tab is selected
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll("button, a, div[role='tab'], label, span"));
      const toOtherTab = tabs.find((el) => /לאחר/i.test(el.textContent ?? "")) as HTMLElement | undefined;
      if (toOtherTab) toOtherTab.click();
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Fill recipient name (שם בעל החשבון)
    if (transfer.toExternalName) {
      const nameSelectors = [
        'input[formcontrolname*="name"]',
        'input[name*="beneficiary"]',
        'input[name*="name"]',
        'input[placeholder*="שם"]',
        'input[aria-label*="שם"]',
      ];
      const nameSel = await waitForAny(page, nameSelectors, 5_000);
      if (nameSel) {
        await page.click(nameSel);
        await page.type(nameSel, transfer.toExternalName, { delay: 30 });
      } else {
        await page.evaluate((name: string) => {
          const labels = Array.from(document.querySelectorAll("label"));
          const label = labels.find((l) => /שם בעל החשבון|שם המוטב/i.test(l.textContent ?? ""));
          if (label) {
            const input = label.querySelector("input") ?? document.getElementById(label.getAttribute("for") ?? "");
            if (input) { (input as HTMLInputElement).focus(); (input as HTMLInputElement).value = name; input.dispatchEvent(new Event("input", { bubbles: true })); }
          }
        }, transfer.toExternalName);
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    // Fill bank code (בנק) — usually a dropdown
    if (transfer.toExternalBankCode) {
      console.log(`[hapoalim] Filling bank code: ${transfer.toExternalBankCode}`);
      const bankSelectors = [
        'select[formcontrolname*="bank"]',
        'select[name*="bank"]',
        'input[formcontrolname*="bank"]',
        'input[name*="bank"]',
        'input[placeholder*="בנק"]',
        'input[aria-label*="בנק"]',
      ];
      const bankSel = await waitForAny(page, bankSelectors, 5_000);
      if (bankSel) {
        const tagName = await page.evaluate((sel: string) => document.querySelector(sel)?.tagName, bankSel);
        if (tagName === "SELECT") {
          await page.select(bankSel, transfer.toExternalBankCode);
        } else {
          await page.click(bankSel);
          await page.type(bankSel, transfer.toExternalBankCode, { delay: 30 });
        }
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    // Fill branch number (סניף)
    if (transfer.toExternalBranchNumber) {
      console.log(`[hapoalim] Filling branch: ${transfer.toExternalBranchNumber}`);
      const branchSelectors = [
        'input[formcontrolname*="branch"]',
        'input[name*="branch"]',
        'input[placeholder*="סניף"]',
        'input[aria-label*="סניף"]',
      ];
      const branchSel = await waitForAny(page, branchSelectors, 5_000);
      if (branchSel) {
        await page.click(branchSel);
        await page.type(branchSel, transfer.toExternalBranchNumber, { delay: 30 });
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    // Fill account number (מס' חשבון) — digits only
    if (transfer.toExternalAccount) {
      console.log(`[hapoalim] Filling account number: ${transfer.toExternalAccount}`);
      const accountSelectors = [
        'input[formcontrolname*="account"]',
        'input[name*="account"]',
        'input[placeholder*="חשבון"]',
        'input[aria-label*="חשבון"]',
      ];
      const accountSel = await waitForAny(page, accountSelectors, 5_000);
      if (accountSel) {
        await page.click(accountSel);
        await page.type(accountSel, transfer.toExternalAccount, { delay: 30 });
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    // Fill amount (כמה?)
    console.log(`[hapoalim] Filling amount: ${transfer.amount}`);
    const amountSelectors = [
      'input[formcontrolname*="amount"]',
      'input[formcontrolname*="sum"]',
      'input[name*="amount"]',
      'input[name*="sum"]',
      'input[placeholder*="סכום"]',
      'input[aria-label*="סכום"]',
      'input[type="number"]',
    ];
    const amountSel = await waitForAny(page, amountSelectors, 5_000);
    if (amountSel) {
      await page.click(amountSel);
      await page.evaluate((sel: string) => {
        const el = document.querySelector(sel) as HTMLInputElement;
        if (el) { el.value = ""; el.dispatchEvent(new Event("input", { bubbles: true })); }
      }, amountSel);
      await page.type(amountSel, transfer.amount.toString(), { delay: 30 });
    }
    await new Promise((r) => setTimeout(r, 500));

    // Fill reason (סיבה להעברה) — optional
    if (transfer.purpose || transfer.description) {
      const reasonText = transfer.purpose || transfer.description || "";
      const reasonSelectors = [
        'input[formcontrolname*="reason"]',
        'input[formcontrolname*="remark"]',
        'input[name*="reason"]',
        'textarea[formcontrolname*="reason"]',
        'input[placeholder*="סיבה"]',
        'textarea[placeholder*="סיבה"]',
      ];
      const reasonSel = await waitForAny(page, reasonSelectors, 3_000);
      if (reasonSel) {
        await page.click(reasonSel);
        await page.type(reasonSel, reasonText, { delay: 30 });
      }
    }

    await new Promise((r) => setTimeout(r, 1000));

    // Click "המשך" / submit to go to confirmation page (Step 2 of wizard)
    console.log("[hapoalim] Submitting form to confirmation...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button, a, input[type=submit]"));
      const nextBtn = buttons.find((b) =>
        /המשך|הבא|לשלב הבא|העבר/i.test(b.textContent ?? "")
      ) as HTMLElement | undefined;
      if (nextBtn) nextBtn.click();
    });

    // Wait for confirmation page
    await new Promise((r) => setTimeout(r, 3000));
    console.log("[hapoalim] Should be on confirmation page now");
  }

  async clickConfirmTransfer(page: Page) {
    // Step 2 confirmation page — click "אישור העברה" → triggers OTP SMS
    console.log("[hapoalim] Clicking 'אישור העברה'...");

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button, a, input[type=submit]"));
      const confirmBtn = buttons.find((b) =>
        /אישור העברה|אישור|אשר|בצע העברה/i.test(b.textContent ?? "")
      ) as HTMLElement | undefined;
      if (confirmBtn) confirmBtn.click();
    });

    // Wait for OTP dialog
    await new Promise((r) => setTimeout(r, 3000));
    console.log("[hapoalim] Confirm clicked, checking for OTP...");
  }

  async hasOtpDialog(page: Page): Promise<boolean> {
    // The OTP dialog contains: "שלחנו לך קוד אימות ב-SMS", "מה הקוד שקיבלת?"
    try {
      return await page.evaluate(() => {
        const text = document.body?.innerText ?? "";
        return (
          text.includes("קוד אימות") ||
          text.includes("שלחנו לך קוד") ||
          text.includes("מה הקוד שקיבלת") ||
          text.includes("מתקשרים אליך") ||
          text.includes("היקן הוראה") ||
          text.includes("SMS")
        );
      });
    } catch {
      return false;
    }
  }

  async fillOtpAndSubmit(page: Page, otp: string) {
    console.log("[hapoalim] Filling OTP code...");

    // OTP input in the modal dialog
    const otpSelectors = [
      'input[formcontrolname*="otp"]',
      'input[formcontrolname*="code"]',
      'input[formcontrolname*="sms"]',
      'input[name*="otp"]',
      'input[name*="code"]',
      'input[placeholder*="קוד"]',
      'input[aria-label*="קוד"]',
      'input[type="tel"]',
      'div[class*="modal"] input[type="text"]',
      'div[class*="dialog"] input[type="text"]',
      'div[class*="modal"] input[type="number"]',
      'div[class*="dialog"] input[type="number"]',
    ];

    const otpSel = await waitForAny(page, otpSelectors, 10_000);
    if (otpSel) {
      await page.click(otpSel);
      await page.evaluate((sel: string) => {
        const el = document.querySelector(sel) as HTMLInputElement;
        if (el) { el.value = ""; el.dispatchEvent(new Event("input", { bubbles: true })); }
      }, otpSel);
      await page.type(otpSel, otp, { delay: 50 });
    } else {
      // Fallback: find any visible input in dialog
      await page.evaluate((code: string) => {
        const inputs = Array.from(document.querySelectorAll("input:not([type=hidden])"));
        const visibleInput = inputs.find((inp) => {
          const rect = inp.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }) as HTMLInputElement | undefined;
        if (visibleInput) {
          visibleInput.focus();
          visibleInput.value = code;
          visibleInput.dispatchEvent(new Event("input", { bubbles: true }));
          visibleInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, otp);
    }

    await new Promise((r) => setTimeout(r, 500));

    // Click "להמשך" (Continue) — red button in OTP dialog
    console.log("[hapoalim] Clicking OTP submit...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button, a, input[type=submit]"));
      const submitBtn = buttons.find((b) =>
        /להמשך|המשך|אישור|אשר|שלח/i.test(b.textContent ?? "")
      ) as HTMLElement | undefined;
      if (submitBtn) submitBtn.click();
    });

    // Wait for result
    await new Promise((r) => setTimeout(r, 5000));
    console.log("[hapoalim] OTP submitted");
  }

  async detectSuccess(page: Page): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 3000));
    return await page.evaluate(() => {
      const text = document.body?.innerText ?? "";
      const url = window.location.href;
      // Step 3 "סיום" (Done) of the wizard
      return (
        text.includes("בוצעה בהצלחה") ||
        text.includes("ההעברה בוצעה") ||
        text.includes("הפעולה בוצעה") ||
        text.includes("העברה בוצעה") ||
        // Step 3 indicator
        (text.includes("סיום") && !text.includes("פרטי העברה")) ||
        url.includes("success") ||
        url.includes("receipt") ||
        url.includes("done")
      );
    });
  }
}

// ── Leumi (placeholder — needs real site analysis) ───────────────────────────
class LeumiExecutor implements BankExecutor {
  async login(_page: Page, _credentials: Record<string, string>) {
    throw new Error("בנק לאומי טרם נתמך לביצוע אוטומטי — בצע את ההעברה ידנית.");
  }
  async selectAccount() { /* noop */ }
  async navigateToTransferForm() { /* noop */ }
  async fillAndSubmitForm() { /* noop */ }
  async clickConfirmTransfer() { /* noop */ }
  async hasOtpDialog() { return false; }
  async fillOtpAndSubmit() { /* noop */ }
  async detectSuccess() { return false; }
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

// ══════════════════════════════════════════════════════════════════════════════
// ── Public API ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Step 1: Start transfer execution
 * Login → select account → navigate to transfer → fill form → screenshot confirmation
 */
export async function startTransferExecution(
  transfer: TransferData,
  credentials: Record<string, string>,
  bankName: string,
  orgId: string
): Promise<StartResult> {
  const executor = getExecutor(bankName);
  const { browser, page } = await launchBrowser();

  try {
    await executor.login(page, credentials);
    await executor.selectAccount(page, transfer.fromAccountNumber);
    await executor.navigateToTransferForm(page);
    await executor.fillAndSubmitForm(page, transfer);

    const img = await screenshot(page);

    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, {
      browser,
      page,
      transferId: transfer.id,
      orgId,
      bankName,
      expiresAt: new Date(Date.now() + 5 * 60_000),
    });

    return {
      sessionId,
      screenshot: img,
      step: "confirm",
      message: "הבנק מציג את פרטי ההעברה לאישורך. בדוק שהפרטים נכונים ולחץ 'אשר העברה'.",
    };
  } catch (err) {
    await browser.close().catch(() => {});
    throw err;
  }
}

/**
 * Step 2: Confirm transfer (click bank's confirm button → triggers OTP)
 */
export async function confirmTransferStep(sessionId: string): Promise<StepResult> {
  const session = sessions.get(sessionId);
  if (!session) {
    return { success: false, step: "error", message: "הסשן פג תוקף — אנא נסה שוב" };
  }

  const executor = getExecutor(session.bankName);

  try {
    await executor.clickConfirmTransfer(session.page);

    const hasOtp = await executor.hasOtpDialog(session.page);
    const img = await screenshot(session.page);

    if (hasOtp) {
      session.expiresAt = new Date(Date.now() + 5 * 60_000);
      return {
        success: true,
        screenshot: img,
        step: "otp",
        message: "הבנק שלח קוד אימות ב-SMS לנייד שלך. הכנס את הקוד ולחץ 'שלח'.",
      };
    }

    const success = await executor.detectSuccess(session.page);
    if (success) {
      await cleanupSession(sessionId);
      return {
        success: true,
        screenshot: img,
        step: "success",
        message: "ההעברה בוצעה בהצלחה בבנק!",
      };
    }

    return {
      success: false,
      screenshot: img,
      step: "error",
      message: "לא ניתן לזהות את מצב ההעברה — בדוק את צילום המסך",
    };
  } catch (err) {
    const img = await screenshot(session.page).catch(() => "");
    await cleanupSession(sessionId);
    return {
      success: false,
      screenshot: img || undefined,
      step: "error",
      message: `שגיאה באישור: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Step 3: Submit OTP code → complete transfer
 */
export async function submitOtp(sessionId: string, otp: string): Promise<StepResult> {
  const session = sessions.get(sessionId);
  if (!session) {
    return { success: false, step: "error", message: "הסשן פג תוקף — אנא נסה שוב" };
  }

  const executor = getExecutor(session.bankName);

  try {
    await executor.fillOtpAndSubmit(session.page, otp);

    const success = await executor.detectSuccess(session.page);
    const img = await screenshot(session.page);

    await cleanupSession(sessionId);

    return {
      success,
      screenshot: img,
      step: success ? "success" : "error",
      message: success
        ? "ההעברה בוצעה בהצלחה בבנק!"
        : "לא הצלחנו לאמת הצלחה — בדוק בחשבון הבנק שההעברה אכן בוצעה",
    };
  } catch (err) {
    const img = await screenshot(session.page).catch(() => "");
    await cleanupSession(sessionId);
    return {
      success: false,
      screenshot: img || undefined,
      step: "error",
      message: `שגיאה בשליחת OTP: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Legacy 2-step API — kept for backwards compatibility
 */
export async function confirmTransfer(
  sessionId: string,
  otp?: string
): Promise<ConfirmResult> {
  if (otp) {
    const result = await submitOtp(sessionId, otp);
    return { success: result.success, screenshot: result.screenshot, message: result.message };
  }
  const result = await confirmTransferStep(sessionId);
  return { success: result.success, screenshot: result.screenshot, message: result.message };
}
