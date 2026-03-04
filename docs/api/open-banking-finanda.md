# תוכנית: תשתית בנקאות Finanda + מודול הוצאות

## הקשר
המשתמש רוצה להכין את כל התשתית לחיבור בנקאי דרך Finanda (Open Banking ישראלי, תקן NextGenPSD2 XS2A). הכל צריך לעבוד כאילו כבר מחובר — UI, API, מודלים, seed data. המשתמש ידאג לאישורים ולחיבור בפועל ל-Finanda אח"כ.

Finanda תומכת ב: חשבונות, יתרות, תנועות (AIS) + יזום העברות (PIS), OAuth2 עם הסכמת בנק, 10+ בנקים ישראליים.

---

## שלב 1: עדכון Prisma Schema

**קובץ: `app/prisma/schema.prisma`**

### Enums חדשים:
```prisma
enum ExpenseStatus { PENDING, APPROVED, PAID, REJECTED, CANCELLED }
enum ExpenseCategory { SALARIES, RENT, ACTIVITIES, MARKETING, ADMINISTRATION, TRANSPORTATION, SUPPLIES, PROFESSIONAL_SERVICES, INSURANCE, MAINTENANCE, OTHER }
enum BankConnectionStatus { PENDING_CONSENT, ACTIVE, EXPIRED, REVOKED, ERROR }
enum TransferStatus { PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED }
```

### מודלים חדשים:

**BankAccount** — חשבון בנק של הארגון
- bankName, bankCode, branchNumber, accountNumber, balance, availableBalance
- isPrimary, isActive, lastSyncAt, finandaAccountId (לקישור ל-Finanda)
- unique constraint על [organizationId, bankCode, branchNumber, accountNumber]

**BankTransaction** — תנועות מיובאות מהבנק
- bankAccountId, amount, direction (CREDIT/DEBIT), description, counterpartyName
- valueDate, bookingDate, balance (יתרה שוטפת), finandaTransactionId
- unique constraint על [bankAccountId, finandaTransactionId]

**Expense** — הוצאות הארגון
- amount, description, category (ExpenseCategory), vendor, status (ExpenseStatus)
- receiptUrl, invoiceNumber, expenseDate, paidAt
- bankAccountId (אופציונלי), budgetLineId (אופציונלי — לקישור לתקציב)
- approvedBy, approvedAt

**FinandaConnection** — חיבור OAuth לבנק דרך Finanda
- bankCode, bankName, status (BankConnectionStatus)
- consentId, accessToken, refreshToken, tokenExpiresAt, consentExpiresAt
- lastSyncAt, lastError

### עדכון BankTransfer הקיים:
- החלפת fromAccount/toAccount (strings) ב-fromAccountId/toAccountId (FK ל-BankAccount)
- הוספת: toExternalAccount, toExternalBankCode, toExternalName, status, finandaPaymentId

### הוספת relations ל-Organization, BudgetLine

---

## שלב 2: שכבת שירות Finanda

**קובץ חדש: `app/src/lib/finanda.ts`**

- TypeScript interfaces בתקן XS2A: FinandaAccount, FinandaBalance, FinandaTransaction, FinandaPaymentResponse
- רשימת `ISRAELI_BANKS` (12 בנקים עם bankCode, שם בעברית, BIC)
- `FinandaService` class עם מתודות stub:
  - `getSupportedBanks()` — מחזיר רשימת בנקים
  - `getConsentUrl()`, `handleConsentCallback()` — OAuth flow
  - `getAccounts()`, `getBalances()`, `getTransactions()` — AIS
  - `initiatePayment()`, `getPaymentStatus()` — PIS
  - `refreshAccessToken()` — רענון token
- כל מתודה זורקת `FinandaNotConnectedError` כשאין `FINANDA_API_KEY`
- Singleton export: `getFinandaService()`

---

## שלב 3: Validators (Zod)

**קובץ: `app/src/lib/validators.ts`** — הוספה לסוף הקובץ

- `createBankAccountSchema` — bankName, accountNumber, branchNumber, isPrimary
- `createExpenseSchema` — amount, description, category, vendor, expenseDate, budgetLineId, receiptUrl
- `updateExpenseSchema` — partial + status
- `createBankTransferSchema` — fromAccountId, toAccountId/toExternal, amount, transferDate

---

## שלב 4: API Routes

### בנקאות:
| Route | Methods | תיאור |
|-------|---------|-------|
| `api/banking/accounts` | GET, POST | רשימת חשבונות + הוספה ידנית |
| `api/banking/accounts/[id]` | GET, PUT, DELETE | חשבון בודד |
| `api/banking/accounts/[id]/transactions` | GET | תנועות חשבון עם סינון תאריך |
| `api/banking/transfers` | GET, POST | רשימת העברות + יזום העברה |
| `api/banking/transfers/[id]` | GET | העברה בודדת |
| `api/banking/connect` | GET, POST | סטטוס חיבור + יזום OAuth |
| `api/banking/sync` | POST | סנכרון מ-Finanda |

### הוצאות:
| Route | Methods | תיאור |
|-------|---------|-------|
| `api/expenses` | GET, POST | רשימה + יצירת הוצאה |
| `api/expenses/[id]` | GET, PUT, DELETE | הוצאה בודדת |

**לוגיקה חשובה:** כשהוצאה מקושרת ל-budgetLineId ומשתנה ל-PAID/APPROVED — מעדכן BudgetLine.actual ו-Budget.totalSpent אוטומטית (בתוך prisma.$transaction).

---

## שלב 5: דף פורטל "בנק והוצאות"

**קובץ חדש: `app/src/app/portal/banking/page.tsx`**

### ניווט:
- הוספת `{ href: "/portal/banking", icon: Landmark, label: "בנק והוצאות" }` ל-PortalSidebar

### עיצוב הדף:
```
Topbar: "בנק והוצאות" / "ניהול חשבונות בנק, תנועות והוצאות"

[באנר סטטוס חיבור — "Finanda לא מוגדר" / "מחובר ל-2 בנקים"]

[טאבים: חשבונות | תנועות | הוצאות | העברות]

טאב חשבונות:
  - כרטיסי סיכום: יתרה כוללת, מספר חשבונות, סנכרון אחרון
  - רשימת חשבונות (שם בנק, מספר, יתרה, סטטוס)

טאב תנועות:
  - סינון תאריכים + כיוון (זיכוי/חיוב)
  - טבלת תנועות (תאריך, תיאור, סכום ירוק/אדום, יתרה)

טאב הוצאות:
  - סינון לפי קטגוריה + סטטוס
  - כפתור "הוסף הוצאה" עם מודל:
    סכום, תיאור, קטגוריה (select), ספק, תאריך, העלאת קבלה, שורת תקציב (select)
  - רשימה עם עריכה/מחיקה

טאב העברות:
  - רשימת העברות
  - טופס "בצע העברה": חשבון מקור, יעד (פנימי/חיצוני), סכום, אסמכתא
```

---

## שלב 6: עדכון דף אינטגרציות

**קובץ: `app/src/app/admin/integrations/page.tsx`**

- הוספת סקשן "בנקאות (Finanda)" עם רשימת בנקים דינמית מ-`ISRAELI_BANKS`
- סטטוס חיבור אמיתי מ-`/api/banking/connect`
- כפתור "הגדר Finanda" שמציג הודעה על הגדרת FINANDA_API_KEY

---

## שלב 7: Seed Data

**קובץ: `app/prisma/seed.ts`**

- 2 חשבונות בנק (הפועלים + לאומי) עם יתרות
- 10 תנועות בנק (שילוב זיכויים וחיובים)
- 6 הוצאות (שכירות, משכורת, ציוד, ייעוץ) מקושרות לשורות תקציב
- 2 העברות בנקאיות (פנימית + חיצונית)
- Cleanup בתחילת ה-seed

---

## שלב 8: עדכון stats/portal

**קובץ: `app/src/app/api/stats/portal/route.ts`**

הוספת מידע בנקאי ל-response:
```typescript
banking: {
  totalBalance, accounts, totalExpenses, expenseCount,
  connections, isConnected
}
```

---

## סדר ביצוע

| # | פעולה | קבצים |
|---|-------|-------|
| 1 | עדכון schema + migrate + generate | `schema.prisma` |
| 2 | יצירת finanda.ts | `lib/finanda.ts` |
| 3 | עדכון validators | `lib/validators.ts` |
| 4 | עדכון seed | `seed.ts` |
| 5 | API routes בנקאות | `api/banking/*` (7 routes) |
| 6 | API routes הוצאות | `api/expenses/*` (2 routes) |
| 7 | עדכון sidebar + דף banking | `PortalSidebar.tsx`, `portal/banking/page.tsx` |
| 8 | עדכון integrations | `admin/integrations/page.tsx` |
| 9 | עדכון stats | `api/stats/portal/route.ts` |
| 10 | Build + seed + push | — |

## בדיקה
- `npx prisma generate` עובר
- `npm run build` עובר בלי שגיאות
- Seed רץ עם חשבונות, תנועות, הוצאות
- דף בנק מציג 4 טאבים עם נתוני seed
- הוספת הוצאה מעדכנת תקציב אוטומטית
- באנר "Finanda לא מוגדר" מוצג (ללא FINANDA_API_KEY)
- דף אינטגרציות מציג בנקים מ-Finanda
