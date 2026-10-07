const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"];
const DEV_OR_TEST_ENDINGS = ["_dev", "_test", "_test_e2e"];
const TEST_ENDINGS = ["_test", "_test_e2e"];

/** The database name in a connection URL, without the "_w<n>" a Vitest worker's copy adds */
function baseDatabaseName(databaseURL: string): string {
  const name = new URL(databaseURL).pathname.slice(1);
  return name.replace(/_w\d+$/, "");
}

/**
 * Throws unless the URL points at a local dev or test database, so a wipe or a seed can never reach production.
 * The host must be local and the database name must end in _dev, _test or _test_e2e.
 *
 * @param databaseURL The connection URL the wipe or seed will use.
 * @throws If NODE_ENV is "production", the host isn't local, or the name doesn't end in a dev or test ending.
 */
export function assertSafeToWipe(databaseURL: string): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to wipe or seed: NODE_ENV is production");
  }

  const url = new URL(databaseURL);
  const name = baseDatabaseName(databaseURL);

  if (!LOCAL_HOSTS.includes(url.hostname)) {
    throw new Error(`Refusing to wipe or seed "${name}": host "${url.hostname}" is not local`);
  }

  if (!DEV_OR_TEST_ENDINGS.some(ending => name.endsWith(ending))) {
    throw new Error(`Refusing to wipe or seed "${name}": the name must end in _dev, _test or _test_e2e`);
  }
}

/**
 * Throws unless tests are running against a local test database. Tests wipe before every run,
 * so they get this stricter check on top of assertSafeToWipe.
 *
 * @param databaseURL The connection URL the tests will use, such as DATABASE_URL_TEST.
 * @throws If NODE_ENV isn't "test", the URL is missing, or the database isn't a local one whose name ends in _test or _test_e2e.
 */
export function assertTestDatabase(databaseURL: string | undefined): asserts databaseURL is string {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(`Refusing to wipe for tests: NODE_ENV is "${process.env.NODE_ENV ?? "undefined"}", not "test"`);
  }

  if (!databaseURL) {
    throw new Error("Refusing to wipe for tests: DATABASE_URL_TEST is not set");
  }

  assertSafeToWipe(databaseURL);

  const name = baseDatabaseName(databaseURL);
  if (!TEST_ENDINGS.some(ending => name.endsWith(ending))) {
    throw new Error(`Refusing to wipe "${name}" for tests: the name must end in _test or _test_e2e`);
  }
}
