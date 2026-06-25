# ACME Salary Platform

HR compensation management MVP: employee directory, employee CRUD, compensation profiles, executive analytics, natural-language insights, and spreadsheet import. Built as a TypeScript monorepo with TDD and layered backend architecture.

> **For reviewers:** see [SUBMISSION.md](./SUBMISSION.md) for a quick evaluation guide, architecture summary, and known MVP limits.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), TypeScript, Recharts |
| Backend | Express, layered architecture (routes → services → domain → repositories) |
| Database | PostgreSQL 16 with Drizzle ORM + versioned migrations |
| Shared | `@acme/shared` — API contracts, Zod schemas, currency conversion |
| FX | Frankfurter daily rates (cached; see [ADR 001](./docs/adr/001-daily-frankfurter-exchange-rates-and-display-currency.md)) |

## Prerequisites

- Node.js 20+ (see `.nvmrc`)
- Docker with `docker-compose` (local Postgres)

## Quick start

From the project root:

```bash
npm install
docker-compose up -d
npm run db:reset -w backend   # migrate + seed sample data
cp backend/.env.example backend/.env          # optional overrides
cp frontend/.env.example frontend/.env.local
npm run dev:backend   # terminal 1 → http://localhost:8000
npm run dev:frontend  # terminal 2 → http://localhost:3000
```

Open **http://localhost:3000** — use the header to navigate between Directory, Analytics, Insights, and Import flows.

**Note:** If `backend/.env` is not present, the API uses the default local Postgres URL (`postgresql://acme:acme@localhost:5433/acme_salary`). Copy `.env.example` only when you need to override settings (e.g. a hosted Neon database).

Architecture diagrams (Mermaid): [docs/architecture.md](./docs/architecture.md)

## Application features

| Route | Feature |
|-------|---------|
| `/` | Employee directory — search, column filters, KPIs, avatars, display-currency salaries (click any row to open profile) |
| `/employees/new` | Add employee — form with validation and dropdowns for department, job title, country |
| `/employees/:id` | Compensation profile — summary, edit/delete employee, timeline, record change form |
| `/analytics` | Executive dashboard — KPIs, charts, heatmap, filters, session-cached data |
| `/insights` | Insights — plain-English compensation questions (rule-based parser, no raw SQL) |
| `/import` | Employee `.xlsx` import with dry-run preview |
| `/import/compensation` | Compensation history `.xlsx` import |

Global **display currency** (header selector) converts salaries for analytics, directory, and insights.

## Project structure

```
├── backend/
│   ├── drizzle/                 # SQL migrations
│   ├── src/
│   │   ├── container/           # DI composition root
│   │   ├── domain/              # business rules + insights parser/executors
│   │   ├── repositories/        # interfaces + Drizzle implementations
│   │   ├── services/            # use cases (employees, analytics, insights, import)
│   │   ├── routes/              # Express routers
│   │   ├── config/              # env validation, logging
│   │   └── db/                  # schema, seed, migrations
│   └── tests/                   # integration tests (Supertest)
├── frontend/
│   ├── app/                     # Next.js routes
│   ├── components/              # UI by feature (directory, analytics, insights, …)
│   └── lib/
│       ├── api/                   # typed HTTP client
│       ├── hooks/                 # client data hooks
│       └── analytics/             # dashboard view model + session cache
├── shared/                      # shared types & Zod schemas
├── docker-compose.yml           # local Postgres (port 5433)
└── docs/                        # roadmap, standards, architecture, ADRs
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:backend` | Start API with hot reload |
| `npm run dev:frontend` | Start Next.js dev server |
| `npm test` | Run shared + backend + frontend tests |
| `npm run lint` | Lint all packages |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Seed sample employees + compensation |
| `npm run db:reset` | Reset local Docker DB, migrate, and seed |
| `npm run db:generate` | Generate migration from schema changes |
| `npm run db:generate-spreadsheet -w backend` | Generate 10k-row employee `.xlsx` fixture |
| `npm run db:generate-compensation-spreadsheet -w backend` | Generate matching 10k-row compensation `.xlsx` fixture |
| `npm run db:generate-fixtures -w backend` | Generate both employee and compensation fixtures |
| `npm run db:import -w backend -- <path>` | Import employees from Excel (CLI) |
| `npm run typecheck` | Type-check backend + frontend |

## Troubleshooting

**Red squiggles in `backend/tests/`** — open the `backend/` folder in your editor, or ensure it uses `tsconfig.test.json` (see `backend/.vscode/settings.json`).

**Next.js lockfile warnings in monorepo** — already suppressed via `NEXT_IGNORE_INCORRECT_LOCKFILE=1` in frontend scripts. Run `npm install` only from the **project root**, not inside `backend/` or `frontend/`.

**`unknown shorthand flag: 'T' in -T`** — use `docker-compose` (this project’s scripts already do). The Docker Compose V2 plugin (`docker compose`) is not required.

**`relation "employees" does not exist` after reset** — run the full reset (not just seed). `db:reset` drops both `public` and `drizzle` schemas so migrations re-apply:

```bash
docker-compose up -d
npm run db:reset -w backend
```

**Seed/migrate against a remote database (Neon, etc.):**

```bash
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require" npm run db:migrate -w backend
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require" npm run db:seed -w backend
```

## API

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Health check |
| `GET /api/employees` | Paginated directory (search & filters) |
| `POST /api/employees` | Create employee (409 if ID exists) |
| `GET /api/employees/:id` | Employee profile |
| `PATCH /api/employees/:id` | Update employee fields (ID immutable) |
| `DELETE /api/employees/:id` | Delete employee (409 if compensation history exists) |
| `GET/POST /api/employees/:id/compensation` | Timeline / record change |
| `POST /api/import/preview`, `/confirm` | Employee import |
| `POST /api/import/compensation/preview`, `/confirm` | Compensation import |
| `GET /api/analytics/*` | Summary, departments, top earners, currencies |
| `POST /api/insights/parse`, `/execute` | Insights (natural-language queries) |

Frontend proxy: `/api/backend/*` → backend `/api/*`

## Database

**Local:** Docker Postgres 16 via `docker-compose.yml` — host `localhost`, port `5433`, database `acme_salary`, user/password `acme`.

**Hosted:** Set `DATABASE_URL` on the API service (see [render.yaml](./render.yaml) for Render + Neon).

Schema (PRD-aligned):

- `employees` — id, full_name, department, job_title, country
- `compensation_history` — append-only salary events with FK to employees (range-partitioned by effective month)

Migrations run automatically on backend startup and are version-controlled in `backend/drizzle/`.

Integration tests use a separate database: `acme_salary_test` (created by `docker/postgres/init-test-db.sql`).

### Bulk import from Excel

Generate a 10,000-row employee and compensation fixture, then import through the HR UI or CLI:

```bash
npm run db:generate-fixtures -w backend
npm run db:import -w backend -- fixtures/employees-10000.xlsx
```

Import employees first, then upload `fixtures/compensation-10000.xlsx` from **Import Compensation** in the header.

Expected employee columns (header aliases supported): `employee_id`, `full_name`, `department`, `job_title`, `country`. Import validates all rows before writing; duplicate employee IDs are rejected. Re-importing the same file upserts by employee ID.

### Employee management

**Add:** use **Add employee** on the directory or open `/employees/new`. Employee ID is set at creation and cannot be changed later.

**Edit:** on `/employees/:id`, click **Edit employee** to update name, department, job title, or country.

**Delete:** click **Delete employee** on the profile. Deletion is blocked when the employee has compensation history (append-only audit trail must be preserved).

```bash
curl -X POST http://localhost:8000/api/employees \
  -H "Content-Type: application/json" \
  -d '{"id":"E010","fullName":"Jane Doe","department":"Engineering","jobTitle":"Engineer","country":"US"}'

curl -X PATCH http://localhost:8000/api/employees/E010 \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Jane Smith","department":"Engineering","jobTitle":"Senior Engineer","country":"US"}'

curl -X DELETE http://localhost:8000/api/employees/E010
```

### Employee compensation profile

Click any row in the directory to open `/employees/:id` — summary cards, current salary, and a newest-first compensation timeline.

Use the **Record compensation change** form on the profile page to append a new history row (salary, currency, effective date, reason, changed by). Changes are validated server-side and never update existing history rows.

```bash
curl -X POST http://localhost:8000/api/employees/E001/compensation \
  -H "Content-Type: application/json" \
  -d '{"baseSalary":140000,"currency":"USD","effectiveDate":"2026-06-01","reason":"Promotion","changedBy":"HR Admin"}'
```

## Deployment (optional)

A [Render blueprint](./render.yaml) deploys the API and frontend. Provide a hosted `DATABASE_URL` (e.g. Neon), then seed once from your machine:

```bash
DATABASE_URL="postgresql://..." npm run db:seed -w backend
```

## Documentation

| Doc | Purpose |
|-----|---------|
| [SUBMISSION.md](./SUBMISSION.md) | **Reviewer guide** — scope, quick start, trade-offs |
| [docs/architecture.md](./docs/architecture.md) | **Mermaid architecture diagrams** — context, layers, features, data flows |
| [docs/roadmap.md](./docs/roadmap.md) | Feature-wise build plan (phases 0–8) |
| [docs/engineering-standards.md](./docs/engineering-standards.md) | TDD, SOLID, DI, repository pattern |
| [docs/adr/README.md](./docs/adr/README.md) | Architecture decision records (FX, analytics cache) |
| [AGENTS.md](./AGENTS.md) | Instructions for AI coding agents |

**Backend:** layered routes → services → domain → repositories, Zod validation, structured logging (Pino), Helmet, centralized error handling, integration tests with Supertest.

**Frontend:** App Router, typed API client, feature hooks, analytics session cache ([ADR 002](./docs/adr/002-analytics-dashboard-client-session-cache.md)), shared contracts.

**Database:** PostgreSQL, Drizzle ORM schema-as-code, versioned migrations, indexed filter columns, append-only compensation history with FK constraints.
