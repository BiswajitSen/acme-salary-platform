import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "lib/api/employees.ts",
        "lib/api/client.ts",
        "lib/hooks/use-debounced-value.ts",
        "components/employee-directory/employee-directory.tsx",
      ],
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
      "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "."),
    },
  },
});
