# ADR 002: Client-Side Session Cache for the Analytics Dashboard

|              |             |
| ------------ | ----------- |
| **Status**   | Accepted    |
| **Date**     | 2026-06-24  |
| **Deciders** | Engineering |

## Context

The Analytics Dashboard aggregates compensation data from multiple backend endpoints to provide organization-wide payroll insights. The data includes:

* Supported display currencies and exchange-rate metadata
* Summary metrics (headcount, payroll, average and median salary)
* Department-level salary statistics
* Top earners
* Paginated employee compensation records used for client-side analytics
* Filter metadata (locations, departments, and job titles)

Initially, every navigation to `/analytics` triggered a complete reload of all dashboard data, even if the user had visited the page only moments earlier. This resulted in unnecessary API requests, repeated loading skeletons, and slower navigation for a dashboard that is primarily read-heavy and whose underlying data changes relatively infrequently.

The dashboard also combines two different types of data:

* **Server-computed aggregates** such as summary metrics, department statistics, and top earners.
* **Client-derived analytics** such as charts, distributions, and filtered views built from the employee dataset.

Additionally, employees are paid in multiple native currencies. The dashboard supports displaying compensation in different currencies, so changing the display currency should not require downloading the employee dataset again whenever possible.

## Decision

### Introduce a client-side session cache

The frontend maintains a module-scoped in-memory cache in `analytics-dashboard-cache.ts`. The store lives for the current browser tab; a full page reload clears it immediately. Each entry expires **5 minutes** after it is written (TTL).

The cache is divided into three logical buckets:

| Bucket        | Contents                                                                             | Scope                                       |
| ------------- | ------------------------------------------------------------------------------------ | ------------------------------------------- |
| **Static**    | Supported currencies, FX rates, exchange-rate timestamp, and employee filter options | Shared across all display currencies        |
| **Employees** | Raw `EmployeeSummary` records fetched from paginated APIs                            | Currency-independent                        |
| **Metrics**   | Summary metrics, department statistics, and top earners                              | Cached separately for each display currency |

Separating the cache into independent buckets allows the dashboard to reuse unaffected data while refreshing only the information that depends on the selected display currency.

### Render from cache when available

`useAnalyticsDashboard` checks the cache during initialization.

If the required cache entries are present and have not expired:

* the dashboard renders immediately,
* loading skeletons are skipped,
* and unnecessary network requests are avoided.

Expired or missing entries are treated as cache misses and fetched normally.

When only some buckets are fresh (for example, employees are cached but metrics for a newly selected display currency are not), the hook reuses available data and fetches only the missing entries. This avoids a full loading skeleton when a partial cache hit is possible.

### Derive display-currency compensation in memory

Employee records are cached using their native compensation currency.

When the selected display currency changes, `buildCompensatedEmployeesFromSummaries()` converts compensation using the cached FX rates and rebuilds the employee view in memory.

As a result:

* employee data is not re-downloaded,
* charts and client-side analytics are recalculated locally,
* and only the server-computed metrics are fetched if no fresh cache exists for the selected display currency.

### Apply filters client-side

Location, department, and job-title filters operate entirely on the cached employee dataset.

Changing filters:

* does not invalidate the cache,
* does not trigger additional API requests,
* and rebuilds the dashboard view using the filtered employee list.

This provides an instantaneous filtering experience.

### Keep the cache session-scoped

The cache exists only in memory and is **not** persisted to:

* `localStorage`
* `sessionStorage`
* IndexedDB

The cache is automatically cleared when the browser tab is refreshed or closed.

This avoids persisting potentially stale compensation data across browser sessions while keeping cache invalidation straightforward.

## Consequences

### Positive

* Repeat visits to the Analytics Dashboard within the same browser session render almost instantly.
* Currency changes reuse cached employee data and avoid expensive pagination requests.
* Client-side filtering remains responsive because it operates entirely in memory.
* Separating static data, employee data, and per-currency metrics minimizes unnecessary cache invalidation.
* A five-minute TTL balances user experience with reasonably fresh compensation data.
* Tests can reliably reset cache state using `clearAnalyticsDashboardCache()`.

### Trade-offs

* Cached data may be up to five minutes old.
* FX rate freshness is still shown via `exchangeRatesAsOf` (see [ADR 001](./001-daily-frankfurter-exchange-rates-and-display-currency.md)); the dashboard cache TTL is separate from the backend exchange-rate cache.
* Compensation or employee updates made by other users are not visible until the cache expires or the page is refreshed.
* The cache is scoped to a single browser tab; opening the dashboard in another tab performs a cold fetch.
* Background revalidation (stale-while-revalidate) is not currently implemented.

## Alternatives Considered

| Alternative                                         | Reason Rejected                                                                                                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Always fetch from the server                        | Introduces unnecessary loading delays and repeated network requests on every navigation.                                                                                      |
| Persist cache in `localStorage` or `sessionStorage` | Increases the risk of serving stale compensation data across browser sessions and complicates cache invalidation.                                                             |
| React Query or SWR                                  | Introduces an additional dependency and configuration for a single dashboard. May be reconsidered if multiple pages require shared caching behavior.                          |
| HTTP caching only                                   | Does not eliminate repeated client-side pagination or improve SPA route transitions.                                                                                          |
| Single monolithic cache entry                       | Prevents independent reuse of employee data when only the display currency changes.                                                                                           |
| Longer TTL (for example, 24 hours)                  | Improves cache hit rates but increases the likelihood of stale payroll and employee information. Five minutes provides a better balance between freshness and responsiveness. |

## Future Improvements

Potential enhancements include:

* Background stale-while-revalidate refreshes.
* Manual "Refresh Data" action.
* Cache invalidation triggered after compensation imports.
* Cache versioning based on backend data timestamps.
* Migration to React Query or SWR if additional dashboards require a shared caching strategy.

## References

* `frontend/lib/analytics/analytics-dashboard-cache.ts`
* `frontend/lib/analytics/analytics-dashboard-cache.test.ts`
* `frontend/lib/hooks/use-analytics-dashboard.ts`
* `frontend/lib/analytics/build-analytics-dashboard-view.ts`
* `frontend/lib/analytics/fetch-compensated-employees.ts`
* [ADR 001](./001-daily-frankfurter-exchange-rates-and-display-currency.md) — daily Frankfurter exchange rates and display currency (backend FX layer; complementary to this client cache)
