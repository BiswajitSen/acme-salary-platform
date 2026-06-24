import {
  FIXTURE_COUNTRIES,
  FIXTURE_DEPARTMENTS,
  FIXTURE_JOB_TITLES,
  type EmployeeSpreadsheetRow,
  pickFixtureValue,
} from "./constants.js";
import { formatFixtureEmployeeId } from "./employee-id.js";

function assignFixtureCountry(employeeIndex: number): string {
  const countryIndex = Math.floor(employeeIndex / FIXTURE_DEPARTMENTS.length);

  return pickFixtureValue(FIXTURE_COUNTRIES, countryIndex);
}

export function createEmployeeFixtureRow(employeeNumber: number): EmployeeSpreadsheetRow {
  const employeeIndex = employeeNumber - 1;

  return {
    employee_id: formatFixtureEmployeeId(employeeNumber),
    full_name: `Employee ${employeeNumber}`,
    department: pickFixtureValue(FIXTURE_DEPARTMENTS, employeeIndex),
    job_title: pickFixtureValue(FIXTURE_JOB_TITLES, employeeIndex),
    country: assignFixtureCountry(employeeIndex),
  };
}

export function createEmployeeSpreadsheetRows(totalRows: number): EmployeeSpreadsheetRow[] {
  return Array.from({ length: totalRows }, (_, index) =>
    createEmployeeFixtureRow(index + 1),
  );
}
