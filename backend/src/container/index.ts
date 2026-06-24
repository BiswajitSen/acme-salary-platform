import { DrizzleAnalyticsRepository } from "../repositories/drizzle/analytics.repository.js";
import { DrizzleCompensationRepository } from "../repositories/drizzle/compensation.repository.js";
import { DrizzleEmployeeRepository } from "../repositories/drizzle/employee.repository.js";
import type { IAnalyticsRepository } from "../repositories/interfaces/analytics.repository.js";
import type { ICompensationRepository } from "../repositories/interfaces/compensation.repository.js";
import type { IEmployeeRepository } from "../repositories/interfaces/employee.repository.js";
import { AnalyticsService } from "../services/analytics.service.js";
import { CompensationService } from "../services/compensation.service.js";
import { CompensationImportService } from "../services/compensation-import.service.js";
import { EmployeeImportService } from "../services/employee-import.service.js";
import { EmployeeService } from "../services/employee.service.js";
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
};

export function createContainer(database: Database): Container {
  const employeeRepository = new DrizzleEmployeeRepository(database);
  const compensationRepository = new DrizzleCompensationRepository(database);
  const analyticsRepository = new DrizzleAnalyticsRepository(database);
  const employeeService = new EmployeeService(employeeRepository, compensationRepository);
  const compensationService = new CompensationService(employeeRepository, compensationRepository);
  const analyticsService = new AnalyticsService(analyticsRepository);
  const employeeImportService = new EmployeeImportService(employeeRepository);
  const compensationImportService = new CompensationImportService(
    employeeRepository,
    compensationRepository,
  );

  return {
    employeeRepository,
    compensationRepository,
    analyticsRepository,
    employeeService,
    compensationService,
    analyticsService,
    employeeImportService,
    compensationImportService,
  };
}
