import { describe, expect, it } from "vitest";

import type { EmployeeImportValidationErrorResponse } from "@acme/shared";

import {
  confirmEmployeeImport,
  previewEmployeeImport,
  readEmployeeImportValidationIssues,
} from "./employee-import";
import { ApiRequestError } from "./client";

describe("previewEmployeeImport", () => {
  it("uploads a spreadsheet to the preview endpoint", async () => {
    const originalFetch = global.fetch;
    const file = new File(["spreadsheet"], "employees.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    global.fetch = async (input, init) => {
      expect(String(input)).toBe("/api/backend/import/preview");
      expect(init?.method).toBe("POST");
      expect(init?.body).toBeInstanceOf(FormData);

      return new Response(
        JSON.stringify({
          employees: [],
          errors: [],
          isValid: true,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    await expect(previewEmployeeImport(file)).resolves.toEqual({
      employees: [],
      errors: [],
      isValid: true,
    });
    global.fetch = originalFetch;
  });

  it("throws an api error when preview upload fails without a json body", async () => {
    const originalFetch = global.fetch;
    const file = new File(["spreadsheet"], "employees.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    global.fetch = async () =>
      new Response("not-json", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });

    await expect(previewEmployeeImport(file)).rejects.toMatchObject({
      message: "Request failed with status 500",
      status: 500,
    });
    global.fetch = originalFetch;
  });

  it("throws an api error with the backend validation message", async () => {
    const originalFetch = global.fetch;
    const file = new File(["spreadsheet"], "employees.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    global.fetch = async () =>
      new Response(
        JSON.stringify({
          error: "EmployeeImportValidationError",
          message: "Employee spreadsheet validation failed",
          errors: [{ rowNumber: 2, field: "id", message: "Employee ID is required" }],
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );

    await expect(previewEmployeeImport(file)).rejects.toMatchObject({
      message: "Employee spreadsheet validation failed",
      status: 400,
    });
    global.fetch = originalFetch;
  });
});

describe("confirmEmployeeImport", () => {
  it("uploads a spreadsheet to the confirm endpoint", async () => {
    const originalFetch = global.fetch;
    const file = new File(["spreadsheet"], "employees.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    global.fetch = async (input) => {
      expect(String(input)).toBe("/api/backend/import/confirm");

      return new Response(
        JSON.stringify({ inserted: 2, updated: 1, total: 3 }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    await expect(confirmEmployeeImport(file)).resolves.toEqual({
      inserted: 2,
      updated: 1,
      total: 3,
    });
    global.fetch = originalFetch;
  });
});

describe("readEmployeeImportValidationIssues", () => {
  it("returns row errors from an import validation response", () => {
    expect(
      readEmployeeImportValidationIssues(
        new ApiRequestError(
          "Import failed",
          400,
          {
            error: "EmployeeImportValidationError",
            message: "Import failed",
            errors: [{ rowNumber: 2, field: "id", message: "Employee ID is required" }],
          } as EmployeeImportValidationErrorResponse,
        ),
      ),
    ).toEqual([{ rowNumber: 2, field: "id", message: "Employee ID is required" }]);
  });

  it("returns an empty list for api errors without row details", () => {
    expect(
      readEmployeeImportValidationIssues(new ApiRequestError("Import failed", 400)),
    ).toEqual([]);
  });

  it("returns an empty list for non-api errors", () => {
    expect(readEmployeeImportValidationIssues(new Error("Network"))).toEqual([]);
  });
});
