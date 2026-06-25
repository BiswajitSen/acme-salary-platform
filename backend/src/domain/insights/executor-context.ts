import type {
  AnalyticsSummaryResponse,
  AnalyticsTopEarnersResponse,
  CompensationReason,
  InsightTimelineEvent,
} from "@acme/shared";

import type { MedianSplitCountsRecord } from "../analytics.types.js";
import type { EmployeeScopeParams } from "./employee-scope.js";
import type { InsightTimelineIntent } from "./timeline/timeline.js";

export type InsightExecutorContext = {
  getAnalyticsSummary(
    currency: string,
    scope: EmployeeScopeParams,
  ): Promise<AnalyticsSummaryResponse>;
  getScopedSalaryStatistics(
    currency: string,
    scope: EmployeeScopeParams,
  ): Promise<{
    currency: string;
    employeeCount: number;
    averageSalary: number;
    medianSalary: number;
  }>;
  getTopEarners(
    currency: string,
    scope: EmployeeScopeParams,
    limit: number,
  ): Promise<AnalyticsTopEarnersResponse>;
  getBottomEarners(
    currency: string,
    scope: EmployeeScopeParams,
    limit: number,
  ): Promise<AnalyticsTopEarnersResponse>;
  getNearMedianEarners(
    currency: string,
    scope: EmployeeScopeParams,
    tolerancePercent: number,
  ): Promise<AnalyticsTopEarnersResponse & { medianSalary: number; tolerancePercent: number }>;
  getMedianSplitCounts(
    currency: string,
    scope: EmployeeScopeParams,
  ): Promise<MedianSplitCountsRecord & { currency: string }>;
  getRecentTimelineEvents(
    intent: InsightTimelineIntent,
    query: {
      months: number | null;
      sinceDate: string | null;
      country: string | null;
      department: string | null;
      jobTitle: string | null;
      reasons: readonly CompensationReason[];
    },
  ): Promise<{ asOfDate: string; events: InsightTimelineEvent[] }>;
};
