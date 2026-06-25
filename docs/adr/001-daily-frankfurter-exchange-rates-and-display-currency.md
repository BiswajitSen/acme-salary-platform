# ADR 001: Daily Frankfurter exchange rates and display currency

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-24 |
| **Deciders** | Engineering |

## Context

Analytics and AI Insights compare compensation across employees who are paid in different native currencies (USD, GBP, EUR, INR, SGD). Leadership needs org-wide metrics—total payroll, department averages, top earners—in a **single selected display currency**, not siloed per native currency.

Early implementation used hard-coded exchange rates in `@acme/shared`. That was acceptable for tests but unsuitable for production: rates drift daily, and hard-coded values would become stale and misleading.

Requirements:

- Convert all employee salaries to the user-selected display currency before aggregating.
- Use realistic, maintainable exchange rates in production.
- Keep tests deterministic (no network calls in CI).
- Degrade gracefully when the rate provider is unavailable.
- Surface the rate date (`exchangeRatesAsOf`) so users know how fresh conversions are.

## Decision

### 1. Display currency (not native-currency filtering)

`?currency=USD` and the UI display-currency selector mean **“show all employees, converted to USD”**, not “only include employees paid in USD.” Conversion happens in SQL via `buildConvertedSalarySql()` using a shared `ratesToUsd` map.

Supported display currencies are fixed in code: `USD`, `GBP`, `EUR`, `INR`, `SGD`.

### 2. Frankfurter as the production rate source

Production and development fetch daily USD-base rates from the [Frankfurter API](https://www.frankfurter.app/) (`FRANKFURTER_API_URL`, default `https://api.frankfurter.app`).

`FrankfurterExchangeRateProvider` calls `/latest?from=USD&to=GBP,EUR,INR,SGD` and converts Frankfurter’s “units per USD” into our internal **rate-to-USD** multipliers via `buildRatesToUsdFromFrankfurterResponse()`.

### 3. 24-hour in-memory cache with stale fallback

`CachedExchangeRateProvider` wraps the Frankfurter provider:

- **TTL:** 24 hours (one refresh per day per process).
- **On refresh failure:** return the last successfully cached snapshot.
- **On first fetch failure:** propagate the error (no snapshot yet).

This avoids hammering Frankfurter, keeps analytics fast, and keeps the app usable during brief API outages.

### 4. Fixed rates in test mode

When `NODE_ENV=test`, `createExchangeRateProvider()` returns `FixedExchangeRateProvider` with `TEST_EXCHANGE_RATES_TO_USD` and a fixed `asOf` date (`2026-01-01`). Integration and unit tests never hit the network.

### 5. API contract: `exchangeRatesAsOf`

All analytics and insight execute responses include `exchangeRatesAsOf` (ISO date string from the rate snapshot). The frontend shows “FX rates as of {date}” on the Analytics dashboard and AI Insights result panel.

### 6. Global display-currency selector

A **Display currency** dropdown in the site header sets the org-wide comparison currency on every page. State lives in a shared React context (`DisplayCurrencyProvider`) so changing the selector immediately refreshes Analytics, employee profiles, and AI Insights without a full page reload. The choice also persists in `localStorage`.

## Consequences

### Positive

- Production rates stay current without manual updates.
- Tests remain fast, deterministic, and offline.
- Stale-cache fallback improves resilience.
- Users see the rate date alongside converted figures.
- One display-currency control drives consistent conversion across analytics screens.

### Negative / trade-offs

- **In-memory cache** is per backend process; multiple instances each maintain their own cache (acceptable at current scale; can move to Redis later if needed).
- **Frankfurter dependency:** extended outage on first boot (no cache) blocks conversion until rates are available.
- **Fixed currency list:** adding a display currency requires code changes in shared constants, Frankfurter symbol list, and tests.
- **Daily granularity:** intraday FX moves are ignored by design (leadership reporting, not trading).

## Alternatives considered

| Alternative | Why not chosen |
|-------------|----------------|
| Hard-coded rates in production | Becomes stale; operational burden to update |
| npm FX math library only (no API) | Still needs a live rate feed; Frankfurter is free and simple |
| Real-time rates (sub-hourly) | Unnecessary for salary analytics; adds cost and complexity |
| Filter by native currency instead of converting | Does not answer “total payroll across the org” in one number |
| Persist cache in Redis/DB | Over-engineering for MVP; in-memory TTL is sufficient |

## References

- `shared/src/currency-conversion.ts` — display currencies, conversion helpers, test snapshot
- `backend/src/services/frankfurter-exchange-rate.provider.ts`
- `backend/src/services/cached-exchange-rate.provider.ts`
- `backend/src/services/create-exchange-rate-provider.ts`
- `backend/src/domain/analytics-currency-conversion.ts` — SQL conversion
- `backend/src/domain/frankfurter-exchange-rates.ts` — response mapping
