# Submission notes

This document is a short guide for reviewers evaluating the ACME Salary Platform assignment.

## What was built

An HR compensation management MVP covering:

| Area | Delivered |
|------|-----------|
| **Employee directory** | Search, column filters, KPI cards, virtualized table, display-currency salaries |
| **Employee CRUD** | Create, edit, delete (delete blocked when compensation history exists) |
| **Compensation profiles** | Timeline, record changes with server-side validation (effective date, increase reasons) |
| **Imports** | Employee and compensation `.xlsx` upload with dry-run preview |
| **Analytics** | Executive dashboard with FX conversion and session cache |
| **Insights** | Plain-English questions via rule-based parser (no LLM, no dynamic SQL) |

## Architecture highlights

- **Monorepo:** `backend` (Express), `frontend` (Next.js), `shared` (Zod contracts)
- **Layered backend:** routes → services → domain → repositories
- **Postgres + Drizzle:** versioned migrations, append-only `compensation_history`
- **TDD:** unit, service, repository, integration, and frontend tests
- **ADRs:** daily FX rates ([001](./docs/adr/001-daily-frankfurter-exchange-rates-and-display-currency.md)), analytics session cache ([002](./docs/adr/002-analytics-dashboard-client-session-cache.md))

See [docs/architecture.md](./docs/architecture.md) for diagrams.

## How to run (reviewer quick start)

```bash
npm install
docker-compose up -d
npm run db:reset -w backend
npm run dev:backend   # terminal 1 → http://localhost:8000
npm run dev:frontend  # terminal 2 → http://localhost:3000
```

Open **http://localhost:3000**. Sample data: 3 employees with compensation history.

Run the full test suite:

```bash
npm test
```

## Key design decisions

1. **Append-only compensation** — salary history is never updated or deleted; audit trail is preserved.
2. **Shared validation** — Zod schemas and business rules live in `@acme/shared` where possible.
3. **Display currency** — analytics convert to a selected ISO currency using daily Frankfurter rates; raw multi-currency totals are never blended.
4. **Insights safety** — natural-language queries map to whitelisted executors, not raw SQL.
5. **Import safety** — spreadsheet rows are fully validated before any write.

## Known MVP limits (intentional scope)

| Limit | Notes |
|-------|-------|
| **No authentication** | Suitable for demo/assignment; production would need login and RBAC |
| **No audit log UI** | Compensation changes are stored; no separate admin audit view |
| **Single-tenant** | No org/tenant model |

## Suggested next steps (if this were production)

1. Authentication and role-based access (HR admin vs read-only leadership)
2. Audit log for employee master-data changes
3. Stronger backdating rules for compensation (validate against later records)
4. CI pipeline (lint, test, migrate check on every PR)
5. Observability (structured logs → metrics/traces)

## Optional: deployed demo

The repo includes a [Render blueprint](./render.yaml) for API + frontend with Neon Postgres. After deploy, seed once:

```bash
DATABASE_URL="postgresql://..." npm run db:seed -w backend
```
