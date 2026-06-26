import type { EmployeeSummary, ExchangeRatesToUsd } from "@acme/shared";
import { convertCurrencyAmount } from "@acme/shared";

import { getAnalyticsCompensatedEmployees } from "@/lib/api/analytics";

import type { CompensatedEmployeeRecord } from "./types";

export async function fetchCompensatedEmployees(
  currency: string,
): Promise<CompensatedEmployeeRecord[]> {
  const response = await getAnalyticsCompensatedEmployees(currency);

  return response.employees.map((employee) => ({
    id: employee.employeeId,
    fullName: employee.fullName,
    department: employee.department,
    jobTitle: employee.jobTitle,
    country: employee.country,
    displaySalary: employee.displaySalary,
  }));
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
