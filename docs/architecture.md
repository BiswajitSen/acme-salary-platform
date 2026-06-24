# Architecture

## Decision: one repo (monorepo)

ACME Salary Platform uses a **single repository** with three packages:

```
acme-salary-platform/
├── backend/    → Node.js + Express + SQLite (Drizzle)
├── frontend/   → Next.js (App Router)
└── shared/     → Shared TypeScript types & enums
```

**Why not separate repos?**

- Frontend and backend are one product with tightly coupled changes (employees, compensation, import, analytics).
- `@acme/shared` keeps API contracts in sync without publishing a separate package.
- One clone, one PR, one CI run — simpler for MVP and small teams.

**Revisit splitting only when:** different teams own FE/BE, independent release cadences, or the API serves multiple unrelated clients.

---

## Stack

| Layer    | Choice                          |
|----------|---------------------------------|
| Frontend | Next.js 16, TypeScript          |
| Backend  | Express, TypeScript             |
| Database | SQLite (PRD), Drizzle ORM       |
| Shared   | npm workspaces (`@acme/shared`) |

---

## Backend layers

```
HTTP request
  → routes/        (URL mapping, thin handlers)
  → services/      (business logic)
  → db/            (Drizzle schema + queries)
```

Cross-cutting: env validation (Zod), logging (Pino), error middleware, Helmet, CORS.

API prefix: `/api/*` · Health: `GET /api/health`

---

## Frontend layers

```
app/               (routes, Server Components)
components/        (UI)
lib/api/           (typed fetch client)
lib/env.ts         (validated config)
```

Server Components fetch the backend directly. Client-side calls use the Next.js proxy: `/api/backend/*` → backend `/api/*`.

---

## Database

- File: `backend/data/acme.db`
- Migrations: `backend/drizzle/` (version-controlled, run on startup)
- Tables: `employees`, `compensation_history` (append-only)
- PRAGMAs: WAL mode, foreign keys ON

---

## Local development

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

npm run dev:backend   # :8000
npm run dev:frontend  # :3000
```

---

## Conventions

- **DB columns:** snake_case (SQL standard)
- **API JSON:** camelCase (TypeScript standard)
- **Compensation changes:** insert-only — never update/delete history rows
- **Currency rule:** aggregate metrics per currency only (no cross-currency blending)
