# Finanda Smart Aggregation - API Documentation Summary

> Source: https://docs.finanda.com/ (v1.0.13-preview)

## Environments

| Environment | Endpoint |
|-------------|----------|
| Testing | `fsa.testing.finanda.com` |
| Production | `fsa.production.finanda.com` |

- HTTPS with TLS v1.2 required
- Testing uses "Finanda Simulation Bank" as mock data source

---

## Authentication

Every API call must include these headers:

| Header | Description |
|--------|-------------|
| `fsa-customer-id` | Customer ID provided by Finanda |
| `x-request-id` | Unique UUID per request |
| `fsa-secret-token` | JWT signed with RS256, contains `codeVerifier`, short expiration (60s) |
| `fsa-api-version` | API version (e.g. `v1`) |

### Node.js Example:
```javascript
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');

const payload = { codeVerifier }; // from credentials
const key = secretKey; // from credentials
const token = jwt.sign(payload, { key, passphrase }, {
  algorithm: 'RS256',
  expiresIn: 60
});

const headers = {
  'fsa-customer-id': customerId,
  'x-request-id': uuid(),
  'fsa-secret-token': token,
  'fsa-api-version': 'v1'
};
```

---

## API Endpoints

### Profile APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/createProfile` | POST | Create a new profile for the application |
| `/deleteProfile` | POST | Delete a profile and all downloaded data |
| `/getProfileDetails` | POST | Get details for specified profile |

### Session APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/createSession` | POST | Create session for specified profile |
| `/getAppAttributesForSession` | POST | Get attributes for app for this session |
| `/disconnectSession` | POST | Disconnect a specified session |
| `/getEmbeddedURL` | POST | Get embedded URL for Finanda Link consent management screen |

### Consent APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/listUserConsents` | POST | List consents defined for the profile |
| `/createConsent` | POST | Create new consent for specific ASPSP (bank) |
| `/renewConsent` | POST | Renew consent for specific ASPSP |
| `/exchangeAuthorizationToken` | POST | Called after bank redirects back after consent creation |
| `/consentCreateFail` | POST | Called after bank redirects back after consent failure |
| `/TPPConsentNotification` | POST | Called from ASPSP for status notification |
| `/deleteConsent` | POST | Delete a consent |
| `/getConsentStatus` | POST | Update consent status from ASPSP |
| `/getConsent` | POST | Update consent details from ASPSP |

### Job APIs (Data Download)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/initiateJobForConsent` | POST | Initiate download using specified consent |
| `/getJobStatus` | POST | Get job execution status details |

### Accounts APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/getAccountList` | POST | Get accounts in profile across all types and ASPSPs |

### Transactions APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/getTransactions` | POST | Get transactions retrieved via open-banking |

### Enrichment APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/getCategoriesInfo` | POST | Get categories list for transaction enrichment |
| `/predefinedAttributes` | POST | Get predefined attribute values |

### Payment Initiation APIs
(Mentioned in sidebar - details TBD in future version)

---

## Flow: Profile → Consent → Data

```
1. /createProfile         → Create a profile for the end-user
2. /createSession         → Create a session
3. /getEmbeddedURL        → Get Finanda Link URL for consent screen
   OR /createConsent      → Create consent directly
4. User redirected to bank → Approves consent
5. /exchangeAuthorizationToken → Exchange auth code for tokens
6. /initiateJobForConsent → Start async data download
7. /getJobStatus          → Poll until job completes
8. /getAccountList        → Get all accounts
9. /getTransactions       → Get transactions
```

---

## Bank Codes (aspsp_code)

| Code | Bank (Hebrew) | Bank (English) |
|------|--------------|----------------|
| 4 | בנק יהב | Bank Yahav |
| 9 | דואר פיננסים | Israel Post Finance |
| 10 | בנק לאומי | Bank Leumi |
| 11 | בנק דיסקונט | Discount Bank |
| 12 | בנק הפועלים | Bank Hapoalim |
| 13 | בנק אגוד | Union Bank |
| 14 | בנק אוצר החייל | Bank Otsar HaHayal |
| 17 | בנק מרכנתיל דיסקונט | Mercantile Discount |
| 18 | הבנק הדיגיטלי הראשון | ONE ZERO |
| 20 | בנק מזרחי טפחות | Mizrahi Tefahot |
| 26 | יובנק | U-Bank |
| 31 | הבנק הבינלאומי הראשון | FIBI |
| 34 | בנק ערבי ישראלי | Arab Israel Bank |
| 46 | בנק מסד | Bank Massad |
| 52 | בנק פועלי אגודת ישראל | PAGI |
| 54 | בנק ירושלים | Bank of Jerusalem |

### Credit Card Companies
| Code | Company |
|------|---------|
| 10023 | כ.א.ל (CAL) |
| 10033 | מקס (Max) |
| 12002 | ישראכרט (Isracard) |
| 12011 | פרימיום אקספרס (Premium Express) |

---

## Institute Codes (institute_code)

Extends aspsp_code with private/business distinction:

| Code | Institute |
|------|-----------|
| 10 | בנק לאומי (פרטיים) |
| 10001 | פפר (Pepper) |
| 11 | בנק דיסקונט (פרטיים) |
| 11002 | בנק דיסקונט (עסקיים) |
| 12 | בנק הפועלים (פרטיים) |
| 12002 | בנק הפועלים (עסקיים) |
| 14 | בנק אוצר החייל (פרטיים) |
| 17 | בנק מרכנתיל (פרטיים) |
| 17002 | בנק מרכנתיל (עסקיים) |
| 18 | ONE ZERO |
| 20 | בנק מזרחי טפחות (פרטיים) |
| 26 | יובנק |
| 31 | הבינלאומי הראשון (פרטיים) |
| 31002 | הבינלאומי הראשון (עסקיים) |
| 91 | ישראכרט |
| 92 | כאל / Cal |
| 93 | מקס |
| 94 | אמריקן אקספרס |

---

## Account Types (account_type)

| Value | Hebrew | Description |
|-------|--------|-------------|
| checking-ILS | עו"ש שיקלי | Standard ILS checking |
| checking-foreign | עו"ש מט"ח | Foreign currency checking |
| card | כרטיס אשראי | Credit card (all types) |
| savings | חיסכון | Savings |
| loans | הלוואה | Loan |
| mortgage | משכנתא | Mortgage |
| guarantee | ערבות בנקאית | Bank guarantee |
| line-of-credit | מסגרת אשראי | Line of credit |
| mortgage-line-of-credit | מסגרת אשראי למשכנתא | Mortgage line of credit |
| account-credit-framework | מסגרת עו"ש | Account credit framework |
| investments | ניירות ערך | Securities |
| cash | מזומן | Cash |

---

## Data Structures

### Consent Object
Key fields: `aspsp`, `consentId`, `consentStatus`, `validUntil`, `accountsBucket`, `balancesBucket`, `transactionsBucket`, `lastSuccessfulJobTime`

### Job Object
Key fields: `aspsp`, `consentId`, `status` (initiated/after-queue/download-completed/completed/failure), `ilsAccounts`, `ilsTransactions`, `ccAccounts`, `ccTransactions`

### Account (ils_account)
Key fields: `iban`, `balances[]`, plus `finandaAdditionalStructured`:
- `type`: "checking-ILS"
- `account_id`: internal unique ID
- `currency`: always "ILS"
- `number`: account number
- `branch`: branch number
- `account_name`: description
- `institute_code`: bank code
- `creditLimit`: credit limit
- `download_stamp`: last update time
- `consentId`: consent used

### Transaction (ils_transaction)
Key fields: `transactionAmount` (ob_amount), plus `finandaAdditionalStructured`:
- `account_id`: links to account
- `fd_transaction_id`: unique transaction ID
- `category`, `category_group`, `category_type`: enrichment
- `description`: human-readable description
- `state`: "booked" or "pending"
- `suggested_transaction_date`, `suggested_value_date`

### Card Transaction
Additional fields: `cardTransactionId`, `maskedPAN`, `transactionDate`, `bookingDate`, `valueDate`, `grandTotalAmount`, `originalAmount`, plus enrichment like `current_payment`, `total_payments`, `is_pre_authorized_debit`, `deal_type`

### ob_amount
```json
{ "currency": "ILS", "amount": "1234.56" }
```

### ob_balance
```json
{
  "balanceAmount": { "currency": "ILS", "amount": "1234.56" },
  "balanceType": "closingBooked",
  "referenceDate": "2026-02-22",
  "lastChangeDateTime": "2026-02-22T14:30:00Z"
}
```

---

## Balance Types (ob_balance_type)

| Value | Hebrew |
|-------|--------|
| closingBooked | יתרה בספרים המעודכנת ביותר |
| expected | יתרה שכוללת תנועות לא סופיות |
| openingBooked | יתרת פתיחה |
| interimAvailable | יתרת ביניים לפי תנועות חובה |
| forwardAvailable | יתרה זמינה |
| interimBooked | יתרת ביניים לפי תנועות חובה וזכות |

---

## Error Codes

| Code | Description |
|------|-------------|
| 1 | Missing parameter |
| 2 | Illegal request version |
| 3 | Authentication error |
| 4 | Item does not exist |
| 5 | Data not available |
| 6 | Database error |
| 7 | Query error |
| 8 | Illegal parameter value |
| 9 | Item exists but disabled |
| 10 | Write error |
| 11 | Internal server error |
| 12 | Limit exceeded |

---

## Data Buckets (ob_restricted_to)

| Bucket | Description |
|--------|-------------|
| CACC | חשבונות עו"ש |
| CARD | כרטיסי חיוב |
| LOAN | הלוואות |
| SVGS | חסכונות |
| SCTS | ניירות ערך |

---

## Finanda Link

Embedded responsive website for end-user consent management:
- Create new consents
- Monitor existing consents
- Delete consents
- Enterprise plan: custom branding (logo, colors, font)
- Integration via `/getEmbeddedURL` API endpoint

---

## Service Plans

| Plan | Features |
|------|----------|
| Basic | Limited consents, limited API calls |
| Premium | More consents, more frequent updates |
| Enterprise | Unlimited, Finanda Link branding, custom APIs |

## Rate Limits
- Online data pull (user-initiated): unlimited
- Scheduled data pull (background): 4 times per day per consent (per law)
- Additional limits per service plan
