import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { errorHandler } from "../middleware/error-handler.js";
import type { EmployeeService } from "../services/employee.service.js";
import { createEmployeesRouter } from "./employees.route.js";

function createTestApp(employeeService: EmployeeService) {
  const app = express();
  app.use("/employees", createEmployeesRouter({ employeeService }));
  app.use(errorHandler);
  return app;
}

describe("createEmployeesRouter", () => {
  it("returns filter options from the employee service", async () => {
    const employeeService = {
      listEmployeeFilterOptions: vi.fn().mockResolvedValue({
        countries: ["US"],
        departments: ["Engineering"],
        jobTitles: ["Senior Engineer"],
      }),
      listEmployees: vi.fn(),
    } as unknown as EmployeeService;

    const response = await request(createTestApp(employeeService)).get(
      "/employees/filter-options",
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      countries: ["US"],
      departments: ["Engineering"],
      jobTitles: ["Senior Engineer"],
    });
  });

  it("returns employees from the employee service", async () => {
    const employeeService = {
      listEmployeeFilterOptions: vi.fn(),
      listEmployees: vi.fn().mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
      }),
    } as unknown as EmployeeService;

    const response = await request(createTestApp(employeeService)).get("/employees");

    expect(response.status).toBe(200);
    expect(response.body.meta.totalPages).toBe(0);
  });

  it("forwards service errors to the error handler", async () => {
    const employeeService = {
      listEmployeeFilterOptions: vi.fn().mockRejectedValue(new Error("Database unavailable")),
      listEmployees: vi.fn(),
    } as unknown as EmployeeService;

    const response = await request(createTestApp(employeeService)).get(
      "/employees/filter-options",
    );

    expect(response.status).toBe(500);
    expect(response.body.error).toBe("Internal Server Error");
  });
});
