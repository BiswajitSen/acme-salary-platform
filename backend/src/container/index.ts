import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import type * as schema from "../db/schema.js";
import { DrizzleCompensationRepository } from "../repositories/drizzle/compensation.repository.js";
import { DrizzleEmployeeRepository } from "../repositories/drizzle/employee.repository.js";
import type { ICompensationRepository } from "../repositories/interfaces/compensation.repository.js";
import type { IEmployeeRepository } from "../repositories/interfaces/employee.repository.js";
import { EmployeeImportService } from "../services/employee-import.service.js";
import { CompensationService } from "../services/compensation.service.js";
import { EmployeeService } from "../services/employee.service.js";

type Database = BetterSQLite3Database<typeof schema>;

export type Container = {
  employeeRepository: IEmployeeRepository;
  compensationRepository: ICompensationRepository;
  employeeService: EmployeeService;
  compensationService: CompensationService;
  employeeImportService: EmployeeImportService;
};

export function createContainer(database: Database): Container {
  const employeeRepository = new DrizzleEmployeeRepository(database);
  const compensationRepository = new DrizzleCompensationRepository(database);
  const employeeService = new EmployeeService(employeeRepository, compensationRepository);
  const compensationService = new CompensationService(employeeRepository, compensationRepository);
  const employeeImportService = new EmployeeImportService(employeeRepository);

  return {
    employeeRepository,
    compensationRepository,
    employeeService,
    compensationService,
    employeeImportService,
  };
}
