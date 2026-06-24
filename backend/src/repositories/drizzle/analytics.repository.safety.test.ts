import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repositoryPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "analytics.repository.ts",
);

describe("DrizzleAnalyticsRepository SQL safety", () => {
  it("uses parameterized drizzle sql templates without raw string interpolation", () => {
    const source = readFileSync(repositoryPath, "utf8");

    expect(source).not.toMatch(/sql\.raw\(/);
    expect(source).not.toMatch(/\+ *['"`]/);
    expect(source.match(/sql`/g)?.length).toBeGreaterThan(0);
  });
});
