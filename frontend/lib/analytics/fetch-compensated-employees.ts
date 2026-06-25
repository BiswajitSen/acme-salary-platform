import type { EmployeeSummary, ExchangeRatesToUsd } from "@acme/shared";
import { convertCurrencyAmount, MAX_EMPLOYEE_LIMIT } from "@acme/shared";

import { listEmployees } from "@/lib/api/employees";

import type { CompensatedEmployeeRecord } from "./types";

export async function fetchCompensatedEmployees(): Promise<EmployeeSummary[]> {
  const employees: EmployeeSummary[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await listEmployees({
      page,
      limit: MAX_EMPLOYEE_LIMIT,
      employmentStatus: "ACTIVE",
    });

    employees.push(...response.data);
    totalPages = response.meta.totalPages;
    page += 1;
  } while (page <= totalPages);

  return employees.filter(
    (employee) =>
      employee.baseSalary !== null &&
      employee.currency !== null &&
      employee.employmentStatus === "ACTIVE",
  );
}

export function toCompensatedEmployeeRecords(
  employees: EmployeeSummary[],
  displayCurrency: string,
  ratesToUsd: ExchangeRatesToUsd,
): CompensatedEmployeeRecord[] {
  return employees.map((employee) => ({
    id: employee.id,
    fullName: employee.fullName,
    department: employee.department,
    jobTitle: employee.jobTitle,
    country: employee.country,
    displaySalary: convertCurrencyAmount(
      employee.baseSalary!,
      employee.currency!,
      displayCurrency,
      ratesToUsd,
    ),
  }));
}
