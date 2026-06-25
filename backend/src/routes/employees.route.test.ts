import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { AppError } from "../lib/errors.js";
import { errorHandler } from "../middleware/error-handler.js";
import type { CompensationService } from "../services/compensation.service.js";
import type { EmployeeService } from "../services/employee.service.js";
import { createEmployeesRouter } from "./employees.route.js";

function createTestApp(
  employeeService: EmployeeService,
  compensationService: CompensationService,
) {
  const app = express();
  app.use(express.json());
  app.use(
    "/employees",
    createEmployeesRouter({ employeeService, compensationService }),
  );
  app.use(errorHandler);
  return app;
}

describe("createEmployeesRouter", () => {
  const compensationService = {
    recordCompensationChange: vi.fn(),
  } as unknown as CompensationService;

  it("returns filter options from the employee service", async () => {
    const employeeService = {
      listEmployeeFilterOptions: vi.fn().mockResolvedValue({
        countries: ["US"],
        departments: ["Engineering"],
        jobTitles: ["Senior Engineer"],
      }),
      listEmployees: vi.fn(),
    } as unknown as EmployeeService;

    const response = await request(
      createTestApp(employeeService, compensationService),
    ).get("/employees/filter-options");

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
        stats: { total: 0, active: 0, noCompensation: 0, departments: 0 },
      }),
    } as unknown as EmployeeService;

    const response = await request(createTestApp(employeeService, compensationService)).get(
      "/employees",
    );

    expect(response.status).toBe(200);
    expect(response.body.meta.totalPages).toBe(0);
  });

  it("forwards service errors to the error handler", async () => {
    const employeeService = {
      listEmployeeFilterOptions: vi.fn().mockRejectedValue(new Error("Database unavailable")),
      listEmployees: vi.fn(),
      getEmployeeProfile: vi.fn(),
      listEmployeeCompensationHistory: vi.fn(),
    } as unknown as EmployeeService;

    const response = await request(createTestApp(employeeService, compensationService)).get(
      "/employees/filter-options",
    );

    expect(response.status).toBe(500);
    expect(response.body.error).toBe("Internal Server Error");
  });

  it("returns an employee profile from the employee service", async () => {
    const employeeService = {
      listEmployeeFilterOptions: vi.fn(),
      listEmployees: vi.fn(),
      getEmployeeProfile: vi.fn().mockResolvedValue({
        id: "E001",
        fullName: "Jane Doe",
        department: "Engineering",
        jobTitle: "Senior Engineer",
        country: "US",
        currentCompensation: null,
      }),
      listEmployeeCompensationHistory: vi.fn(),
    } as unknown as EmployeeService;

    const response = await request(createTestApp(employeeService, compensationService)).get(
      "/employees/E001",
    );

    expect(response.status).toBe(200);
    expect(response.body.id).toBe("E001");
  });

  it("returns compensation history from the employee service", async () => {
    const employeeService = {
      listEmployeeFilterOptions: vi.fn(),
      listEmployees: vi.fn(),
      getEmployeeProfile: vi.fn(),
      listEmployeeCompensationHistory: vi.fn().mockResolvedValue({
        employeeId: "E001",
        entries: [],
      }),
    } as unknown as EmployeeService;

    const response = await request(createTestApp(employeeService, compensationService)).get(
      "/employees/E001/compensation",
    );

    expect(response.status).toBe(200);
    expect(response.body.employeeId).toBe("E001");
  });

  it("records a compensation change through the compensation service", async () => {
    const employeeService = {
      listEmployeeFilterOptions: vi.fn(),
      listEmployees: vi.fn(),
      getEmployeeProfile: vi.fn(),
      listEmployeeCompensationHistory: vi.fn(),
    } as unknown as EmployeeService;
    const recordingService = {
      recordCompensationChange: vi.fn().mockResolvedValue({
        entry: {
          id: 3,
          previousSalary: 132_000,
          baseSalary: 140_000,
          currency: "USD",
          effectiveDate: "2026-06-01",
          reason: "Promotion",
          changedBy: "HR Admin",
          notes: null,
          createdAt: "2026-06-02T10:00:00.000Z",
        },
      }),
    } as unknown as CompensationService;

    const response = await request(createTestApp(employeeService, recordingService))
      .post("/employees/E001/compensation")
      .send({
        baseSalary: 140_000,
        currency: "USD",
        effectiveDate: "2026-06-01",
        reason: "Promotion",
        changedBy: "HR Admin",
      });

    expect(response.status).toBe(201);
    expect(response.body.entry.baseSalary).toBe(140_000);
  });

  it("forwards compensation change validation errors to the error handler", async () => {
    const employeeService = {
      listEmployeeFilterOptions: vi.fn(),
      listEmployees: vi.fn(),
      getEmployeeProfile: vi.fn(),
      listEmployeeCompensationHistory: vi.fn(),
    } as unknown as EmployeeService;
    const recordingService = {
      recordCompensationChange: vi
        .fn()
        .mockRejectedValue(new AppError(404, "Employee E404 not found")),
    } as unknown as CompensationService;

    const response = await request(createTestApp(employeeService, recordingService))
      .post("/employees/E404/compensation")
      .send({
        baseSalary: 140_000,
        currency: "USD",
        effectiveDate: "2026-06-01",
        reason: "Promotion",
        changedBy: "HR Admin",
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Employee E404 not found");
  });

  it("maps profile not found errors to 404", async () => {
    const employeeService = {
      listEmployeeFilterOptions: vi.fn(),
      listEmployees: vi.fn(),
      getEmployeeProfile: vi
        .fn()
        .mockRejectedValue(new AppError(404, "Employee E404 not found")),
      listEmployeeCompensationHistory: vi.fn(),
    } as unknown as EmployeeService;

    const response = await request(createTestApp(employeeService, compensationService)).get(
      "/employees/E404",
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Employee E404 not found");
  });

  it("forwards compensation history errors to the error handler", async () => {
    const employeeService = {
      listEmployeeFilterOptions: vi.fn(),
      listEmployees: vi.fn(),
      getEmployeeProfile: vi.fn(),
      listEmployeeCompensationHistory: vi
        .fn()
        .mockRejectedValue(new AppError(404, "Employee E404 not found")),
    } as unknown as EmployeeService;

    const response = await request(createTestApp(employeeService, compensationService)).get(
      "/employees/E404/compensation",
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Employee E404 not found");
  });
});
