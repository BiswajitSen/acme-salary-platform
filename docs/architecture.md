# Architecture

## Decision: one repo (monorepo)

```
acme-salary-platform/
├── backend/    → Node.js + Express + SQLite (Drizzle)
├── frontend/   → Next.js (App Router)
├── shared/     → Shared TypeScript types & enums
├── docs/       → PRD, roadmap, engineering standards
└── AGENTS.md   → AI agent entry point
```

See [engineering-standards.md](./engineering-standards.md) for SOLID, TDD, and DI patterns.  
See [roadmap.md](./roadmap.md) for feature delivery plan.  
See [adr/README.md](./adr/README.md) for architecture decision records.

---

## Stack

| Layer    | Choice                          |
|----------|---------------------------------|
| Frontend | Next.js 16, TypeScript          |
| Backend  | Express, TypeScript             |
| Database | SQLite (PRD), Drizzle ORM       |
| Shared   | npm workspaces (`@acme/shared`) |
| Testing  | Vitest + Supertest              |

---

## Backend layers (target)

```
HTTP request
  → routes/              thin handlers
  → validators/          Zod request/response
  → services/            use cases (constructor-injected deps)
  → domain/              pure business rules
  → repositories/        interfaces + Drizzle implementations
  → db/                  schema, migrations, connection

container/               composition root (manual DI)
```

Cross-cutting: env validation (Zod), logging (Pino), error middleware, Helmet, CORS.

API prefix: `/api/*`

---

## Frontend layers

```
app/               routes, Server Components
components/        UI
lib/api/           typed HTTP client
lib/env.ts         validated config
```

Server Components fetch the backend directly. Client-side calls use `/api/backend/*` → backend `/api/*`.

---

## Database

- File: `backend/data/acme.db`
- Migrations: `backend/drizzle/` (version-controlled, run on startup)
- Tables: `employees`, `compensation_history` (append-only)
- PRAGMAs: WAL mode, foreign keys ON

---

## Key business rules

- **Append-only:** compensation history is insert-only
- **Display currency:** analytics convert all employees to a selected ISO currency using daily FX rates (see [ADR 001](./adr/001-daily-frankfurter-exchange-rates-and-display-currency.md)); native currencies are never blended without conversion
- **Import:** all-or-nothing transactional dry-run
- **AI:** intent → whitelisted analytics functions only (no dynamic SQL)

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

- **DB columns:** snake_case
- **API JSON:** camelCase
- **Tests:** TDD — see [engineering-standards.md](./engineering-standards.md)
