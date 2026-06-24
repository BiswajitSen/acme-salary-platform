import {
  FIXTURE_COMPENSATION_REASONS,
  FIXTURE_CURRENCIES,
  FIXTURE_DEFAULT_COMPENSATION_CHANGED_BY,
  FIXTURE_DEFAULT_COMPENSATION_EFFECTIVE_DATE,
  FIXTURE_DEPARTMENTS,
  type CompensationSpreadsheetRow,
  type FixtureCurrency,
  indexOfFixtureDepartment,
} from "./constants.js";
import { formatFixtureEmployeeId, parseFixtureEmployeeNumber } from "./employee-id.js";
import { createEmployeeSpreadsheetRows } from "./employee-rows.js";

const FIXTURE_DEPARTMENT_SALARY_BASE = 70_000;
const FIXTURE_DEPARTMENT_SALARY_STEP = 8_000;
const FIXTURE_SALARY_VARIANCE_MODULO = 500;
const FIXTURE_SALARY_VARIANCE_STEP = 100;

export function deriveFixtureCompensationCurrency(
  employeeNumber: number,
  department: string,
): FixtureCurrency {
  const departmentIndex = indexOfFixtureDepartment(department);
  const employeeBlock = Math.floor((employeeNumber - 1) / FIXTURE_DEPARTMENTS.length);
  const currencyIndex = (employeeBlock + departmentIndex) % FIXTURE_CURRENCIES.length;

  return FIXTURE_CURRENCIES[currencyIndex]!;
}

export function deriveFixtureCompensationSalary(
  employeeNumber: number,
  department: string,
): number {
  const departmentIndex = indexOfFixtureDepartment(department);
  const departmentBase =
    FIXTURE_DEPARTMENT_SALARY_BASE + departmentIndex * FIXTURE_DEPARTMENT_SALARY_STEP;

  return (
    departmentBase +
    (employeeNumber % FIXTURE_SALARY_VARIANCE_MODULO) * FIXTURE_SALARY_VARIANCE_STEP
  );
}

export function createCompensationFixtureRow(
  employeeNumber: number,
  department: string,
): CompensationSpreadsheetRow {
  return {
    employee_id: formatFixtureEmployeeId(employeeNumber),
    base_salary: deriveFixtureCompensationSalary(employeeNumber, department),
    currency: deriveFixtureCompensationCurrency(employeeNumber, department),
    effective_date: FIXTURE_DEFAULT_COMPENSATION_EFFECTIVE_DATE,
    reason: FIXTURE_COMPENSATION_REASONS[0]!,
    changed_by: FIXTURE_DEFAULT_COMPENSATION_CHANGED_BY,
    notes: "",
  };
}

export function createCompensationSpreadsheetRows(
  totalEmployees: number,
): CompensationSpreadsheetRow[] {
  return createEmployeeSpreadsheetRows(totalEmployees).map((employee) =>
    createCompensationFixtureRow(
      parseFixtureEmployeeNumber(employee.employee_id),
      employee.department,
    ),
  );
}
