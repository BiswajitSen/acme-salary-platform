import type { HealthStatus } from "@acme/shared";

import { serverEnv } from "@/lib/env";

import { apiFetch } from "./client";

export { ApiRequestError } from "./client";

export async function getHealthStatus(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>(`${serverEnv.API_URL}/api/health`, {
    cache: "no-store",
  });
}
