# AGENTS.md

Instructions for AI coding agents working on **ACME Salary Platform**.

## Read first

1. [docs/PRD](./docs/ACME_Salary_Management_PRD_Final.pdf) — product requirements  
2. [docs/roadmap.md](./docs/roadmap.md) — what to build next  
3. [docs/engineering-standards.md](./docs/engineering-standards.md) — **how** to build (TDD, SOLID, DI)  
4. [docs/architecture.md](./docs/architecture.md) — stack & repo layout  

## Non-negotiables

- **TDD:** Write failing tests before implementation (Red → Green → Refactor).
- **SOLID:** Single-purpose modules; depend on interfaces, not concretions.
- **DI:** Constructor injection; wire dependencies only in `backend/src/container/`.
- **Layers:** routes → services → repositories → db. No business logic in routes or React components.
- **Append-only compensation:** Never UPDATE/DELETE `compensation_history`. Repository exposes `insert` only.
- **Currency rule:** Never aggregate across currencies in one metric.
- **Shared types:** Put enums and API contracts in `@acme/shared`.
- **Validate:** Zod for all API input/output.

## Stack

Monorepo: `backend` (Express + Drizzle + SQLite), `frontend` (Next.js App Router), `shared`.

## Commands (from repo root)

```bash
npm install
npm test
npm run lint
npm run typecheck
npm run dev:backend   # :8000
npm run dev:frontend  # :3000
```

## Current status

Phase 0 complete (scaffold). **Next:** Phase 1 in roadmap — DI container, repositories, seed, then employee list API.

## When implementing a feature

1. Find the phase/item in `docs/roadmap.md`.
2. Write tests listed in that row first.
3. Follow patterns in `docs/engineering-standards.md`.
4. Update roadmap checkbox when done.
