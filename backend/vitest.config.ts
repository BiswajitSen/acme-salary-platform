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
