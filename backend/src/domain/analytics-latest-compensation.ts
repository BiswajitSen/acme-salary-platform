import { sql } from "drizzle-orm";

export const latestCompensationRows = sql`
  SELECT DISTINCT ON (employee_id)
    employee_id,
    base_salary,
    currency
  FROM compensation_history
  ORDER BY employee_id, effective_date DESC, id DESC
`;

export const latestCompensationCurrencies = sql`
  SELECT DISTINCT ON (employee_id)
    currency
  FROM compensation_history
  ORDER BY employee_id, effective_date DESC, id DESC
`;
