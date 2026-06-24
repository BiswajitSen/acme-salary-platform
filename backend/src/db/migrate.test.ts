import { describe, expect, it, vi, afterEach } from "vitest";

import { logger } from "../config/logger.js";
import { pool } from "./index.js";
import { runMigrateCli, runMigrations } from "./migrate.js";

describe("runMigrations", () => {
  it("applies migrations to the configured database", async () => {
    await expect(runMigrations()).resolves.toBeUndefined();
  });
});

describe("runMigrateCli", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  it("runs migrations when invoked as a script entrypoint", async () => {
    const endSpy = vi.spyOn(pool, "end").mockResolvedValue(undefined);

    await expect(
      Promise.resolve(runMigrateCli(["node", "migrate.ts"])),
    ).resolves.toBeUndefined();

    await vi.waitFor(() => {
      expect(endSpy).toHaveBeenCalledOnce();
    });
  });

  it("sets a non-zero exit code when migrations fail from the cli entrypoint", async () => {
    vi.spyOn(pool, "end").mockResolvedValue(undefined);
    vi.spyOn(logger, "error").mockImplementation(() => undefined);

    runMigrateCli(["node", "migrate.ts"], {
      runMigrationsImpl: vi.fn().mockRejectedValue(new Error("migration failed")),
    });

    await vi.waitFor(() => {
      expect(process.exitCode).toBe(1);
    });
    expect(logger.error).toHaveBeenCalledOnce();
  });

  it("skips migrations when imported as a module", () => {
    expect(() => runMigrateCli(["node", "vitest"])).not.toThrow();
  });
});
