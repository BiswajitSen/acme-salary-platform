# ACME Salary Platform

HR compensation management MVP: employee directory, compensation profiles, executive analytics, natural-language insights, and spreadsheet import. Built as a TypeScript monorepo with TDD and layered backend architecture.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), TypeScript, Recharts |
| Backend | Express, layered architecture (routes → services → domain → repositories) |
| Database | SQLite with Drizzle ORM + versioned migrations |
| Shared | `@acme/shared` — API contracts, Zod schemas, currency conversion |
| FX | Frankfurter daily rates (cached; see [ADR 001](./docs/adr/001-daily-frankfurter-exchange-rates-and-display-currency.md)) |

## Prerequisites

- Node.js 20+

## Quick start

From the project root:

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
npm run dev:backend   # terminal 1 → http://localhost:8000
npm run dev:frontend  # terminal 2 → http://localhost:3000
```

Open **http://localhost:3000** — use the header to navigate between Directory, Analytics, AI Insights, and Import flows.

Architecture diagrams (Mermaid): [docs/architecture.md](./docs/architecture.md)

## Application features

| Route | Feature |
|-------|---------|
| `/` | Employee directory — search, column filters, KPIs, avatars, display-currency salaries |
| `/employees/:id` | Compensation profile — current salary, timeline, record change form |
| `/analytics` | Executive dashboard — KPIs, charts, heatmap, filters, session-cached data |
| `/insights` | AI Insights — plain-English compensation questions (rule-based parser, no raw SQL) |
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
| `npm run db:generate` | Generate migration from schema changes |
| `npm run db:seed` | Seed sample employees (backend workspace) |
| `npm run db:generate-spreadsheet -w backend` | Generate 10k-row employee `.xlsx` fixture |
| `npm run db:generate-compensation-spreadsheet -w backend` | Generate matching 10k-row compensation `.xlsx` fixture |
| `npm run db:generate-fixtures -w backend` | Generate both employee and compensation fixtures |
| `npm run db:import -w backend -- <path>` | Import employees from Excel (CLI) |
| `npm run typecheck` | Type-check backend + frontend |

## Troubleshooting

**Red squiggles in `backend/tests/`** — open the `backend/` folder in your editor, or ensure it uses `tsconfig.test.json` (see `backend/.vscode/settings.json`).

**Next.js lockfile warnings in monorepo** — already suppressed via `NEXT_IGNORE_INCORRECT_LOCKFILE=1` in frontend scripts. Run `npm install` only from the **project root**, not inside `backend/` or `frontend/`.

**Backend fails on startup with `table employees already exists`** — your SQLite file predates Drizzle migration tracking. Either restart (auto-baseline is applied) or reset cleanly:

```bash
npm run db:reset -w backend
npm run db:seed -w backend
npm run dev:backend
```

## API

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Health check |
| `GET /api/employees` | Paginated directory (search & filters) |
| `GET /api/employees/:id` | Employee profile |
| `GET/POST /api/employees/:id/compensation` | Timeline / record change |
| `POST /api/import/preview`, `/confirm` | Employee import |
| `POST /api/import/compensation/preview`, `/confirm` | Compensation import |
| `GET /api/analytics/*` | Summary, departments, top earners, currencies |
| `POST /api/insights/parse`, `/execute` | AI Insights |

Frontend proxy: `/api/backend/*` → backend `/api/*`

## Database

SQLite file: `backend/data/acme.db`

Schema (PRD-aligned):

- `employees` — id, full_name, department, job_title, country
- `compensation_history` — append-only salary events with FK to employees

Migrations run automatically on backend startup. WAL mode and foreign keys are enabled.

### Bulk import from Excel

Generate a 10,000-row employee and compensation fixture, then import through the HR UI or CLI:

```bash
npm run db:generate-fixtures -w backend
npm run db:import -w backend -- fixtures/employees-10000.xlsx
```

Import employees first, then upload `fixtures/compensation-10000.xlsx` from **Import Compensation** in the header.

Expected employee columns (header aliases supported): `employee_id`, `full_name`, `department`, `job_title`, `country`. Import validates all rows before writing; duplicate employee IDs are rejected. Re-importing the same file upserts by employee ID.

### Employee compensation profile

Click any row in the directory to open `/employees/:id` — summary cards, current salary, and a newest-first compensation timeline.

Use the **Record compensation change** form on the profile page to append a new history row (salary, currency, effective date, reason, changed by). Changes are validated server-side and never update existing history rows.

```bash
curl -X POST http://localhost:8000/api/employees/E001/compensation \
  -H "Content-Type: application/json" \
  -d '{"baseSalary":140000,"currency":"USD","effectiveDate":"2026-06-01","reason":"Promotion","changedBy":"HR Admin"}'
```

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/architecture.md](./docs/architecture.md) | **Mermaid architecture diagrams** — context, layers, features, data flows |
| [docs/roadmap.md](./docs/roadmap.md) | Feature-wise build plan (phases 0–7) |
| [docs/engineering-standards.md](./docs/engineering-standards.md) | TDD, SOLID, DI, repository pattern |
| [docs/adr/README.md](./docs/adr/README.md) | Architecture decision records (FX, analytics cache) |
| [AGENTS.md](./AGENTS.md) | Instructions for AI coding agents |

**Backend:** layered routes → services → domain → repositories, Zod validation, structured logging (Pino), Helmet, centralized error handling, integration tests with Supertest.

**Frontend:** App Router, typed API client, feature hooks, analytics session cache ([ADR 002](./docs/adr/002-analytics-dashboard-client-session-cache.md)), shared contracts.

**Database:** Drizzle ORM schema-as-code, versioned migrations, indexed filter columns, append-only compensation history with FK constraints.
