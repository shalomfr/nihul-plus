# Matefet (מעטפת) — NGO Compliance Management Platform

A comprehensive SaaS platform for managing Israeli non-profit organizations (עמותות), providing professional guidance for regulatory compliance, financial tracking, board management, and more.

## Architecture

```
mahatefet/
├── app/          → Main application (Next.js 16, full-stack)
├── landing/      → Marketing landing page (Next.js 15, static export)
├── docs/         → Planning & reference documents
└── render.yaml   → Render deployment config (2 services)
```

| Service | Tech | URL |
|---------|------|-----|
| **App** | Next.js 16, React 19, Prisma, PostgreSQL | `matefet-app.azurewebsites.net` |
| **Landing** | Next.js 15, Three.js, Framer Motion | `salmon-field-0bdce4903.2.azurestaticapps.net` |

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (credential-based)
- **Styling**: Tailwind CSS v4 (RTL Hebrew)
- **Bank Integration**: `israeli-bank-scrapers` (Puppeteer)
- **Queue**: BullMQ + Redis (optional)
- **Email**: Nodemailer
- **Validation**: Zod
- **Hosting**: Azure App Service + Azure Static Web Apps (also on Render)

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- (Optional) Redis for job queue

### Setup

```bash
# 1. Clone
git clone <repo-url>
cd mahatefet

# 2. Install dependencies
cd app && npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, NEXTAUTH_SECRET, etc.

# 4. Push database schema
npx prisma db push

# 5. Seed initial data
npx prisma db seed

# 6. Run development server
npm run dev
```

### Landing Page

```bash
cd landing && npm install
npm run dev        # Development
npm run build      # Static export → out/
```

## Project Structure (app/)

```
app/src/
├── app/
│   ├── (auth)/           → Login & registration pages
│   ├── admin/            → Admin dashboard (user mgmt, automation, reports)
│   ├── portal/           → Organization portal (main workspace)
│   └── api/              → REST API routes
│       ├── auth/         → NextAuth endpoints
│       ├── banking/      → Bank accounts, transactions, scraper
│       ├── board/        → Meetings, members, resolutions
│       ├── compliance/   → Regulatory compliance tracking
│       ├── documents/    → Document management
│       ├── donors/       → Donor & donation management
│       ├── budget/       → Budget lines & tracking
│       ├── expenses/     → Expense management
│       ├── volunteers/   → Volunteer management
│       └── workflows/    → Automation workflows
├── components/           → Shared React components
├── lib/                  → Utilities & services
│   ├── api-helpers.ts    → withErrorHandler, requireAdmin/requireManager
│   ├── auth.ts           → NextAuth config
│   ├── validators.ts     → Zod schemas (Hebrew error messages)
│   ├── encryption.ts     → AES-256-GCM credential encryption
│   ├── bank-scraper.ts   → Israeli bank scraper integration
│   └── email.ts          → Email service
├── types/                → TypeScript type definitions
└── worker/               → Background job processors
```

## API Patterns

```typescript
// All API routes use this pattern:
export const GET = withErrorHandler(async (req) => {
  const session = await requireManager(req);  // or requireAdmin
  const data = schema.parse(await req.json()); // Zod validation
  // ... business logic
  return apiResponse(result);
});
```

## Environment Variables

See `app/.env.example` for all required/optional variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Auth session encryption key |
| `NEXTAUTH_URL` | Yes | App URL (for auth callbacks) |
| `ENCRYPTION_KEY` | Yes | AES key for bank credentials |
| `REDIS_URL` | No | Redis for BullMQ job queue |
| `SMTP_*` | No | Email service configuration |

## Deployment

Both services are deployed to **Azure** and **Render**:

- **Azure**: App Service (B1) + Static Web App (Free) + PostgreSQL Flexible
- **Render**: Web Service + Static Site + PostgreSQL

See `render.yaml` for Render configuration.

## License

Proprietary - All rights reserved.
