import multer from "multer";

import { AppError } from "../lib/errors.js";

export const SPREADSHEET_FIELD_NAME = "file";
export const MAX_SPREADSHEET_BYTES = 25 * 1024 * 1024;

export const uploadSpreadsheet = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SPREADSHEET_BYTES },
});

export function readUploadedSpreadsheetBuffer(
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
