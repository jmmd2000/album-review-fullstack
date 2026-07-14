import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { resetTables } from "./testUtils";

describe("resetTables safety guard", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalTestDatabaseUrl = process.env.DATABASE_URL_TEST;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.DATABASE_URL_TEST = originalTestDatabaseUrl;
  });

  test("refuses to run, and never queries, when NODE_ENV is not 'test'", async () => {
    process.env.NODE_ENV = "development";
    const query = jest.fn<(text: string, params?: unknown[]) => Promise<unknown>>();

    await expect(resetTables(query)).rejects.toThrow(/NODE_ENV/);
    expect(query).not.toHaveBeenCalled();
  });

  test("refuses to run, and never queries, when DATABASE_URL_TEST is unset", async () => {
    process.env.NODE_ENV = "test";
    delete process.env.DATABASE_URL_TEST;
    const query = jest.fn<(text: string, params?: unknown[]) => Promise<unknown>>();

    await expect(resetTables(query)).rejects.toThrow(/DATABASE_URL_TEST/);
    expect(query).not.toHaveBeenCalled();
  });
});