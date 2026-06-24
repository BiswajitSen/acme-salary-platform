# ACME Salary Platform

Production-ready monorepo scaffold for the ACME Salary Management MVP.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), TypeScript |
| Backend | Express, TypeScript, layered architecture |
| Database | SQLite with Drizzle ORM + versioned migrations |
| Shared | `@acme/shared` workspace for API contracts |

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

## Project structure

```
├── backend/
│   ├── drizzle/              # SQL migrations (version controlled)
│   ├── src/
│   │   ├── config/           # env validation, logging
│   │   ├── db/               # Drizzle schema + connection
│   │   ├── middleware/       # error handling
│   │   ├── routes/           # HTTP route definitions
│   │   ├── services/         # business logic
│   │   ├── app.ts            # Express app factory
│   │   └── server.ts         # entry point
│   └── tests/
├── frontend/
│   ├── app/                  # Next.js routes
│   ├── components/           # UI components
│   └── lib/                  # API client, env config
└── shared/                   # shared TypeScript types
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:backend` | Start API with hot reload |
| `npm run dev:frontend` | Start Next.js dev server |
| `npm test` | Run backend + frontend tests |
| `npm run lint` | Lint all packages |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:generate` | Generate migration from schema changes |
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

- Health check: `GET /api/health`
- Frontend proxy: `/api/backend/*` → backend `/api/*`

## Database

SQLite file: `backend/data/acme.db`

Schema (PRD-aligned):

- `employees` — id, full_name, department, job_title, country
- `compensation_history` — append-only salary events with FK to employees

Migrations run automatically on backend startup. WAL mode and foreign keys are enabled.

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/roadmap.md](./docs/roadmap.md) | Feature-wise build plan (phases 0–7) |
| [docs/engineering-standards.md](./docs/engineering-standards.md) | TDD, SOLID, DI, repository pattern |
| [docs/architecture.md](./docs/architecture.md) | Stack & layer diagram |
| [AGENTS.md](./AGENTS.md) | Instructions for AI coding agents |

**Backend:** layered routes → services → DB, Zod env validation, structured logging (Pino), Helmet security headers, centralized error handling, integration tests with Supertest.

**Frontend:** server components for data fetching, typed API client, shared contracts, route-level error boundary, env validation.

**Database:** Drizzle ORM schema-as-code, versioned migrations, indexed filter columns, append-only compensation history with FK constraints.
