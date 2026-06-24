import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import type * as schema from "../db/schema.js";
import { DrizzleEmployeeRepository } from "../repositories/drizzle/employee.repository.js";
import type { IEmployeeRepository } from "../repositories/interfaces/employee.repository.js";
import { EmployeeImportService } from "../services/employee-import.service.js";
import { EmployeeService } from "../services/employee.service.js";

type Database = BetterSQLite3Database<typeof schema>;

export type Container = {
  employeeRepository: IEmployeeRepository;
  employeeService: EmployeeService;
  employeeImportService: EmployeeImportService;
};

export function createContainer(database: Database): Container {
  const employeeRepository = new DrizzleEmployeeRepository(database);
  const employeeService = new EmployeeService(employeeRepository);
  const employeeImportService = new EmployeeImportService(employeeRepository);

  return {
    employeeRepository,
    employeeService,
    employeeImportService,
  };
}
