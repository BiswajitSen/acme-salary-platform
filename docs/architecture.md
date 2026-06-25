# Architecture

## Decision: one repo (monorepo)

```
acme-salary-platform/
├── backend/    → Express API, domain logic, Drizzle + SQLite
├── frontend/   → Next.js App Router (HR UI)
├── shared/     → API contracts, Zod schemas, currency helpers
├── docs/       → PRD, roadmap, standards, ADRs
└── AGENTS.md   → AI agent entry point
```

See [engineering-standards.md](./engineering-standards.md) for SOLID, TDD, and DI patterns.  
See [roadmap.md](./roadmap.md) for feature delivery plan.  
See [adr/README.md](./adr/README.md) for architecture decision records.

### Diagram index

| Diagram | What it shows |
|---------|----------------|
| [Context](#context) | Users, platform, external FX API |
| [Monorepo](#monorepo-packages) | `backend`, `frontend`, `shared`, `docs` |
| [System overview](#system-overview) | End-to-end runtime components |
| [Backend request flow](#backend-request-flow) | Express layers & dependency direction |
| [Feature modules](#feature-modules) | HR features mapped to routes & services |
| [Analytics & insights](#analytics--insights-data-flow) | Dashboard cache + whitelisted insight executors |

---

## Context

Who interacts with the system and what it depends on externally.

```mermaid
flowchart LR
  HR["HR user\n(browser)"]

  subgraph Platform["ACME Salary Platform"]
    UI["Next.js frontend\n:3000"]
    API["Express API\n:8000"]
    DB[("SQLite\nacme.db")]
    UI <-->|"/api/backend/*"| API
    API --> DB
  end

  FX["Frankfurter API\n(daily FX rates)"]
  API -.->|"cached 24h"| FX

  HR --> UI
```

---

## Monorepo packages

```mermaid
flowchart TB
  subgraph Monorepo["acme-salary-platform/"]
    FE["frontend/\nNext.js App Router\nHR UI"]
    BE["backend/\nExpress + Drizzle\nAPI & domain logic"]
    SH["shared/\n@acme/shared\ncontracts & Zod schemas"]
    DOCS["docs/\nroadmap, standards,\nADRs, architecture"]
  end

  FE -->|"imports types"| SH
  BE -->|"imports types"| SH
  FE -->|"HTTP /api/backend/*"| BE
```

---

## System overview

```mermaid
flowchart TB
  subgraph Browser["Browser"]
    User[HR user]
  end

  subgraph Frontend["frontend/ (Next.js)"]
    AppRoutes["app/ — /, /employees, /employees/new, /analytics, /insights, /import"]
    Components["components/ — directory, employee-form, profile, analytics, insights"]
    Hooks["lib/hooks — data fetching, display currency"]
    AnalyticsCache["lib/analytics — view builder + session cache"]
    ApiClient["lib/api — typed HTTP client"]
  end

  subgraph Backend["backend/ (Express)"]
    Routes["routes/ — thin HTTP adapters"]
    Services["services/ — use cases"]
    Domain["domain/ — rules, insight parser & executors"]
    Repos["repositories/ — Drizzle implementations"]
    FxCache["cached Frankfurter FX provider"]
  end

  subgraph Data["Persistence"]
    SQLite[("SQLite — acme.db")]
  end

  subgraph Contracts["shared/ (@acme/shared)"]
    Types["Types, enums, Zod schemas"]
  end

  User --> AppRoutes
  AppRoutes --> Components
  Components --> Hooks
  Hooks --> ApiClient
  Hooks --> AnalyticsCache
  AnalyticsCache -.->|"5 min TTL, per-tab"| Hooks
  ApiClient -->|"GET/POST /api/backend/*"| Routes
  Routes --> Services
  Services --> Domain
  Services --> Repos
  Services --> FxCache
  Repos --> SQLite
  Routes -.-> Types
  ApiClient -.-> Types
```

Server Components may call the backend directly. Client components use the Next.js proxy at `/api/backend/*` → backend `/api/*`.

---

## Stack

| Layer    | Choice                          |
|----------|---------------------------------|
| Frontend | Next.js 16, TypeScript, Recharts |
| Backend  | Express, TypeScript             |
| Database | SQLite, Drizzle ORM             |
| Shared   | npm workspaces (`@acme/shared`) |
| FX rates | Frankfurter API (cached 24h)    |
| Testing  | Vitest + Supertest              |

---

## Backend request flow

How an HTTP request moves through the backend. Business rules stay in `domain/`; SQL stays in `repositories/`.

```mermaid
flowchart TB
  Client["Client\n(Next.js / curl)"]

  subgraph Express["backend/"]
    Routes["routes/\nHTTP adapters"]
    Validators["validators/\nZod (shared schemas)"]
    Services["services/\nuse cases"]
    Domain["domain/\nrules, insight parser & executors"]
    Repos["repositories/\ninterfaces + Drizzle"]
    DB["db/\nschema & migrations"]
    Container["container/\nmanual DI wiring"]
  end

  Client -->|"GET/POST /api/*"| Routes
  Routes --> Validators
  Routes --> Services
  Services --> Domain
  Services --> Repos
  Repos --> DB
  Container -.->|"injects"| Routes
  Container -.->|"injects"| Services
  Container -.->|"injects"| Repos
```

Cross-cutting: env validation (Zod), logging (Pino), error middleware, Helmet, CORS.

API prefix: `/api/*`

### API surface (MVP)

| Area | Endpoints |
|------|-----------|
| Health | `GET /api/health` |
| Employees | `GET /api/employees`, `POST /api/employees`, `GET /api/employees/:id`, `PATCH /api/employees/:id`, `DELETE /api/employees/:id`, compensation timeline & `POST` history |
| Import | `POST /api/import/preview`, `confirm`; `POST /api/import/compensation/*` |
| Analytics | `GET /api/analytics/currencies`, `summary`, `departments`, `top-earners` |
| AI Insights | `POST /api/insights/parse`, `POST /api/insights/execute` |

---

## Frontend layers

```
app/                   routes (App Router)
components/            feature UI (directory, employee-form, profile, analytics, insights, import)
lib/api/               typed HTTP client
lib/hooks/             client state (display currency, dashboards, insights)
lib/analytics/         dashboard view model, charts, session cache
lib/env.ts             validated config
```

### Application routes

| Path | Purpose |
|------|---------|
| `/` | Employee directory (search, filters, KPIs) |
| `/employees/new` | Add employee form |
| `/employees/:id` | Compensation profile — edit/delete employee, record change |
| `/analytics` | Executive analytics dashboard |
| `/insights` | Natural-language compensation queries |
| `/import` | Employee spreadsheet import |
| `/import/compensation` | Compensation spreadsheet import |

Display currency is a global preference (persisted in `localStorage`) used by Analytics, directory salary display, and AI Insights.

---

## Feature modules

How major HR capabilities map across UI routes, API routers, and services.

```mermaid
flowchart LR
  subgraph UI["Frontend routes"]
    R1["/ — Directory"]
    R1a["/employees/new — Add employee"]
    R2["/employees/:id — Profile"]
    R3["/analytics"]
    R4["/insights"]
    R5["/import"]
    R6["/import/compensation"]
  end

  subgraph API["API routers"]
    A1["/employees"]
    A2["/analytics"]
    A3["/insights"]
    A4["/import"]
    A5["/import/compensation"]
  end

  subgraph Services["Services"]
    S1["EmployeeService\nCompensationService"]
    S2["AnalyticsService\nInsightAnalyticsService"]
    S3["AiInsightsService"]
    S4["EmployeeImportService\nCompensationImportService"]
  end

  R1 --> A1 --> S1
  R1a --> A1 --> S1
  R2 --> A1 --> S1
  R3 --> A2 --> S2
  R4 --> A3 --> S3
  S3 --> S2
  R5 --> A4 --> S4
  R6 --> A5 --> S4
```

---

## Analytics & insights data flow

```mermaid
flowchart LR
  subgraph AnalyticsUI["Analytics dashboard"]
    Hook["useAnalyticsDashboard"]
    Cache["analytics-dashboard-cache"]
    View["buildAnalyticsDashboardView"]
  end

  subgraph AnalyticsAPI["Backend analytics"]
    Summary["/analytics/summary"]
    Depts["/analytics/departments"]
    Top["/analytics/top-earners"]
    Employees["GET /employees (paginated)"]
  end

  subgraph InsightsUI["AI Insights"]
    Parser["parse query"]
    Execute["execute intent"]
  end

  subgraph InsightsDomain["domain/insights"]
    Intents["intent patterns"]
    Executors["whitelisted executors"]
  end

  Hook --> Cache
  Cache -->|cache miss| Summary
  Cache -->|cache miss| Depts
  Cache -->|cache miss| Top
  Cache -->|cache miss| Employees
  Summary --> View
  Depts --> View
  Top --> View
  Employees --> View

  Parser --> Intents
  Execute --> Executors
  Executors --> AnalyticsAPI
```

- **Analytics:** server aggregates (summary, departments, top earners) plus client-derived charts from the employee list. FX conversion uses daily rates ([ADR 001](./adr/001-daily-frankfurter-exchange-rates-and-display-currency.md)). Repeat visits reuse a **5-minute session cache** ([ADR 002](./adr/002-analytics-dashboard-client-session-cache.md)).
- **AI Insights:** rule-based intent parser (no LLM SQL). Each intent maps to a whitelisted executor that calls the same analytics repositories — no dynamic SQL.

---

## Database

- File: `backend/data/acme.db`
- Migrations: `backend/drizzle/` (version-controlled, run on startup)
- Tables: `employees`, `compensation_history` (append-only)
- PRAGMAs: WAL mode, foreign keys ON

---

## Key business rules

- **Employee master data:** create (`POST`), update (`PATCH`), and delete (`DELETE`) via `EmployeeService`. Employee ID is immutable after creation. Delete is rejected when compensation history exists (FK + service guard).
- **Append-only:** compensation history is insert-only
- **Display currency:** analytics convert all employees to a selected ISO currency using daily FX rates (see [ADR 001](./adr/001-daily-frankfurter-exchange-rates-and-display-currency.md)); native currencies are never blended without conversion
- **Analytics dashboard cache:** the frontend keeps a session-scoped in-memory cache of dashboard data to avoid refetching on every navigation (see [ADR 002](./adr/002-analytics-dashboard-client-session-cache.md))
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
