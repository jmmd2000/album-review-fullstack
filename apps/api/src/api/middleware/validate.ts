import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";

export const validate = <T extends ZodType, Target extends keyof ValidationTargets>(target: Target, schema: T) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json({ message: result.error.issues[0]?.message ?? "Invalid request" }, 400);
    }
  });
