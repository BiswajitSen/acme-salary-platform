import { describe, expect, it } from "vitest";

import type { CompensationImportValidationErrorResponse } from "@acme/shared";

import {
  confirmCompensationImport,
  previewCompensationImport,
  readCompensationImportValidationIssues,
} from "./compensation-import";
import { ApiRequestError } from "./client";

describe("previewCompensationImport", () => {
  it("uploads a spreadsheet to the preview endpoint", async () => {
    const originalFetch = global.fetch;
    const file = new File(["spreadsheet"], "compensation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    global.fetch = async (input, init) => {
      expect(String(input)).toBe("/api/backend/import/compensation/preview");
      expect(init?.method).toBe("POST");
      expect(init?.body).toBeInstanceOf(FormData);

      return new Response(
        JSON.stringify({
          recordCount: 0,
          errors: [],
          isValid: true,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    await expect(previewCompensationImport(file)).resolves.toEqual({
      recordCount: 0,
      errors: [],
      isValid: true,
    });
    global.fetch = originalFetch;
  });

  it("throws an api error when preview upload fails without a json body", async () => {
    const originalFetch = global.fetch;
    const file = new File(["spreadsheet"], "compensation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    global.fetch = async () =>
      new Response("not-json", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });

    await expect(previewCompensationImport(file)).rejects.toMatchObject({
      message: "Request failed with status 500",
      status: 500,
    });
    global.fetch = originalFetch;
  });

  it("throws an api error with the backend validation message", async () => {
    const originalFetch = global.fetch;
    const file = new File(["spreadsheet"], "compensation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    global.fetch = async () =>
      new Response(
        JSON.stringify({
          error: "CompensationImportValidationError",
          message: "Compensation spreadsheet validation failed",
          errors: [
            { rowNumber: 2, field: "employeeId", message: "Employee ID is required" },
          ],
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );

    await expect(previewCompensationImport(file)).rejects.toMatchObject({
      message: "Compensation spreadsheet validation failed",
      status: 400,
    });
    global.fetch = originalFetch;
  });
});

describe("confirmCompensationImport", () => {
  it("uploads a spreadsheet to the confirm endpoint", async () => {
    const originalFetch = global.fetch;
    const file = new File(["spreadsheet"], "compensation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    global.fetch = async (input) => {
      expect(String(input)).toBe("/api/backend/import/compensation/confirm");

      return new Response(
        JSON.stringify({ inserted: 2, total: 2 }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    await expect(confirmCompensationImport(file)).resolves.toEqual({
      inserted: 2,
      total: 2,
    });
    global.fetch = originalFetch;
  });
});

describe("readCompensationImportValidationIssues", () => {
  it("returns row errors from an import validation response", () => {
    expect(
      readCompensationImportValidationIssues(
        new ApiRequestError(
          "Import failed",
          400,
          {
            error: "CompensationImportValidationError",
            message: "Import failed",
            errors: [
              { rowNumber: 2, field: "employeeId", message: "Employee ID is required" },
            ],
          } as CompensationImportValidationErrorResponse,
        ),
      ),
    ).toEqual([{ rowNumber: 2, field: "employeeId", message: "Employee ID is required" }]);
  });

  it("returns an empty list for api errors without row details", () => {
    expect(
      readCompensationImportValidationIssues(new ApiRequestError("Import failed", 400)),
    ).toEqual([]);
  });

  it("returns an empty list for non-api errors", () => {
    expect(readCompensationImportValidationIssues(new Error("Network"))).toEqual([]);
  });
});
