import { DrizzleAnalyticsRepository } from "../repositories/drizzle/analytics.repository.js";
import { DrizzleCompensationRepository } from "../repositories/drizzle/compensation.repository.js";
import { DrizzleEmployeeRepository } from "../repositories/drizzle/employee.repository.js";
import type { IAnalyticsRepository } from "../repositories/interfaces/analytics.repository.js";
import type { ICompensationRepository } from "../repositories/interfaces/compensation.repository.js";
import type { IEmployeeRepository } from "../repositories/interfaces/employee.repository.js";
import type { IInsightAnalyticsRepository } from "../repositories/interfaces/insight-analytics.repository.js";
import { AiInsightsService } from "../services/ai-insights.service.js";
import { AnalyticsService } from "../services/analytics.service.js";
import { CompensationService } from "../services/compensation.service.js";
import { CompensationImportService } from "../services/compensation-import.service.js";
import { createExchangeRateProvider } from "../services/create-exchange-rate-provider.js";
import { EmployeeImportService } from "../services/employee-import.service.js";
import { EmployeeService } from "../services/employee.service.js";
import { InsightAnalyticsService } from "../services/insight-analytics.service.js";
import type { Database } from "../db/index.js";

export type Container = {
  employeeRepository: IEmployeeRepository;
  compensationRepository: ICompensationRepository;
  analyticsRepository: IAnalyticsRepository;
  employeeService: EmployeeService;
  compensationService: CompensationService;
  analyticsService: AnalyticsService;
  employeeImportService: EmployeeImportService;
  compensationImportService: CompensationImportService;
  aiInsightsService: AiInsightsService;
};

export function createContainer(database: Database): Container {
  const employeeRepository = new DrizzleEmployeeRepository(database);
  const compensationRepository = new DrizzleCompensationRepository(database);
  const analyticsRepository = new DrizzleAnalyticsRepository(database);
  const insightAnalyticsRepository: IInsightAnalyticsRepository = analyticsRepository;
  const exchangeRateProvider = createExchangeRateProvider();
  const employeeService = new EmployeeService(employeeRepository, compensationRepository);
  const compensationService = new CompensationService(employeeRepository, compensationRepository);
  const analyticsService = new AnalyticsService(analyticsRepository, exchangeRateProvider);
  const insightAnalyticsService = new InsightAnalyticsService(
    insightAnalyticsRepository,
    exchangeRateProvider,
  );
  const employeeImportService = new EmployeeImportService(employeeRepository);
  const compensationImportService = new CompensationImportService(
    employeeRepository,
    compensationRepository,
  );
  const aiInsightsService = new AiInsightsService(insightAnalyticsService);

  return {
    employeeRepository,
    compensationRepository,
    analyticsRepository,
    employeeService,
    compensationService,
    analyticsService,
    employeeImportService,
    compensationImportService,
    aiInsightsService,
  };
}
