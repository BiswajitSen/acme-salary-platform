import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      NODE_ENV: "test",
      DATABASE_URL: ":memory:",
    },
    setupFiles: ["./tests/setup.ts"],
    pool: "forks",
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: [
        "src/domain/**",
        "src/services/employee.service.ts",
        "src/services/employee-import.service.ts",
        "src/repositories/drizzle/employee*.ts",
        "src/routes/employees.route.ts",
        "src/middleware/error-handler.ts",
        "src/lib/errors.ts",
        "src/db/migrate.ts",
      ],
      exclude: ["**/*.test.ts"],
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
