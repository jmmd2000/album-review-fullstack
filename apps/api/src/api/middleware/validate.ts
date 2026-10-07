import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";

/**
 * Checks one part of the request against a schema. A failure replies with the first issue's message.
 * The status is 400 by default. Id params pass 404, because an id that can't exist means "not found".
 */
export const validate = <T extends ZodType, Target extends keyof ValidationTargets>(target: Target, schema: T, failureStatus: 400 | 404 = 400) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json({ message: result.error.issues[0]?.message ?? "Invalid request" }, failureStatus);
    }
  });
