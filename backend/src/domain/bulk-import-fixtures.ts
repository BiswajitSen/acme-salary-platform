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

export type FixtureDepartment = (typeof FIXTURE_DEPARTMENTS)[number];

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

function resolveDepartmentIndex(department: string): number {
  const departmentIndex = FIXTURE_DEPARTMENTS.indexOf(department as FixtureDepartment);
  return departmentIndex === -1 ? 0 : departmentIndex;
}

export function buildEmployeeFixtureRow(employeeNumber: number): EmployeeSpreadsheetRow {
  const index = employeeNumber - 1;

  return {
    employee_id: `E${String(employeeNumber).padStart(5, "0")}`,
    full_name: `Employee ${employeeNumber}`,
    department: FIXTURE_DEPARTMENTS[index % FIXTURE_DEPARTMENTS.length]!,
    job_title: FIXTURE_JOB_TITLES[index % FIXTURE_JOB_TITLES.length]!,
    country:
      FIXTURE_COUNTRIES[
        Math.floor(index / FIXTURE_DEPARTMENTS.length) % FIXTURE_COUNTRIES.length
      ]!,
  };
}

export function buildEmployeeSpreadsheetRows(totalRows: number): EmployeeSpreadsheetRow[] {
  return Array.from({ length: totalRows }, (_, index) =>
    buildEmployeeFixtureRow(index + 1),
  );
}

export function resolveFixtureCurrency(
  employeeNumber: number,
  department: string,
): (typeof FIXTURE_CURRENCIES)[number] {
  const departmentIndex = resolveDepartmentIndex(department);
  const employeeBlock = Math.floor((employeeNumber - 1) / FIXTURE_DEPARTMENTS.length);
  const currencyIndex =
    (employeeBlock + departmentIndex) % FIXTURE_CURRENCIES.length;

  return FIXTURE_CURRENCIES[currencyIndex]!;
}

export function resolveFixtureBaseSalary(employeeNumber: number, department: string): number {
  const departmentIndex = resolveDepartmentIndex(department);
  const departmentBase = 70_000 + departmentIndex * 8_000;

  return departmentBase + (employeeNumber % 500) * 100;
}

export function buildCompensationFixtureRow(
  employeeNumber: number,
  department: string,
): CompensationSpreadsheetRow {
  return {
    employee_id: `E${String(employeeNumber).padStart(5, "0")}`,
    base_salary: resolveFixtureBaseSalary(employeeNumber, department),
    currency: resolveFixtureCurrency(employeeNumber, department),
    effective_date: "2025-01-01",
    reason: FIXTURE_COMPENSATION_REASONS[0]!,
    changed_by: "HR Admin",
    notes: "",
  };
}

export function buildCompensationSpreadsheetRows(
  totalEmployees: number,
): CompensationSpreadsheetRow[] {
  return buildEmployeeSpreadsheetRows(totalEmployees).map((employee) => {
    const employeeNumber = Number(employee.employee_id.slice(1));

    return buildCompensationFixtureRow(employeeNumber, employee.department);
  });
}

export function summarizeFixtureCurrencyDepartments(
  totalEmployees: number,
): Map<string, Set<string>> {
  const departmentsByCurrency = new Map<string, Set<string>>();

  for (const employee of buildEmployeeSpreadsheetRows(totalEmployees)) {
    const employeeNumber = Number(employee.employee_id.slice(1));
    const currency = resolveFixtureCurrency(employeeNumber, employee.department);
    const departments =
      departmentsByCurrency.get(currency) ?? new Set<string>();

    departments.add(employee.department);
    departmentsByCurrency.set(currency, departments);
  }

  return departmentsByCurrency;
}
