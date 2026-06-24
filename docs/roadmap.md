# ACME Salary Platform — Feature Roadmap

MVP delivery plan aligned with the [PRD](./ACME_Salary_Management_PRD_Final.pdf).  
Each feature follows **TDD**: failing test → minimal implementation → refactor.

**Legend:** ✅ Done · 🔄 In progress · ⬜ Not started

---

## Phase 0 — Scaffold ✅

| Item | Deliverable |
|------|-------------|
| Monorepo | `backend`, `frontend`, `shared` workspaces |
| Database | Drizzle schema + migrations (`employees`, `compensation_history`) |
| API shell | Express layers, health check, error handling |
| Frontend shell | Next.js App Router, typed API client |

---

## Phase 1 — Engineering Foundation ✅

**Goal:** Patterns every feature will reuse.

| # | Feature | Backend | Frontend | Tests (write first) | Status |
|---|---------|---------|----------|---------------------|--------|
| 1.1 | DI container | `container/index.ts` wires repos → services → routes | — | Container resolves mocked deps in tests | ✅ |
| 1.2 | Repository layer | `IEmployeeRepository` + Drizzle impl | — | In-memory SQLite repo tests | ✅ |
| 1.3 | Seed script | `db/seed.ts` — sample employees | — | Seed is idempotent | ✅ |
| 1.4 | CI pipeline | GitHub Actions: typecheck, lint, test, build | — | Pipeline fails on red tests | ✅ |
| 1.5 | Shared API schemas | Zod schemas in `@acme/shared` for request/response | — | Schema parse tests | ✅ |

**Exit criteria:** One vertical slice (`GET /api/employees`) built entirely with DI + repo + TDD. ✅

---

## Phase 2 — Employee Directory (PRD §4.1) ✅

**Goal:** Paginated, searchable, filterable grid for 10k employees (< 2s).

| # | Feature | API | UI | Tests (write first) | Status |
|---|---------|-----|----|---------------------|--------|
| 2.1 | List employees | `GET /api/employees?page&limit&search&country&department&jobTitle` | Directory page + virtualized table | Pagination defaults to 50; max enforced | ✅ |
| 2.2 | Server-side search | Search by `fullName` or `id` (indexed) | Search input with debounce | Partial match, empty query | ✅ |
| 2.3 | Multi-filter | Filter by country, department, job title | Filter dropdowns | Combined filters AND correctly | ✅ |
| 2.4 | Performance | DB indexes verified; `idx_employees_full_name` added | List virtualization (`@tanstack/react-virtual`) | Repository + integration tests | ✅ |

**Exit criteria:** HR can find any employee by name or ID in under 2 seconds.

---

## Phase 3 — Compensation Profile (PRD §4.2) ✅

**Goal:** Employee detail page with current comp + full timeline.

| # | Feature | API | UI | Tests (write first) | Status |
|---|---------|-----|----|---------------------|--------|
| 3.1 | Employee profile | `GET /api/employees/:id` | Summary cards (ID, name, dept, title, country) | 404 for unknown ID | ✅ |
| 3.2 | Current compensation | Derived: latest `compensation_history` by `effective_date` | Metric highlights (salary, currency, last updated) | Employee with no history | ✅ |
| 3.3 | Salary timeline | `GET /api/employees/:id/compensation` | Chronological grid (prev → new, reason, actor, date) | Ordered newest-first | ✅ |

**Exit criteria:** Clicking a directory row opens a complete compensation profile. Timeline order: **newest effective date first** (`COMPENSATION_TIMELINE_ORDER` in `@acme/shared`).

---

## Phase 4 — Compensation Management (PRD §4.3) ✅

**Goal:** Append-only audit trail. **Never** UPDATE/DELETE history rows.

| # | Feature | API | UI | Tests (write first) | Status |
|---|---------|-----|----|---------------------|--------|
| 4.1 | Record change | `POST /api/employees/:id/compensation` | "Record change" form | Valid reason enum enforced | ✅ |
| 4.2 | Validation | Zod: salary > 0, ISO currency, effective date, reason, changedBy | Inline field errors | Reject negative salary, invalid currency | ✅ |
| 4.3 | Immutability guard | Repository exposes `insert` only for history | — | **No update/delete methods exist**; test attempts fail | ✅ |
| 4.4 | Currency rule | Service rejects cross-currency aggregation in single response | UI groups by currency | Cannot sum USD + EUR in one total | ✅ |

**Exit criteria:** Every compensation change creates a new history row; history is never mutated.

---

## Phase 5 — Analytics Dashboard (PRD §4.4) ⬜

**Goal:** Real-time metrics, grouped by currency only.

| # | Feature | API | UI | Tests (write first) |
|---|---------|-----|----|---------------------|
| 5.1 | Headcount | `GET /api/analytics/summary?currency=USD` | KPI card | Per-currency count |
| 5.2 | Total payroll | Sum of latest comp per employee, per currency | KPI card | Excludes stale history rows |
| 5.3 | Avg / median | By department + currency | Bar/table charts | Correct stats for known seed |
| 5.4 | Top 10 earners | Per currency | Ranked list | Exactly 10, ties handled |
| 5.5 | Performance | Whitelisted SQL via `AnalyticsRepository` | Dashboard < 2s @ 10k | Benchmark test |

**Exit criteria:** Leadership dashboard loads in under 2 seconds with 10k employees.

---

## Phase 6 — Spreadsheet Import (PRD §4.5) ✅

**Goal:** All-or-nothing `.xlsx` import with dry-run preview.

| # | Feature | API | UI | Tests (write first) | Status |
|---|---------|-----|----|---------------------|--------|
| 6.1 | Parse xlsx | `POST /api/import/preview` | File upload | Valid fixture parses | ✅ |
| 6.2 | Validation pipeline | Duplicate IDs, invalid ISO currency, negative salary, missing ID, empty date | Stoplight preview grid | One test per rejection rule | ✅ |
| 6.3 | Dry-run | Validate only; no DB writes | "All Clear" vs error view | Invalid file → 0 rows imported | ✅ |
| 6.4 | Confirm import | `POST /api/import/confirm` in transaction | Confirm button (disabled until valid) | Upsert by employee ID; rollback on any error | ✅ |
| 6.5 | Idempotent upsert | Employee ID as key | — | Re-import same file is safe | ✅ |

**Exit criteria:** 100% valid file imports; any invalid row blocks entire import.

---

## Phase 7 — AI Insights (PRD §4.6) ⬜

**Goal:** Natural language → safe, whitelisted analytics. **No raw SQL from AI.**

| # | Feature | API | UI | Tests (write first) |
|---|---------|-----|----|---------------------|
| 7.1 | Intent parser | Map phrases → enum intents | Chat / query input | "avg salary in Engineering" → `AVG_DEPT_SALARY` |
| 7.2 | Whitelisted executors | One function per intent; parameterized queries only | Result display | Unknown intent → graceful error |
| 7.3 | Safety | Read-only DB access; no string interpolation in SQL | — | Injection-style inputs rejected |

**Exit criteria:** HR asks plain-English questions; system never executes unstructured SQL.

---

## Out of scope (PRD §5)

Do **not** build in MVP:

- Payroll / payslips / bank transfers
- Timesheets, leave, recruitment, self-service portal
- Multi-role RBAC or approval workflows

---

## Suggested build order

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7
          └─ first user-visible value
                              └─ core business rules
                                        └─ leadership value
                                                  └─ onboarding
                                                            └─ nice-to-have
```

**Next up:** Phase 1.1–1.5, then Phase 2.1 (employee list API).

---

## Definition of Done (every feature)

- [ ] Tests written **before** implementation (TDD)
- [ ] Service depends on interfaces, not concrete DB
- [ ] Zod validates API input/output
- [ ] Types exported from `@acme/shared`
- [ ] No business logic in route handlers
- [ ] PRD business rule covered by at least one test
- [ ] `npm test`, `npm run lint`, `npm run typecheck` pass
