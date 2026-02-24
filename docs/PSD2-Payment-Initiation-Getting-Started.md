# התחלת עבודה עם ממשק PSD2 – התחלת תשלום (בנק הפועלים)

<div dir="rtl">

## 1. דרישות מקדימות (חובה לפני שמתחילים)

### 1.1 אישורי TPP (רגולטור ישראלי)

- **QWAC** – אישור לתקשורת מאובטחת (TLS) מול הבנק  
- **QSEAL** – אישור לחתימה דיגיטלית על הבקשות  
- **תפקידים תקפים**: אחד מהבאים: **PSP_IP** (Payment Initiation) או **PSP_AS** (Account Information + Payment)

אין להשתמש ב-API בלי אישורים תקפים מהרגולטור. לארגז חול ולסביבת ייצור נדרשים **אישורים נפרדים**.

### 1.2 OAuth2 אצל הבנק

- המשתמש (PSU) חייב להתאמת בערוץ הבנק (OAuth2).  
- לאחר האימות מתקבל **Bearer Token** שמשמש בכל קריאות ה-API.  
- ללא Token תקף – הבנק ידחה את הבקשה.

### 1.3 אישור התשלום על ידי המשתמש

- גם עם Token תקף, התשלום מתבצע רק אחרי שהמשתמש **מאשר** אותו במסך האישור של בנק הפועלים (SCA – Strong Customer Authentication).

---

## 2. סביבות עבודה

| סביבה   | שימוש        | הערה |
|---------|-------------|------|
| **ארגז חול** | פיתוח ובדיקות | URL נפרד, אישורי TPP נפרדים |
| **ייצור**   | תשלומים אמיתיים | אישורי TPP ייצור, OAuth ייצור |

כתובות ה-API עצמן (Base URL) יינתנו על ידי בנק הפועלים – בקובץ ה-OpenAPI מופיעות כתובות דוגמה (`https://api.testbank.com/psd2`). יש לקבל את ה-URLים האמיתיים מהבנק.

---

## 3. מבנה קריאה ל-API – התחלת תשלום בודד

### 3.1 Endpoint

```
POST /v1/{payment-service}/{payment-product}
```

**ערכי payment-service:**

- `payments` – תשלום בודד  
- `bulk-payments` – תשלומים מרובים (אופציונלי אצל הבנק)  
- `periodic-payments` – תשלום תקופתי (אופציונלי)

**ערכי payment-product (ישראל):**

- `masav` – העברה מקומית (מערכת "ASAV")  
- `zahav` – העברות זהב/בינלאומיות  
- `fp` – לפי תיעוד הבנק (FP)

### 3.2 Headers חובה (לפי ה-Spec)

| Header | תיאור |
|--------|--------|
| `X-Request-ID` | מזהה ייחודי לבקשה (UUID) |
| `Digest` | גיבוב גוף הבקשה (למשל SHA-256=...) |
| `Signature` | חתימה על הבקשה עם מפתח ה-QSEAL |
| `TPP-Signature-Certificate` | אישור ה-TPP לחתימה (Base64) |
| `PSU-ID` | ת.ז. של המשתמש (ספרות בלבד) או דרכון: קוד מדינה + '-' + מספר דרכון |
| `PSU-ID-Type` | סוג המזהה (למשל ת.ז. / דרכון) |
| `PSU-IP-Address` | כתובת IP של המשתמש (חובה ב-PIS) |
| `Authorization` | `Bearer <access_token>` – טוקן OAuth2 מהבנק |
| `Content-Type` | `application/json` |

### 3.3 גוף הבקשה (JSON) – דוגמה לתשלום בודד (payments + masav)

```json
{
  "instructedAmount": { "currency": "ILS", "amount": "123.50" },
  "debtorAccount": { "iban": "..." },
  "creditorName": "שם beneficiarie",
  "creditorAccount": { "iban": "..." },
  "remittanceInformationUnstructured": " ref לתשלום"
}
```

שדות מדויקים (IBAN vs חשבון ישראלי וכו') – לפי תיעוד בנק הפועלים וה-Implementation Guidelines של BOI.

### 3.4 תגובה מוצלחת (201 Created)

התגובה תכלול בין השאר:

- `paymentId` – מזהה העסקה  
- `transactionStatus` – למשל `RCVD`  
- `_links` – לינקים ל:
  - `scaOAuth` – להשלמת SCA (הפניה ל-OAuth של הבנק)  
  - `status` – לבדיקת סטטוס התשלום

המשתמש יופנה למסך האישור של הבנק (Redirect/OAuth), יאשר את התשלום, ואז ניתן לעקוב אחרי הסטטוס דרך `GET .../status`.

---

## 4. צעדים מעשיים להתחלה

1. **השגת אישורים**  
   - פנה לרגולטור הישראלי (לפי הנחיות BOI) והנפק QWAC + QSEAL עם תפקיד PSP_IP (או PSP_AS).  
   - וודא שהאישורים רשומים אצל בנק הפועלים.

2. **הרשמה אצל בנק הפועלים**  
   - קבל:
     - Base URL לארגז חול ולייצור  
     - פרטי OAuth2 (Authorization URL, Token URL, Client ID וכו').  
   - בדוק אם יש פורטל מפתחים או תיעוד ספציפי לבנק.

3. **הטמעת OAuth2**  
   - זרימת התחברות משתמש (PSU) שמובילה ל-Bearer Token.  
   - שמירת/שימוש ב-Token בכל קריאה ל-PIS.

4. **הטמעת חתימת TPP**  
   - חישוב `Digest` (למשל SHA-256 של גוף הבקשה).  
   - חתימה עם מפתח ה-QSEAL לפי המפרט (Berlin Group / BOI).  
   - שליחת `Signature` ו-`TPP-Signature-Certificate` בכל בקשה.

5. **שימוש ב-OpenAPI**  
   - הקובץ `BOI_NextGenPSD2_v1.7.yaml` מגדיר את כל ה-endpoints וה-schemas.  
   - ניתן לייצר Client (למשל TypeScript/Node או Python) מ-OpenAPI Generator.  
   - חשוב להתאים ל-URLים ולדרישות הספציפיות של בנק הפועלים (Headers חובה, שדות PSU וכו').

6. **זרימת E2E**  
   - ייזום תשלום (POST) → קבלת `paymentId` ו-`scaRedirect`/`scaOAuth` → הפניית המשתמש לאישור בבנק → אחרי אישור: קריאה ל-`GET .../status` עד `transactionStatus` סופי (למשל ACCP).

---

## 5. קישורים שימושיים

- **Berlin Group NextGenPSD2** (מפרט כללי):  
  https://www.berlin-group.org/nextgenpsd2-downloads  
- **תיעוד בנק ישראל (BOI)** להנחיות PSD2 מקומיות.  
- **בנק הפועלים** – תיעוד מפתחים / פורטל TPP (אם קיים) – לקבלת Base URL, OAuth וחריגות מהמפרט.

---

## 6. סיכום בדיקה לפני Go-Live

- [ ] אישורי QWAC + QSEAL תקפים (ארגז חול / ייצור לפי הצורך)  
- [ ] תפקיד PSP_IP או PSP_AS רשום באישורים  
- [ ] OAuth2 מוטמע ומחזיר Bearer Token  
- [ ] Digest + Signature + TPP-Signature-Certificate נשלחים בכל בקשה  
- [ ] PSU-ID, PSU-IP-Address ו-Headers חובה אחרים ממולאים  
- [ ] זרימת SCA (הפניה למסך אישור הבנק) עובדת  
- [ ] בדיקת סטטוס תשלום (GET status) אחרי אישור

</div>
