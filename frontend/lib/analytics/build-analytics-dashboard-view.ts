import type {
  AnalyticsDepartmentStatisticsResponse,
  AnalyticsSummaryResponse,
  AnalyticsTopEarnersResponse,
  DepartmentSalaryStatistics,
  ExchangeRatesToUsd,
  TopEarner,
} from "@acme/shared";

import { countryLabel } from "@/lib/country-label";
import {
  applyDepartmentPayrollPercents,
  computeMedian,
  computeTopTenPayrollPercent,
  countMedianSplit,
  pickHighestPaidLocation,
  pickHighestPayrollDepartment,
  sumDisplaySalaries,
} from "./analytics-math";
import { formatAnalyticsPercent } from "./format-analytics-percent";
import { toCompensatedEmployeeRecords } from "./fetch-compensated-employees";
import type {
  AnalyticsDashboardFilters,
  AnalyticsDashboardView,
  AnalyticsDepartmentRow,
  AnalyticsHeadcountSlice,
  AnalyticsHeatmapCell,
  AnalyticsHighlights,
  AnalyticsHistogramBucket,
  AnalyticsKpiSnapshot,
  AnalyticsLocationRow,
  AnalyticsRoleRow,
  AnalyticsTopEarnerRow,
  CompensatedEmployeeRecord,
} from "./types";
import { formatSalary } from "@/lib/format-salary";

type BuildAnalyticsDashboardViewInput = {
  currency: string;
  exchangeRatesAsOf: string;
  filters: AnalyticsDashboardFilters;
  ratesToUsd: ExchangeRatesToUsd;
  employees: CompensatedEmployeeRecord[];
  apiSummary: AnalyticsSummaryResponse | null;
  apiDepartments: AnalyticsDepartmentStatisticsResponse | null;
  apiTopEarners: AnalyticsTopEarnersResponse | null;
};

export function hasActiveAnalyticsFilters(filters: AnalyticsDashboardFilters): boolean {
  return Boolean(filters.country || filters.department || filters.jobTitle);
}

export function filterCompensatedEmployees(
  employees: CompensatedEmployeeRecord[],
  filters: AnalyticsDashboardFilters,
): CompensatedEmployeeRecord[] {
  return employees.filter((employee) => {
    if (filters.country && employee.country !== filters.country) {
      return false;
    }

    if (filters.department && employee.department !== filters.department) {
      return false;
    }

    if (filters.jobTitle && employee.jobTitle !== filters.jobTitle) {
      return false;
    }

    return true;
  });
}

function computeDepartmentRows(
  employees: CompensatedEmployeeRecord[],
  totalPayroll: number,
): AnalyticsDepartmentRow[] {
  const grouped = groupBy(employees, (employee) => employee.department);

  return applyDepartmentPayrollPercents(
    [...grouped.entries()].map(([department, group]) => {
      const salaries = group.map((employee) => employee.displaySalary);
      const payroll = sumDisplaySalaries(group);

      return {
        department,
        employeeCount: group.length,
        averageSalary: Math.round(payroll / group.length),
        medianSalary: computeMedian(salaries),
        payrollPercent: 0,
      };
    }),
    employees,
    totalPayroll,
  ).sort((left, right) => right.averageSalary - left.averageSalary);
}

function computeLocationRows(employees: CompensatedEmployeeRecord[]): AnalyticsLocationRow[] {
  const grouped = groupBy(employees, (employee) => employee.country);

  return [...grouped.entries()]
    .map(([country, group]) => {
      const payroll = sumDisplaySalaries(group);

      return {
        country,
        label: countryLabel(country),
        payroll,
        employeeCount: group.length,
        averageSalary: Math.round(payroll / group.length),
      };
    })
    .sort((left, right) => right.payroll - left.payroll);
}

function computeRoleRows(employees: CompensatedEmployeeRecord[]): AnalyticsRoleRow[] {
  const grouped = groupBy(employees, (employee) => employee.jobTitle);

  return [...grouped.entries()]
    .map(([jobTitle, group]) => {
      const total = sumDisplaySalaries(group);

      return {
        jobTitle,
        averageSalary: Math.round(total / group.length),
        employeeCount: group.length,
      };
    })
    .sort((left, right) => right.averageSalary - left.averageSalary)
    .slice(0, 12);
}

function computeHeadcountSlices(employees: CompensatedEmployeeRecord[]): AnalyticsHeadcountSlice[] {
  const grouped = groupBy(employees, (employee) => employee.department);
  const total = employees.length;

  return [...grouped.entries()]
    .map(([department, group]) => ({
      department,
      count: group.length,
      percent: total > 0 ? Math.round((group.length / total) * 100) : 0,
    }))
    .sort((left, right) => right.count - left.count);
}

function computeTopEarners(employees: CompensatedEmployeeRecord[]): AnalyticsTopEarnerRow[] {
  return [...employees]
    .sort((left, right) => {
      if (right.displaySalary !== left.displaySalary) {
        return right.displaySalary - left.displaySalary;
      }

      return left.id.localeCompare(right.id);
    })
    .slice(0, 10)
    .map((employee) => ({
      employeeId: employee.id,
      fullName: employee.fullName,
      department: employee.department,
      country: employee.country,
      baseSalary: employee.displaySalary,
    }));
}

function computeHistogramBuckets(
  employees: CompensatedEmployeeRecord[],
  currency: string,
): AnalyticsHistogramBucket[] {
  if (employees.length === 0) {
    return [];
  }

  const salaries = employees.map((employee) => employee.displaySalary);
  const min = Math.min(...salaries);
  const max = Math.max(...salaries);
  const bucketCount = 5;

  if (min === max) {
    return [
      {
        label: `${formatSalary(min, currency)}`,
        count: employees.length,
      },
    ];
  }

  const step = Math.max(1, Math.ceil((max - min) / bucketCount));
  const buckets: AnalyticsHistogramBucket[] = [];

  for (let index = 0; index < bucketCount; index += 1) {
    const start = min + index * step;
    const end = index === bucketCount - 1 ? max : start + step - 1;
    const count = salaries.filter((salary) => {
      if (index === bucketCount - 1) {
        return salary >= start && salary <= end;
      }

      return salary >= start && salary < start + step;
    }).length;

    buckets.push({
      label: `${formatSalary(start, currency)}–${formatSalary(end, currency)}`,
      count,
    });
  }

  return buckets;
}

function computeHeatmap(employees: CompensatedEmployeeRecord[]): AnalyticsDashboardView["heatmap"] {
  const countries = [...new Set(employees.map((employee) => employee.country))].sort();
  const departments = [...new Set(employees.map((employee) => employee.department))].sort();
  const cells: AnalyticsHeatmapCell[] = [];

  for (const country of countries) {
    for (const department of departments) {
      const group = employees.filter(
        (employee) => employee.country === country && employee.department === department,
      );

      cells.push({
        country,
        department,
        averageSalary:
          group.length > 0 ? Math.round(sumDisplaySalaries(group) / group.length) : null,
      });
    }
  }

  return { countries, departments, cells };
}

function computeHighlights(
  employees: CompensatedEmployeeRecord[],
  medianSalary: number,
  totalPayroll: number,
  departmentCount: number,
  apiTopEarners?: TopEarner[] | null,
): AnalyticsHighlights {
  if (employees.length === 0) {
    return {
      highestSalary: null,
      lowestSalary: null,
      topTenPayrollPercent: 0,
      salaryRange: { min: 0, max: 0 },
      aboveMedian: 0,
      belowMedian: 0,
      atMedian: 0,
      averageEmployeesPerDepartment: 0,
    };
  }

  const sorted = [...employees].sort(
    (left, right) => right.displaySalary - left.displaySalary,
  );
  const highest = sorted[0]!;
  const lowest = sorted[sorted.length - 1]!;
  const medianSplit = countMedianSplit(employees, medianSalary);

  return {
    highestSalary: { amount: highest.displaySalary, employeeId: highest.id },
    lowestSalary: { amount: lowest.displaySalary, employeeId: lowest.id },
    topTenPayrollPercent: computeTopTenPayrollPercent(
      employees,
      totalPayroll,
      apiTopEarners,
    ),
    salaryRange: { min: lowest.displaySalary, max: highest.displaySalary },
    aboveMedian: medianSplit.aboveMedian,
    belowMedian: medianSplit.belowMedian,
    atMedian: medianSplit.atMedian,
    averageEmployeesPerDepartment:
      departmentCount > 0 ? Math.round(employees.length / departmentCount) : 0,
  };
}

function computeKpisFromEmployees(
  employees: CompensatedEmployeeRecord[],
): AnalyticsKpiSnapshot {
  const salaries = employees.map((employee) => employee.displaySalary);
  const totalPayroll = sumDisplaySalaries(employees);
  const departmentRows = computeDepartmentRows(employees, totalPayroll);

  return {
    headcount: employees.length,
    totalPayroll,
    averageSalary: employees.length > 0 ? Math.round(totalPayroll / employees.length) : 0,
    medianSalary: computeMedian(salaries),
    highestPaidDepartment: departmentRows[0]
      ? { name: departmentRows[0].department, averageSalary: departmentRows[0].averageSalary }
      : null,
    highestPaidLocation: pickHighestPaidLocation(computeLocationRows(employees)),
  };
}

function mapApiDepartmentRows(
  departments: DepartmentSalaryStatistics[],
): AnalyticsDepartmentRow[] {
  return departments.map((department) => ({
    department: department.department,
    employeeCount: department.employeeCount,
    averageSalary: department.averageSalary,
    medianSalary: department.medianSalary,
    payrollPercent: 0,
  }));
}

function mapApiTopEarners(
  earners: TopEarner[],
  employeesById: Map<string, CompensatedEmployeeRecord>,
): AnalyticsTopEarnerRow[] {
  return earners.map((earner) => ({
    employeeId: earner.employeeId,
    fullName: earner.fullName,
    department: earner.department,
    country: employeesById.get(earner.employeeId)?.country ?? "—",
    baseSalary: earner.baseSalary,
  }));
}

export function generateExecutiveInsights(
  view: Pick<
    AnalyticsDashboardView,
    "currency" | "kpis" | "departments" | "locations" | "highlights"
  >,
): string[] {
  const insights: string[] = [];
  const topPayrollDepartment = pickHighestPayrollDepartment(view.departments);

  if (topPayrollDepartment) {
    insights.push(
      `${topPayrollDepartment.department} contributes ${formatAnalyticsPercent(topPayrollDepartment.payrollPercent)} of total payroll.`,
    );
  }

  if (view.kpis.highestPaidLocation) {
    insights.push(
      `${view.kpis.highestPaidLocation.name} has the highest average annual salary at ${formatSalary(view.kpis.highestPaidLocation.averageSalary, view.currency)}.`,
    );
  }

  const lowestMedianDepartment = [...view.departments].sort(
    (left, right) => left.medianSalary - right.medianSalary,
  )[0];

  if (lowestMedianDepartment) {
    insights.push(`${lowestMedianDepartment.department} has the lowest median annual salary.`);
  }

  const workforceCount =
    view.highlights.aboveMedian + view.highlights.belowMedian + view.highlights.atMedian;

  if (view.kpis.medianSalary > 0 && workforceCount > 0) {
    const aboveThreshold = Math.round((view.highlights.aboveMedian / workforceCount) * 100);
    insights.push(`${aboveThreshold}% of employees earn above the org median.`);
  }

  insights.push(
    `Top 10 employees account for ${formatAnalyticsPercent(view.highlights.topTenPayrollPercent)} of payroll.`,
  );

  if (view.locations.length >= 2) {
    const sorted = [...view.locations].sort(
      (left, right) => right.averageSalary - left.averageSalary,
    );
    const highest = sorted[0]!;
    const lowest = sorted[sorted.length - 1]!;
    const gap = highest.averageSalary - lowest.averageSalary;

    insights.push(
      `Average annual salary difference between ${highest.label} and ${lowest.label} is ${formatSalary(gap, view.currency)}.`,
    );
  }

  return insights.slice(0, 6);
}

export function buildAnalyticsDashboardView(
  input: BuildAnalyticsDashboardViewInput,
): AnalyticsDashboardView {
  const filteredEmployees = filterCompensatedEmployees(input.employees, input.filters);
  const useApiAggregates =
    !hasActiveAnalyticsFilters(input.filters) &&
    input.apiSummary !== null &&
    input.apiDepartments !== null &&
    input.apiTopEarners !== null;

  const employeesById = new Map(input.employees.map((employee) => [employee.id, employee]));
  const locationRows = computeLocationRows(filteredEmployees);
  const apiDepartmentRows = useApiAggregates
    ? applyDepartmentPayrollPercents(
        mapApiDepartmentRows(input.apiDepartments!.departments),
        filteredEmployees,
        input.apiSummary!.totalPayroll,
      ).sort((left, right) => right.averageSalary - left.averageSalary)
    : [];

  const kpis = useApiAggregates
    ? {
        headcount: input.apiSummary!.headcount,
        totalPayroll: input.apiSummary!.totalPayroll,
        averageSalary:
          input.apiSummary!.headcount > 0
            ? Math.round(input.apiSummary!.totalPayroll / input.apiSummary!.headcount)
            : 0,
        medianSalary: computeMedian(filteredEmployees.map((employee) => employee.displaySalary)),
        highestPaidDepartment: apiDepartmentRows[0]
          ? {
              name: apiDepartmentRows[0].department,
              averageSalary: apiDepartmentRows[0].averageSalary,
            }
          : null,
        highestPaidLocation: pickHighestPaidLocation(locationRows),
      }
    : computeKpisFromEmployees(filteredEmployees);

  const departments = useApiAggregates
    ? apiDepartmentRows
    : computeDepartmentRows(filteredEmployees, kpis.totalPayroll);

  const topEarners = useApiAggregates
    ? mapApiTopEarners(input.apiTopEarners!.earners, employeesById)
    : computeTopEarners(filteredEmployees);

  const highlights = computeHighlights(
    filteredEmployees,
    kpis.medianSalary,
    kpis.totalPayroll,
    departments.length,
    useApiAggregates ? input.apiTopEarners!.earners : null,
  );

  const view: AnalyticsDashboardView = {
    currency: input.currency,
    exchangeRatesAsOf: input.exchangeRatesAsOf,
    kpis,
    departments,
    locations: locationRows,
    roles: computeRoleRows(filteredEmployees),
    headcountByDepartment: computeHeadcountSlices(filteredEmployees),
    topEarners,
    histogram: computeHistogramBuckets(filteredEmployees, input.currency),
    heatmap: computeHeatmap(filteredEmployees),
    highlights,
    insights: [],
  };

  view.insights = generateExecutiveInsights(view);

  return view;
}

export function buildCompensatedEmployeesFromSummaries(
  employees: Parameters<typeof toCompensatedEmployeeRecords>[0],
  displayCurrency: string,
  ratesToUsd: ExchangeRatesToUsd,
): CompensatedEmployeeRecord[] {
  return toCompensatedEmployeeRecords(employees, displayCurrency, ratesToUsd);
}

function groupBy<T>(
  items: T[],
  selector: (item: T) => string,
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = selector(item);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  return groups;
}

// Re-export for tests that imported computeMedian from this module.
export { computeMedian } from "./analytics-math";
