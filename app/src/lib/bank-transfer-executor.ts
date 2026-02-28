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

// ── Realistic User-Agent (Chrome 131 on Windows 10) ─────────────────────────
const REAL_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// ── Launch Puppeteer with stealth anti-detection ────────────────────────────
async function launchBrowser(): Promise<{ browser: Browser; page: Page }> {
  const [chromiumModule, puppeteerExtraModule, stealthModule] = await Promise.all([
    import("@sparticuz/chromium"),
    import("puppeteer-extra"),
    import("puppeteer-extra-plugin-stealth"),
  ]);
  const chromium = chromiumModule.default;
  const puppeteer = puppeteerExtraModule.default;
  const StealthPlugin = stealthModule.default;

  // Apply stealth plugin (hides webdriver, chrome.runtime, plugins, etc.)
  puppeteer.use(StealthPlugin());

  const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    args: [
      ...chromium.args,
      "--no-sandbox",
      "--disable-setuid-sandbox",
      // Anti-detection flags
      "--disable-blink-features=AutomationControlled",
      "--disable-features=IsolateOrigins,site-per-process",
      // Hebrew font rendering on Linux
      "--lang=he-IL",
      "--font-render-hinting=none",
    ],
    headless: true,
    defaultViewport: { width: 1280, height: 900 },
    timeout: 60_000,
  });

  const page = await browser.newPage();

  // Set realistic user-agent (removes "HeadlessChrome" marker)
  await page.setUserAgent(REAL_USER_AGENT);

  // Set Hebrew locale headers
  await page.setExtraHTTPHeaders({
    "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
  });

  // Override navigator.webdriver = false (belt & suspenders with stealth)
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    // Remove chrome.runtime to avoid detection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (w.chrome) {
      w.chrome.runtime = undefined;
    }
    // Override permissions query
    const origQuery = window.navigator.permissions.query.bind(window.navigator.permissions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.navigator.permissions.query = (params: any) => {
      if (params.name === "notifications") {
        return Promise.resolve({ state: "denied", onchange: null } as PermissionStatus);
      }
      return origQuery(params);
    };
    // Set plugins length > 0 (real browsers have plugins)
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });
    // Set languages
    Object.defineProperty(navigator, "languages", {
      get: () => ["he-IL", "he", "en-US", "en"],
    });
  });

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
//
// VERIFIED TECHNICAL DETAILS (Angular 19.2.14, Kite design system):
//
// Login page: login.bankhapoalim.co.il/ng-portals/auth/he/
//   Root component: <auth-root> → <auth-rb-login>
//   #userCode  (formcontrolname="userCode", type="text", class="form-control user-code-ctrl")
//   #password  (formcontrolname="password", type="text"(!), class="password-astrix")
//   .login-btn (button.red-coloring-btn type="submit")
//
// Post-login success URLs:
//   /portalserver/HomePage
//   /ng-portals-bt/rb/he/homepage
//   /ng-portals/rb/he/homepage
//
// Account selector: Angular component (poalim-accounts-select)
//   API: GET /ServerServices/general/accounts
//   Format: {bankNumber}-{branchNumber}-{accountNumber} e.g. "12-655-193393"
//   Display format in dropdown: "655-193393"
//
// Transfer page: login.bankhapoalim.co.il/ng-portals/rb/he/current-account/transfer
//   3-step wizard: 1.פרטי העברה  2.אישור  3.סיום
//   Uses poalim-mm-field Angular components with formcontrolname attributes
//   Submit buttons use class: red-coloring-btn
//
// OTP dialog:
//   SMS sent to registered phone
//   enableWebOtp: false, enableWhatsappOtp: false
//   Input: formcontrolname="otpCode" or #otpCode
//   Submit: button.red-coloring-btn
//
// Security: Imperva Incapsula + Dynatrace + XSRF token + Clarisite + Arcot
// Session timeout: 15 minutes (bnhpApp.keys.defaultSessionTimeout)
// ══════════════════════════════════════════════════════════════════════════════
class HapoalimExecutor implements BankExecutor {
  private readonly LOGIN_URL = "https://login.bankhapoalim.co.il/ng-portals/auth/he/";
  private readonly TRANSFER_URL = "https://login.bankhapoalim.co.il/ng-portals/rb/he/current-account/transfer";

  // ── Helper: set value on Angular reactive form input ─────────────────────
  // Angular inputs won't update the model if you just set .value.
  // We need to dispatch the right events so Angular picks up the change.
  private async angularType(page: Page, selector: string, value: string) {
    await page.evaluate((sel: string) => {
      const el = document.querySelector(sel) as HTMLInputElement;
      if (el) {
        el.focus();
        el.value = "";
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }, selector);
    await page.type(selector, value, { delay: 40 });
    // Trigger Angular change detection
    await page.evaluate((sel: string) => {
      const el = document.querySelector(sel) as HTMLInputElement;
      if (el) {
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.dispatchEvent(new Event("blur", { bubbles: true }));
      }
    }, selector);
  }

  // ── Helper: wait for Angular to stabilize ────────────────────────────────
  private async waitForAngular(page: Page, maxMs = 5000) {
    await page.evaluate((timeout: number) => {
      return new Promise<void>((resolve) => {
        const deadline = Date.now() + timeout;
        const check = () => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const testabilities = (window as any).getAllAngularTestabilities?.();
            if (testabilities?.[0]?.isStable()) { resolve(); return; }
          } catch { /* not Angular or not ready */ }
          if (Date.now() > deadline) { resolve(); return; }
          setTimeout(check, 200);
        };
        check();
      });
    }, maxMs);
  }

  // ── Helper: dump all form inputs for debugging ───────────────────────────
  private async dumpFormInputs(page: Page) {
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("input, select, textarea")).map((el) => ({
        tag: el.tagName,
        id: el.id,
        fcn: el.getAttribute("formcontrolname"),
        name: el.getAttribute("name"),
        type: (el as HTMLInputElement).type,
        placeholder: (el as HTMLInputElement).placeholder,
        cls: el.className.substring(0, 60),
        visible: el.getBoundingClientRect().height > 0,
      }));
    });
    console.log("[hapoalim] Form inputs on page:", JSON.stringify(inputs, null, 2));
    return inputs;
  }

  async login(page: Page, credentials: Record<string, string>) {
    console.log("[hapoalim] Navigating to login page...");
    await page.goto(this.LOGIN_URL, { waitUntil: "networkidle2", timeout: 60_000 });

    // VERIFIED: Angular app with #userCode and #password
    await page.waitForSelector("#userCode", { visible: true, timeout: 20_000 });
    console.log("[hapoalim] Login form loaded");

    const userCode = credentials.userCode ?? credentials.username ?? "";
    const password = credentials.password ?? "";

    // Clear and type user code (VERIFIED: formcontrolname="userCode", id="userCode")
    await this.angularType(page, "#userCode", userCode);

    // Type password (VERIFIED: formcontrolname="password", id="password")
    // NOTE: password field is type="text" with CSS class "password-astrix" for masking
    await page.waitForSelector("#password", { visible: true, timeout: 5_000 });
    await this.angularType(page, "#password", password);

    // Click login (VERIFIED: button.login-btn.red-coloring-btn type="submit")
    console.log("[hapoalim] Clicking login button...");
    await page.click(".login-btn");

    // Wait for redirect — bank redirects to homepage on success
    console.log("[hapoalim] Waiting for login redirect...");
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60_000 }).catch(() => {});
    await this.waitForAngular(page);
    await new Promise((r) => setTimeout(r, 2000));

    // Check for login failure (redirected back to auth page)
    const currentUrl: string = await page.url();
    if (currentUrl.includes("/auth/") && currentUrl.includes("errorcode")) {
      throw new Error("ההתחברות נכשלה — קוד משתמש או סיסמה שגויים");
    }
    if (currentUrl.includes("AUTHENTICATE/LOGON")) {
      throw new Error("ההתחברות נכשלה — בדוק קוד משתמש וסיסמה");
    }

    // Verify we reached homepage
    const onHomepage = currentUrl.includes("homepage") || currentUrl.includes("HomePage");
    if (!onHomepage) {
      // Could be change-password or other intermediate page
      const bodyText: string = await page.evaluate(() => document.body?.innerText ?? "");
      if (bodyText.includes("שינוי סיסמה") || bodyText.includes("סיסמה חדשה")) {
        throw new Error("הבנק דורש שינוי סיסמה — היכנס לאתר הבנק ישירות כדי לשנות");
      }
    }
    console.log("[hapoalim] Login successful, URL:", currentUrl);
  }

  async selectAccount(page: Page, accountNumber: string | null) {
    if (!accountNumber) return;

    // The account selector is on the transfer page (after navigation)
    // Format in our DB could be "193393" or "655-193393"
    // The bank displays accounts as "655-193393" in the dropdown
    console.log(`[hapoalim] Selecting account ${accountNumber}...`);

    try {
      await new Promise((r) => setTimeout(r, 2000));

      // First, check what account is currently selected and dump info
      const currentAccount = await page.evaluate(() => {
        // Look for the account selector component
        const selectors = [
          "poalim-accounts-select",
          ".accounts-select",
          '[class*="account-select"]',
          '[class*="account-switch"]',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) return { found: true, text: (el.textContent ?? "").trim(), selector: sel };
        }
        // Fallback: find any element showing account pattern XXX-XXXXXX
        const all = Array.from(document.querySelectorAll("*"));
        for (const el of all) {
          if (el.children.length > 3) continue; // Only leaf-ish elements
          const text = (el.textContent ?? "").trim();
          if (/^\d{3}-\d{4,6}$/.test(text)) {
            return { found: true, text, selector: "pattern-match" };
          }
        }
        return { found: false, text: "", selector: "" };
      });

      console.log(`[hapoalim] Current account display: ${JSON.stringify(currentAccount)}`);

      // Check if already on correct account
      if (currentAccount.found && currentAccount.text.includes(accountNumber)) {
        console.log(`[hapoalim] Already on correct account ${accountNumber}`);
        return;
      }

      // Step 1: Click the account selector to open dropdown
      console.log("[hapoalim] Opening account dropdown...");
      const opened = await page.evaluate(() => {
        // Try Angular component first
        const component = document.querySelector("poalim-accounts-select, .accounts-select, [class*='account-select']");
        if (component) {
          // Look for the clickable trigger inside
          const trigger = component.querySelector("button, [role='combobox'], [role='button'], .dropdown-toggle, [class*='trigger']")
            ?? component;
          (trigger as HTMLElement).click();
          return true;
        }
        // Try finding any element with account number pattern
        const elements = Array.from(document.querySelectorAll("button, div[role='button'], [role='combobox'], a"));
        const acctEl = elements.find((el) => /\d{3}-\d{4,6}/.test(el.textContent ?? ""));
        if (acctEl) {
          (acctEl as HTMLElement).click();
          return true;
        }
        // Try "בחר חשבון" text
        const allEls = Array.from(document.querySelectorAll("button, a, span, div"));
        const chooser = allEls.find((el) => {
          const t = (el.textContent ?? "").trim();
          return (t === "בחר חשבון" || t === "חיפוש חשבון") && el.getBoundingClientRect().width > 0;
        });
        if (chooser) { (chooser as HTMLElement).click(); return true; }
        return false;
      });

      if (!opened) {
        console.warn("[hapoalim] Could not find account selector");
        return;
      }

      // Wait for dropdown options to render
      await new Promise((r) => setTimeout(r, 1500));
      await this.waitForAngular(page);

      // Step 2: Click the target account
      console.log(`[hapoalim] Clicking target account ${accountNumber}...`);
      const clicked = await page.evaluate((acct: string) => {
        // Look for dropdown options containing our account number
        const candidates = Array.from(document.querySelectorAll(
          'li, [role="option"], [class*="option"], [class*="account-item"], a, button, div'
        ));
        for (const el of candidates) {
          const text = (el.textContent ?? "").trim();
          const rect = el.getBoundingClientRect();
          // Must contain our account number, be visible, and be reasonably sized (not the whole page)
          if (text.includes(acct) && rect.width > 50 && rect.height > 10 && rect.height < 80) {
            (el as HTMLElement).click();
            return { clicked: true, text };
          }
        }
        return { clicked: false, text: "" };
      }, accountNumber);

      if (clicked.clicked) {
        console.log(`[hapoalim] Clicked account: "${clicked.text}"`);
        // Wait for page to reload with new account data
        await new Promise((r) => setTimeout(r, 3000));
        await this.waitForAngular(page);
      } else {
        console.warn(`[hapoalim] Account ${accountNumber} not found in dropdown`);
      }
    } catch (err) {
      console.warn("[hapoalim] Account selection error:", err);
    }
  }

  async navigateToTransferForm(page: Page) {
    console.log("[hapoalim] Navigating to transfer page...");

    // Direct navigation to transfer page
    await page.goto(this.TRANSFER_URL, { waitUntil: "networkidle2", timeout: 30_000 }).catch(() => {});
    await this.waitForAngular(page);
    await new Promise((r) => setTimeout(r, 2000));

    // Verify we're on the transfer page
    const isTransferPage = await page.evaluate(() => {
      const text = document.body?.innerText ?? "";
      return (
        text.includes("העברה רגילה") ||
        text.includes("פרטי העברה") ||
        text.includes("למי ברצונך") ||
        text.includes("כמה") ||
        text.includes("העברת כספים")
      );
    });

    if (!isTransferPage) {
      // Try menu navigation via "העברת כסף" link
      console.log("[hapoalim] Direct URL didn't work, trying menu...");
      await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll("a, button, div[role='button'], kite-button"));
        const transferLink = links.find((el) =>
          /העברת כסף|העברה רגילה/i.test(el.textContent ?? "")
        ) as HTMLElement | undefined;
        if (transferLink) transferLink.click();
      });
      await new Promise((r) => setTimeout(r, 3000));
      await this.waitForAngular(page);
    }

    // Dump form inputs for debugging
    await this.dumpFormInputs(page);
    console.log("[hapoalim] On transfer form page");
  }

  async fillAndSubmitForm(page: Page, transfer: TransferData) {
    console.log("[hapoalim] Filling transfer form...");

    // Make sure "לאחר" (to another) tab is selected
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll("button, a, [role='tab'], label, span, kite-button"));
      const toOtherTab = tabs.find((el) => {
        const t = (el.textContent ?? "").trim();
        return t === "לאחר" || t.includes("לאחר");
      }) as HTMLElement | undefined;
      if (toOtherTab) toOtherTab.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    await this.waitForAngular(page);

    // ── Fill recipient name (שם בעל החשבון) ────────────────────────────────
    if (transfer.toExternalName) {
      console.log(`[hapoalim] Filling name: ${transfer.toExternalName}`);
      const nameSel = await waitForAny(page, [
        '[formcontrolname="beneficiaryName"]', '#beneficiaryName',
        '[formcontrolname="accountOwnerName"]', '#accountOwnerName',
        'input[formcontrolname*="name" i]',
      ], 5_000);
      if (nameSel) {
        await this.angularType(page, nameSel, transfer.toExternalName);
      } else {
        // Fallback: find by label
        await page.evaluate((name: string) => {
          const labels = Array.from(document.querySelectorAll("label"));
          const label = labels.find((l) => /שם בעל|שם המוטב/i.test(l.textContent ?? ""));
          if (label) {
            const forId = label.getAttribute("for");
            const input = (forId ? document.getElementById(forId) : null) ?? label.closest("poalim-mm-field")?.querySelector("input");
            if (input) {
              (input as HTMLInputElement).focus();
              (input as HTMLInputElement).value = name;
              input.dispatchEvent(new Event("input", { bubbles: true }));
              input.dispatchEvent(new Event("change", { bubbles: true }));
              input.dispatchEvent(new Event("blur", { bubbles: true }));
            }
          }
        }, transfer.toExternalName);
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    // ── Fill bank code (בנק) ───────────────────────────────────────────────
    // This is likely a kite-autocomplete or poalim-mm-field with a dropdown
    if (transfer.toExternalBankCode) {
      console.log(`[hapoalim] Filling bank code: ${transfer.toExternalBankCode}`);
      const bankSel = await waitForAny(page, [
        '[formcontrolname="bankCode"]', '#bankCode',
        '[formcontrolname="bankNumber"]', '#bankNumber',
        'select[formcontrolname*="bank" i]',
        'input[formcontrolname*="bank" i]',
      ], 5_000);
      if (bankSel) {
        const tagName = await page.evaluate((sel: string) => document.querySelector(sel)?.tagName, bankSel);
        if (tagName === "SELECT") {
          await page.select(bankSel, transfer.toExternalBankCode);
        } else {
          await this.angularType(page, bankSel, transfer.toExternalBankCode);
          // If autocomplete, wait for dropdown and pick first option
          await new Promise((r) => setTimeout(r, 800));
          await page.evaluate(() => {
            const option = document.querySelector('[role="option"], .autocomplete-option, [class*="option"]:not([class*="options"])');
            if (option) (option as HTMLElement).click();
          });
        }
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    // ── Fill branch number (סניף) ──────────────────────────────────────────
    if (transfer.toExternalBranchNumber) {
      console.log(`[hapoalim] Filling branch: ${transfer.toExternalBranchNumber}`);
      const branchSel = await waitForAny(page, [
        '[formcontrolname="branchNumber"]', '#branchNumber',
        '[formcontrolname="branch"]', '#branch',
        'input[formcontrolname*="branch" i]',
      ], 5_000);
      if (branchSel) {
        await this.angularType(page, branchSel, transfer.toExternalBranchNumber);
        // Might trigger autocomplete
        await new Promise((r) => setTimeout(r, 800));
        await page.evaluate(() => {
          const option = document.querySelector('[role="option"], .autocomplete-option');
          if (option) (option as HTMLElement).click();
        });
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    // ── Fill account number (מס' חשבון) — digits only ──────────────────────
    if (transfer.toExternalAccount) {
      console.log(`[hapoalim] Filling account: ${transfer.toExternalAccount}`);
      const acctSel = await waitForAny(page, [
        '[formcontrolname="accountNumber"]', '#accountNumber',
        '[formcontrolname="beneficiaryAccountNumber"]', '#beneficiaryAccountNumber',
        'input[formcontrolname*="account" i]',
      ], 5_000);
      if (acctSel) {
        await this.angularType(page, acctSel, transfer.toExternalAccount);
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    // ── Fill amount (כמה?) ──────────────────────────────────────────────────
    console.log(`[hapoalim] Filling amount: ${transfer.amount}`);
    const amountSel = await waitForAny(page, [
      '[formcontrolname="amount"]', '#amount',
      '[formcontrolname="transferAmount"]', '#transferAmount',
      '[formcontrolname="sum"]', '#sum',
      'input[formcontrolname*="amount" i]',
    ], 5_000);
    if (amountSel) {
      await this.angularType(page, amountSel, transfer.amount.toString());
    }
    await new Promise((r) => setTimeout(r, 500));

    // ── Fill reason (סיבה) — optional ──────────────────────────────────────
    if (transfer.purpose || transfer.description) {
      const reasonText = transfer.purpose || transfer.description || "";
      const reasonSel = await waitForAny(page, [
        '[formcontrolname="transferReason"]', '#transferReason',
        '[formcontrolname="remark"]', '#remark',
        '[formcontrolname="reason"]',
        'textarea[formcontrolname*="reason" i]',
        'input[formcontrolname*="reason" i]',
      ], 3_000);
      if (reasonSel) {
        await this.angularType(page, reasonSel, reasonText);
      }
    }

    await new Promise((r) => setTimeout(r, 1000));

    // ── Submit form → Step 2 confirmation ──────────────────────────────────
    console.log("[hapoalim] Submitting form...");
    // The submit button should be a red-coloring-btn (same as login)
    const submitted = await page.evaluate(() => {
      // Try the bank's standard red button first
      const redBtn = document.querySelector("button.red-coloring-btn:not(.login-btn)") as HTMLElement;
      if (redBtn && redBtn.getBoundingClientRect().height > 0) {
        redBtn.click();
        return "red-btn";
      }
      // Try kite-button
      const kiteBtn = document.querySelector("kite-button button") as HTMLElement;
      if (kiteBtn && kiteBtn.getBoundingClientRect().height > 0) {
        kiteBtn.click();
        return "kite-btn";
      }
      // Fallback: find by text
      const buttons = Array.from(document.querySelectorAll("button, a, input[type=submit]"));
      const nextBtn = buttons.find((b) =>
        /המשך|הבא|לשלב הבא|העבר|שליחה/i.test(b.textContent ?? "") &&
        b.getBoundingClientRect().height > 0
      ) as HTMLElement | undefined;
      if (nextBtn) { nextBtn.click(); return "text-match"; }
      return "none";
    });
    console.log(`[hapoalim] Submit method: ${submitted}`);

    // Wait for confirmation page
    await new Promise((r) => setTimeout(r, 3000));
    await this.waitForAngular(page);
    console.log("[hapoalim] Should be on confirmation page");
  }

  async clickConfirmTransfer(page: Page) {
    console.log("[hapoalim] Clicking confirm transfer...");

    // On Step 2, the confirm button is red-coloring-btn with text "אישור העברה"
    await page.evaluate(() => {
      // Primary: find the red confirm button
      const redBtns = Array.from(document.querySelectorAll("button.red-coloring-btn"));
      const confirmBtn = redBtns.find((b) =>
        /אישור|אשר|בצע/i.test(b.textContent ?? "") && b.getBoundingClientRect().height > 0
      ) as HTMLElement | undefined;
      if (confirmBtn) { confirmBtn.click(); return; }

      // Fallback: any button with confirm text
      const allBtns = Array.from(document.querySelectorAll("button, kite-button, a"));
      const btn = allBtns.find((b) =>
        /אישור העברה|אישור|אשר|בצע העברה/i.test(b.textContent ?? "") && b.getBoundingClientRect().height > 0
      ) as HTMLElement | undefined;
      if (btn) btn.click();
    });

    // Wait for OTP dialog
    await new Promise((r) => setTimeout(r, 4000));
    await this.waitForAngular(page);
    console.log("[hapoalim] Confirm clicked");
  }

  async hasOtpDialog(page: Page): Promise<boolean> {
    try {
      return await page.evaluate(() => {
        const text = document.body?.innerText ?? "";
        return (
          text.includes("קוד אימות") ||
          text.includes("שלחנו לך קוד") ||
          text.includes("מה הקוד שקיבלת") ||
          text.includes("מתקשרים אליך") ||
          text.includes("הקלד כאן") ||
          // OTP dialog element
          !!document.querySelector('[formcontrolname="otpCode"], #otpCode, .otp-input, [class*="otp"]')
        );
      });
    } catch {
      return false;
    }
  }

  async fillOtpAndSubmit(page: Page, otp: string) {
    console.log("[hapoalim] Filling OTP code...");

    // Try specific OTP selectors first (Angular formcontrolname)
    const otpSel = await waitForAny(page, [
      '[formcontrolname="otpCode"]', '#otpCode',
      '.otp-input', '[class*="otp"] input',
      'input[formcontrolname*="otp" i]',
      'input[formcontrolname*="code" i]',
      'input[type="tel"]',
      'input[inputmode="numeric"]',
    ], 10_000);

    if (otpSel) {
      await this.angularType(page, otpSel, otp);
    } else {
      // Fallback: find any visible empty input in dialog/modal overlay
      console.log("[hapoalim] OTP selector not found, trying fallback...");
      await page.evaluate((code: string) => {
        // Look for dialog/modal containers first
        const containers = document.querySelectorAll('[class*="dialog"], [class*="modal"], [class*="overlay"], [role="dialog"]');
        for (const container of containers) {
          const input = container.querySelector("input:not([type=hidden])") as HTMLInputElement;
          if (input && input.getBoundingClientRect().height > 0) {
            input.focus();
            input.value = code;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
            return;
          }
        }
        // Last resort: any visible input
        const inputs = Array.from(document.querySelectorAll("input:not([type=hidden])"));
        const visible = inputs.filter((i) => i.getBoundingClientRect().height > 0);
        const empty = visible.find((i) => !(i as HTMLInputElement).value) as HTMLInputElement | undefined;
        if (empty) {
          empty.focus();
          empty.value = code;
          empty.dispatchEvent(new Event("input", { bubbles: true }));
          empty.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, otp);
    }

    await new Promise((r) => setTimeout(r, 500));

    // Click submit — red button in OTP dialog with "להמשך" text
    console.log("[hapoalim] Submitting OTP...");
    await page.evaluate(() => {
      // Try red button in dialog
      const dialogs = document.querySelectorAll('[class*="dialog"], [class*="modal"], [role="dialog"]');
      for (const dialog of dialogs) {
        const redBtn = dialog.querySelector("button.red-coloring-btn") as HTMLElement;
        if (redBtn) { redBtn.click(); return; }
        const btn = Array.from(dialog.querySelectorAll("button")).find((b) =>
          /להמשך|המשך|אישור|שלח/i.test(b.textContent ?? "")
        ) as HTMLElement | undefined;
        if (btn) { btn.click(); return; }
      }
      // Fallback: any button with submit text
      const buttons = Array.from(document.querySelectorAll("button"));
      const submitBtn = buttons.find((b) =>
        /להמשך|המשך|אישור|אשר|שלח/i.test(b.textContent ?? "") && b.getBoundingClientRect().height > 0
      ) as HTMLElement | undefined;
      if (submitBtn) submitBtn.click();
    });

    // Wait for bank to process
    await new Promise((r) => setTimeout(r, 5000));
    await this.waitForAngular(page);
    console.log("[hapoalim] OTP submitted");
  }

  async detectSuccess(page: Page): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 3000));
    return await page.evaluate(() => {
      const text = document.body?.innerText ?? "";
      const url = window.location.href;
      return (
        text.includes("בוצעה בהצלחה") ||
        text.includes("ההעברה בוצעה") ||
        text.includes("הפעולה בוצעה") ||
        text.includes("העברה בוצעה") ||
        text.includes("סכום ההעברה חויב") ||
        // Step 3 "סיום" without step 1 indicator
        (text.includes("סיום") && !text.includes("פרטי העברה")) ||
        url.includes("success") || url.includes("receipt") || url.includes("done")
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
    await executor.navigateToTransferForm(page);
    // Account selector is on the transfer page itself — select after navigation
    await executor.selectAccount(page, transfer.fromAccountNumber);
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
