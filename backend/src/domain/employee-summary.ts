import type { EmployeeEmploymentStatus, EmployeeSummary } from "@acme/shared";

type EmployeeDirectoryRow = {
  id: string;
  fullName: string;
  department: string;
  jobTitle: string;
  country: string;
  baseSalary: number | null;
  currency: string | null;
};

export function resolveEmploymentStatus(
  baseSalary: number | null,
): EmployeeEmploymentStatus {
  return baseSalary === null ? "NO_COMPENSATION" : "ACTIVE";
}

export function toEmployeeSummary(row: EmployeeDirectoryRow): EmployeeSummary {
  return {
    id: row.id,
    fullName: row.fullName,
    department: row.department,
    jobTitle: row.jobTitle,
    country: row.country,
    baseSalary: row.baseSalary,
    currency: row.currency,
    employmentStatus: resolveEmploymentStatus(row.baseSalary),
  };
}

export function toBasicEmployeeSummary(
  employee: Omit<EmployeeSummary, "baseSalary" | "currency" | "employmentStatus"> & {
    baseSalary?: number | null;
    currency?: string | null;
  },
): EmployeeSummary {
  const baseSalary = employee.baseSalary ?? null;
  const currency = employee.currency ?? null;

  return {
    id: employee.id,
    fullName: employee.fullName,
    department: employee.department,
    jobTitle: employee.jobTitle,
    country: employee.country,
    baseSalary,
    currency,
    employmentStatus: resolveEmploymentStatus(baseSalary),
  };
}
