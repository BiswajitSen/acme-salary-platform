export const FIXTURE_DEPARTMENTS = [
  "Engineering",
  "HR",
  "Finance",
  "Sales",
  "Operations",
] as const;

export const FIXTURE_COUNTRIES = ["US", "UK", "SG", "DE", "IN"] as const;

export const FIXTURE_CURRENCIES = ["USD", "GBP", "SGD", "EUR", "INR"] as const;

export const FIXTURE_JOB_TITLES = [
  "Analyst",
  "Manager",
  "Engineer",
  "Director",
  "Coordinator",
] as const;

export const FIXTURE_COMPENSATION_REASONS = [
  "New Hire",
  "Annual Increment",
  "Promotion",
] as const;

export const FIXTURE_DEFAULT_COMPENSATION_EFFECTIVE_DATE = "2025-01-01";

export const FIXTURE_DEFAULT_COMPENSATION_CHANGED_BY = "HR Admin";

export const FIXTURE_DEFAULT_EMPLOYEE_COUNT = 10_000;

export type FixtureDepartment = (typeof FIXTURE_DEPARTMENTS)[number];

export type FixtureCurrency = (typeof FIXTURE_CURRENCIES)[number];

export type EmployeeSpreadsheetRow = {
  employee_id: string;
  full_name: string;
  department: string;
  job_title: string;
  country: string;
};

export type CompensationSpreadsheetRow = {
  employee_id: string;
  base_salary: number;
  currency: string;
  effective_date: string;
  reason: string;
  changed_by: string;
  notes: string;
};

export function indexOfFixtureDepartment(department: string): number {
  const departmentIndex = FIXTURE_DEPARTMENTS.indexOf(department as FixtureDepartment);

  return departmentIndex === -1 ? 0 : departmentIndex;
}

export function pickFixtureValue<T extends readonly string[]>(
  values: T,
  index: number,
): T[number] {
  return values[index % values.length]!;
}
