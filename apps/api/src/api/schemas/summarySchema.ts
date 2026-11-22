import { z } from "zod";

/** The most days one summary request can cover */
export const SUMMARY_MAX_DAYS = 31;

const DAY_MS = 24 * 60 * 60 * 1000;
const dateSchema = z.iso.date({ error: "Give dates as YYYY-MM-DD." });

/** How many days a range covers, counting both ends */
const daysCovered = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS) + 1;

export const summaryQuerySchema = z
  .object({ from: dateSchema, to: dateSchema })
  .refine(query => query.from <= query.to, { error: "The start date must be on or before the end date." })
  .refine(query => daysCovered(query.from, query.to) <= SUMMARY_MAX_DAYS, { error: `Ask for ${SUMMARY_MAX_DAYS} days or fewer.` });
