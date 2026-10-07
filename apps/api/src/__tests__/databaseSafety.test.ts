import { afterEach, describe, expect, test } from "vitest";
import { assertSafeToWipe, assertTestDatabase } from "@/db/databaseSafety";

const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
});

describe("assertSafeToWipe", () => {
  test.each([
    "postgres://admin:secret@localhost:5432/albums_dev",
    "postgres://admin:secret@127.0.0.1:5432/albums_test",
    "postgres://admin:secret@localhost:5432/albums_test_w3",
    "postgres://admin:secret@[::1]:5432/albums_test_e2e",
  ])("allows %s", databaseURL => {
    process.env.NODE_ENV = "development";
    expect(() => assertSafeToWipe(databaseURL)).not.toThrow();
  });

  test.each([
    ["a remote host", "postgres://admin:secret@db.example.com:5432/albums_dev", /not local/],
    ["the compose network host", "postgres://admin:secret@db:5432/albums_dev", /not local/],
    ["a name with no dev or test ending", "postgres://admin:secret@localhost:5432/album-reviews-db", /must end in/],
    ["a worker suffix on a production name", "postgres://admin:secret@localhost:5432/album-reviews-db_w1", /must end in/],
  ])("refuses %s", (_label, databaseURL, message) => {
    process.env.NODE_ENV = "development";
    expect(() => assertSafeToWipe(databaseURL)).toThrow(message);
  });

  test("refuses anything in production, even a local dev database", () => {
    process.env.NODE_ENV = "production";
    expect(() => assertSafeToWipe("postgres://admin:secret@localhost:5432/albums_dev")).toThrow(/production/);
  });
});

describe("assertTestDatabase", () => {
  test("allows a local test database while tests run", () => {
    process.env.NODE_ENV = "test";
    expect(() => assertTestDatabase("postgres://admin:secret@localhost:5432/albums_test")).not.toThrow();
    expect(() => assertTestDatabase("postgres://admin:secret@localhost:5432/albums_test_e2e")).not.toThrow();
  });

  test("refuses the dev database, even while tests run", () => {
    process.env.NODE_ENV = "test";
    expect(() => assertTestDatabase("postgres://admin:secret@localhost:5432/albums_dev")).toThrow(/_test or _test_e2e/);
  });

  test("refuses a test database when NODE_ENV isn't test", () => {
    process.env.NODE_ENV = "development";
    expect(() => assertTestDatabase("postgres://admin:secret@localhost:5432/albums_test")).toThrow(/NODE_ENV/);
  });

  test("refuses when there's no test database URL", () => {
    process.env.NODE_ENV = "test";
    expect(() => assertTestDatabase(undefined)).toThrow(/DATABASE_URL_TEST/);
  });
});
