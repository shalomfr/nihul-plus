# Matefet App — Main Application

Full-stack Next.js application for NGO compliance management.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **Prisma** ORM + PostgreSQL
- **NextAuth.js** (credentials provider)
- **Tailwind CSS v4** (RTL Hebrew)
- **Zod** validation with Hebrew error messages

## Getting Started

```bash
npm install
cp .env.example .env   # configure your env vars
npx prisma db push     # create database tables
npx prisma db seed     # seed admin + demo org
npm run dev             # http://localhost:3000
```

## Default Credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@matefet.co.il` | `Admin123!` |
| Manager | `yossi@or-letzion.org.il` | `Manager123!` |

## Key Directories

| Path | Description |
|------|-------------|
| `src/app/(auth)/` | Login & registration pages |
| `src/app/admin/` | Admin dashboard |
| `src/app/portal/` | Organization portal |
| `src/app/api/` | REST API routes (24+ endpoints) |
| `src/lib/` | Shared utilities & services |
| `src/components/` | Reusable React components |
| `prisma/schema.prisma` | Database schema |
| `prisma/seed.ts` | Database seeding script |

## API Middleware

All API routes use helpers from `src/lib/api-helpers.ts`:

- `withErrorHandler` — wraps route with try/catch + logging
- `requireAdmin` — ensures ADMIN role
- `requireManager` — ensures MANAGER+ role
- `apiResponse` / `apiError` — consistent response format
