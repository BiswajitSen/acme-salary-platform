# ADR 001: Dynamic Currency Conversion for Compensation Analytics

|              |             |
| ------------ | ----------- |
| **Status**   | Accepted    |
| **Date**     | 2026-06-24  |
| **Deciders** | Engineering |

## Context

The Salary Management System supports employees whose compensation is stored in different native currencies (USD, GBP, EUR, INR and SGD).

Business users require organization-wide insights such as:

* Total payroll
* Department payroll
* Average compensation
* Highest-paid employees
* Natural-language compensation insights

These metrics must be calculated in a **single user-selected display currency** regardless of each employee's native currency.

Using hard-coded exchange rates would quickly become inaccurate as foreign exchange rates fluctuate daily. The solution must also remain deterministic during automated testing and continue operating when the external exchange-rate provider is temporarily unavailable.

## Decision

### Use dynamic exchange rates from Frankfurter

The application retrieves daily exchange rates from the Frankfurter API and converts all compensation values into the selected display currency before performing analytics or insights calculations.

Exchange rates are internally represented as **rates-to-USD**, allowing conversions between any supported currencies through a consistent calculation model.

### Treat currency as a display preference

The selected currency represents the **display currency**, not a filter on employee records.

For example:

* Display Currency = USD

means:

> Convert every employee's compensation to USD before aggregation.

It does **not** mean:

> Only include employees who are paid in USD.

This ensures organization-wide metrics remain accurate regardless of employees' native currencies.

### Cache exchange rates

Exchange rates are cached in memory for **24 hours**.

If refreshing rates fails, the application continues using the most recently successful snapshot. This minimizes external API calls while allowing analytics to remain available during temporary outages.

### Use fixed exchange rates during testing

Automated tests use a predefined exchange-rate snapshot instead of calling the Frankfurter API.

This keeps tests:

* deterministic
* repeatable
* independent of network availability

### Expose exchange rate freshness

Every analytics response includes an `exchangeRatesAsOf` timestamp indicating when the exchange-rate snapshot was obtained.

The frontend displays this information so users understand the freshness of converted values.

### Provide a global display-currency selector

A shared **Display Currency** selector allows users to switch the comparison currency across the application.

Changing the selection immediately refreshes Analytics, Employee Profiles, and Insights using the newly selected currency without requiring a page reload. The user's preference is persisted locally for future sessions.

## Consequences

### Positive

* Compensation analytics remain accurate using current exchange rates.
* Users can compare employees paid in different currencies using a single monetary unit.
* Exchange-rate caching improves performance and reduces dependency on external services.
* Tests remain reliable without internet connectivity.
* Displaying the exchange-rate date improves transparency and user trust.

### Negative / Trade-offs

* The application depends on Frankfurter for production exchange rates.
* In-memory caching is maintained independently by each application instance.
* Adding support for new currencies requires application changes.
* Daily exchange rates are sufficient for compensation reporting but do not reflect intraday market fluctuations.

## Alternatives Considered

| Alternative                          | Reason Rejected                                                                   |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| Hard-coded exchange rates            | Become stale and require manual maintenance.                                      |
| Currency conversion library only     | Libraries perform calculations but still require an external rate source.         |
| Real-time exchange rates             | Unnecessary complexity for payroll analytics where daily rates are sufficient.    |
| Filter employees by native currency  | Prevents organization-wide payroll comparisons across currencies.                 |
| Shared cache using Redis or database | Added infrastructure complexity without sufficient benefit for the current scale. |

## References

* `shared/src/currency-conversion.ts`
* `backend/src/services/frankfurter-exchange-rate.provider.ts`
* `backend/src/services/cached-exchange-rate.provider.ts`
* `backend/src/services/create-exchange-rate-provider.ts`
* `backend/src/domain/analytics-currency-conversion.ts`
* `backend/src/domain/frankfurter-exchange-rates.ts`
