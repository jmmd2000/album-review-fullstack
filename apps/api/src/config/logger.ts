import { pino } from "pino";

const level = process.env.NODE_ENV === "test" ? "silent" : process.env.NODE_ENV === "production" ? "info" : "debug";

/**
 * App-wide logger. JSON lines to stdout in production where docker collects
 * them, pretty printed in development, silent under test.
 */
export const logger = pino({
  level,
  ...(process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test" ? { transport: { target: "pino-pretty", options: { colorize: true } } } : {}),
});
