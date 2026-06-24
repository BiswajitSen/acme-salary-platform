import { Router } from "express";

import type { CompensationImportService } from "../services/compensation-import.service.js";
import {
  readUploadedSpreadsheetBuffer,
  SPREADSHEET_FIELD_NAME,
  uploadSpreadsheet,
} from "./spreadsheet-upload.js";

type CompensationImportRouterDeps = {
  compensationImportService: CompensationImportService;
};

export function createCompensationImportRouter(deps: CompensationImportRouterDeps) {
  const router = Router();

  router.post(
    "/preview",
    uploadSpreadsheet.single(SPREADSHEET_FIELD_NAME),
    async (req, res, next) => {
      try {
        const spreadsheetBuffer = readUploadedSpreadsheetBuffer(req.file);
        const preview =
          await deps.compensationImportService.previewCompensationSpreadsheet(
            spreadsheetBuffer,
          );
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
          await deps.compensationImportService.importCompensationSpreadsheet(
            spreadsheetBuffer,
          );
        res.json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
