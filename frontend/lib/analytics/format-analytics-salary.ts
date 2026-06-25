import { formatSalary } from "@/lib/format-salary";

export const ANNUAL_BASE_SALARY_LABEL = "Annual base salary";
export const ANNUAL_COMPENSATION_NOTE =
  "All salary and payroll figures reflect annual base compensation in the selected display currency.";

export function formatAnnualSalary(amount: number, currency: string): string {
  return formatSalary(amount, currency);
}
