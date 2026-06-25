import {
  ANALYTICS_TOP_EARNERS_LIMIT,
  type AnalyticsDepartmentStatisticsResponse,
  type AnalyticsSummaryResponse,
  type AnalyticsTopEarnersResponse,
  type CompensationReason,
  type InsightTimelineEvent,
} from "@acme/shared";

import type {
  ScopedSalaryStatisticsRecord,
  MedianSplitCountsRecord,
} from "../domain/analytics.types.js";
import { parseAnalyticsCurrencyQuery } from "../domain/analytics-query.js";
import {
  parseInsightAnalyticsQuery,
  parseInsightTimelineQuery,
  toEmployeeScopeFromQuery,
} from "../domain/insights/analytics-query.js";
import type { InsightTimelineWindow } from "../domain/insights/timeline/window.js";
import {
  INSIGHT_TIMELINE_INTENT_REASONS,
  type InsightTimelineIntent,
} from "../domain/insights/timeline/timeline.js";
import type { IInsightAnalyticsRepository } from "../repositories/interfaces/insight-analytics.repository.js";
import type { IExchangeRateProvider } from "./exchange-rate.provider.js";

function buildTimelineWindow(query: {
  months?: number;
  sinceDate?: string;
}): InsightTimelineWindow {
  return {
    months: query.sinceDate === undefined ? (query.months ?? null) : null,
    sinceDate: query.sinceDate ?? null,
  };
}

export class InsightAnalyticsService {
  constructor(
    private readonly analytics: IInsightAnalyticsRepository,
    private readonly exchangeRates: IExchangeRateProvider,
  ) {}

  async getAnalyticsSummary(query: unknown): Promise<AnalyticsSummaryResponse> {
    const parsed = parseInsightAnalyticsQuery(query);
    const { currency, ...scopeQuery } = parsed;
    const scope = toEmployeeScopeFromQuery(scopeQuery);
    const { asOf, ratesToUsd } = await this.exchangeRates.fetchSnapshot();
    const headcount = await this.analytics.countEmployeesWithLatestCompensation(scope);
    const totalPayroll = await this.analytics.sumLatestCompensationSalariesInDisplayCurrency(
      currency,
      ratesToUsd,
      scope,
    );

    return {
      currency,
      headcount,
      totalPayroll,
      exchangeRatesAsOf: asOf,
    };
  }

  async getScopedSalaryStatistics(query: unknown): Promise<
    ScopedSalaryStatisticsRecord & {
      currency: string;
      exchangeRatesAsOf: string;
    }
  > {
    const parsed = parseInsightAnalyticsQuery(query);
    const { currency, ...scopeQuery } = parsed;
    const scope = toEmployeeScopeFromQuery(scopeQuery);
    const { asOf, ratesToUsd } = await this.exchangeRates.fetchSnapshot();
    const statistics = await this.analytics.findSalaryStatisticsInDisplayCurrency(
      currency,
      ratesToUsd,
      scope,
    );

    return {
      currency,
      exchangeRatesAsOf: asOf,
      ...statistics,
    };
  }

  async getDepartmentSalaryStatistics(
    query: unknown,
  ): Promise<AnalyticsDepartmentStatisticsResponse> {
    const currency = parseAnalyticsCurrencyQuery(query);
    const { asOf, ratesToUsd } = await this.exchangeRates.fetchSnapshot();
    const departments = await this.analytics.findDepartmentSalaryStatisticsInDisplayCurrency(
      currency,
      ratesToUsd,
    );

    return {
      currency,
      departments,
      exchangeRatesAsOf: asOf,
    };
  }

  async getTopEarners(query: unknown): Promise<AnalyticsTopEarnersResponse> {
    const parsed = parseInsightAnalyticsQuery(query);
    const { currency, limit, ...scopeQuery } = parsed;
    const scope = toEmployeeScopeFromQuery(scopeQuery);
    const { asOf, ratesToUsd } = await this.exchangeRates.fetchSnapshot();
    const earners = await this.analytics.findTopEarnersInDisplayCurrency(
      currency,
      ratesToUsd,
      limit ?? ANALYTICS_TOP_EARNERS_LIMIT,
      scope,
    );

    return {
      currency,
      earners,
      exchangeRatesAsOf: asOf,
    };
  }

  async getBottomEarners(query: unknown): Promise<AnalyticsTopEarnersResponse> {
    const parsed = parseInsightAnalyticsQuery(query);
    const { currency, limit, ...scopeQuery } = parsed;
    const scope = toEmployeeScopeFromQuery(scopeQuery);
    const { asOf, ratesToUsd } = await this.exchangeRates.fetchSnapshot();
    const earners = await this.analytics.findBottomEarnersInDisplayCurrency(
      currency,
      ratesToUsd,
      limit ?? ANALYTICS_TOP_EARNERS_LIMIT,
      scope,
    );

    return {
      currency,
      earners,
      exchangeRatesAsOf: asOf,
    };
  }

  async getMedianSplitCounts(query: unknown): Promise<
    MedianSplitCountsRecord & {
      currency: string;
      exchangeRatesAsOf: string;
    }
  > {
    const parsed = parseInsightAnalyticsQuery(query);
    const { currency, ...scopeQuery } = parsed;
    const scope = toEmployeeScopeFromQuery(scopeQuery);
    const { asOf, ratesToUsd } = await this.exchangeRates.fetchSnapshot();
    const counts = await this.analytics.findMedianSplitCountsInDisplayCurrency(
      currency,
      ratesToUsd,
      scope,
    );

    return {
      currency,
      exchangeRatesAsOf: asOf,
      ...counts,
    };
  }

  async getNearMedianEarners(query: {
    currency: string;
    country?: string;
    department?: string;
    jobTitle?: string;
    tolerancePercent: number;
  }): Promise<
    AnalyticsTopEarnersResponse & { medianSalary: number; tolerancePercent: number }
  > {
    const { currency, tolerancePercent, ...scopeQuery } = query;
    const scope = toEmployeeScopeFromQuery(scopeQuery);
    const { asOf, ratesToUsd } = await this.exchangeRates.fetchSnapshot();
    const result = await this.analytics.findNearMedianEarnersInDisplayCurrency(
      currency,
      ratesToUsd,
      tolerancePercent,
      scope,
    );

    return {
      currency,
      earners: result.earners,
      medianSalary: result.medianSalary,
      tolerancePercent,
      exchangeRatesAsOf: asOf,
    };
  }

  async getExchangeRatesAsOf(): Promise<string> {
    const { asOf } = await this.exchangeRates.fetchSnapshot();
    return asOf;
  }

  async getRecentTimelineEvents(
    intent: InsightTimelineIntent,
    query: {
      months?: number;
      sinceDate?: string;
      country?: string;
      department?: string;
      jobTitle?: string;
      reasons?: readonly CompensationReason[];
    },
  ): Promise<{ asOfDate: string; events: InsightTimelineEvent[] }> {
    const { reasons, ...parseable } = query;
    const parsed = parseInsightTimelineQuery(parseable);
    const { months, sinceDate, ...scopeQuery } = parsed;
    const scope = toEmployeeScopeFromQuery(scopeQuery);
    const window = buildTimelineWindow({ months, sinceDate });
    const resolvedReasons = reasons ?? INSIGHT_TIMELINE_INTENT_REASONS[intent];
    const { asOf } = await this.exchangeRates.fetchSnapshot();
    const events = await this.analytics.findRecentCompensationEvents(
      asOf,
      window,
      resolvedReasons,
      scope,
    );

    return {
      asOfDate: asOf,
      events,
    };
  }

  async getRecentPromotions(query: {
    months?: number;
    sinceDate?: string;
    country?: string;
    department?: string;
    jobTitle?: string;
  }): Promise<{ asOfDate: string; promotions: InsightTimelineEvent[] }> {
    const response = await this.getRecentTimelineEvents("RECENT_PROMOTIONS", query);

    return {
      asOfDate: response.asOfDate,
      promotions: response.events,
    };
  }
}
