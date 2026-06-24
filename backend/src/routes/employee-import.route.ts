import { Router } from "express";
import multer from "multer";

import { AppError } from "../lib/errors.js";
import type { EmployeeImportService } from "../services/employee-import.service.js";

const SPREADSHEET_FIELD_NAME = "file";
const MAX_SPREADSHEET_BYTES = 10 * 1024 * 1024;

const uploadSpreadsheet = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SPREADSHEET_BYTES },
});

type EmployeeImportRouterDeps = {
  employeeImportService: EmployeeImportService;
};

function readUploadedSpreadsheetBuffer(
  file: Express.Multer.File | undefined,
): Buffer {
  if (!file) {
    throw new AppError(400, "Spreadsheet file is required");
  }

  const hasSpreadsheetExtension = file.originalname.toLowerCase().endsWith(".xlsx");

  if (!hasSpreadsheetExtension) {
    throw new AppError(400, "Only .xlsx spreadsheets are supported");
  }

  return file.buffer;
}

export function createEmployeeImportRouter(deps: EmployeeImportRouterDeps) {
  const router = Router();

  router.post(
    "/preview",
    uploadSpreadsheet.single(SPREADSHEET_FIELD_NAME),
    async (req, res, next) => {
      try {
        const spreadsheetBuffer = readUploadedSpreadsheetBuffer(req.file);
        const preview =
          deps.employeeImportService.previewEmployeeSpreadsheet(spreadsheetBuffer);
        res.json(preview);
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    "/confirm",
    uploadSpreadsheet.single(SPREADSHEET_FIELD_NAME),
    async (req, res, next) => {
      try {
        const spreadsheetBuffer = readUploadedSpreadsheetBuffer(req.file);
        const result =
          await deps.employeeImportService.importEmployeeSpreadsheet(spreadsheetBuffer);
        res.json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
