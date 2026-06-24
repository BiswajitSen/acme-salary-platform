import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://acme:acme@localhost:5433/acme_salary_test",
    },
    setupFiles: ["./tests/setup.ts"],
    pool: "forks",
    fileParallelism: false,
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      provider: "v8",
      include: [
        "src/domain/**",
        "src/services/employee.service.ts",
        "src/services/compensation.service.ts",
        "src/services/employee-import.service.ts",
        "src/services/compensation-import.service.ts",
        "src/services/analytics.service.ts",
        "src/services/insight-analytics.service.ts",
        "src/services/ai-insights.service.ts",
        "src/repositories/drizzle/employee*.ts",
        "src/repositories/drizzle/compensation.repository.ts",
        "src/repositories/drizzle/analytics.repository.ts",
        "src/routes/employees.route.ts",
        "src/routes/employee-import.route.ts",
        "src/routes/compensation-import.route.ts",
        "src/routes/analytics.route.ts",
        "src/routes/ai-insights.route.ts",
        "src/routes/spreadsheet-upload.ts",
        "src/middleware/error-handler.ts",
        "src/lib/errors.ts",
        "src/db/migrate.ts",
        "src/db/ensure-compensation-month-partition.ts",
      ],
      exclude: ["**/*.test.ts", "src/domain/compensation.types.ts"],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
  resolve: {
    alias: {
      "@acme/shared": path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../shared/src/index.ts",
      ),
    },
  },
});
