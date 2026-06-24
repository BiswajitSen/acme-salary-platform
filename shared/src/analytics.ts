import { z } from "zod";

export const analyticsSummaryQuerySchema = z.object({
  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a 3-letter ISO 4217 code")
    .regex(/^[A-Za-z]{3}$/, "Currency must be a 3-letter ISO 4217 code")
    .transform((value) => value.toUpperCase()),
});

export type AnalyticsSummaryQuery = z.infer<typeof analyticsSummaryQuerySchema>;

export type AnalyticsSummaryResponse = {
  currency: string;
  headcount: number;
};
