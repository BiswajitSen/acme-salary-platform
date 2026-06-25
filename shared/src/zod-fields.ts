import { z } from "zod";

export const isoCurrencyCodeSchema = z
  .string()
  .trim()
  .length(3, "Currency must be a 3-letter ISO 4217 code")
  .regex(/^[A-Za-z]{3}$/, "Currency must be a 3-letter ISO 4217 code")
  .transform((value) => value.toUpperCase());

export const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Effective date must use YYYY-MM-DD format");

export const requiredEffectiveDateSchema = z
  .string()
  .trim()
  .min(1, "Effective date is required")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Effective date must use YYYY-MM-DD format");
