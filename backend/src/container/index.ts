import { DrizzleCompensationRepository } from "../repositories/drizzle/compensation.repository.js";
import { DrizzleEmployeeRepository } from "../repositories/drizzle/employee.repository.js";
import type { ICompensationRepository } from "../repositories/interfaces/compensation.repository.js";
import type { IEmployeeRepository } from "../repositories/interfaces/employee.repository.js";
import { CompensationService } from "../services/compensation.service.js";
import { CompensationImportService } from "../services/compensation-import.service.js";
import { EmployeeImportService } from "../services/employee-import.service.js";
import { EmployeeService } from "../services/employee.service.js";
import type { Database } from "../db/index.js";

export type Container = {
  employeeRepository: IEmployeeRepository;
  compensationRepository: ICompensationRepository;
  employeeService: EmployeeService;
  compensationService: CompensationService;
  employeeImportService: EmployeeImportService;
  compensationImportService: CompensationImportService;
};

export function createContainer(database: Database): Container {
  const employeeRepository = new DrizzleEmployeeRepository(database);
  const compensationRepository = new DrizzleCompensationRepository(database);
  const employeeService = new EmployeeService(employeeRepository, compensationRepository);
  const compensationService = new CompensationService(employeeRepository, compensationRepository);
  const employeeImportService = new EmployeeImportService(employeeRepository);
  const compensationImportService = new CompensationImportService(
    employeeRepository,
    compensationRepository,
  );

  return {
    employeeRepository,
    compensationRepository,
    employeeService,
    compensationService,
    employeeImportService,
    compensationImportService,
  };
}
