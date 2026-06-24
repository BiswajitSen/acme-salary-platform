import { z } from "zod";

const serverEnvSchema = z.object({
  API_URL: z.string().url().default("http://localhost:8000"),
});

export const serverEnv = serverEnvSchema.parse({
  API_URL: process.env.API_URL,
});
