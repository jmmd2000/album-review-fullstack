import type { Request, Response } from "express";
import { SettingsService } from "@/api/services/settingsService";
import { ArtistService } from "@/api/services/artistService";
import { asyncHandler } from "../middleware/asyncHandler";
import z from "zod";
import { AppError } from "../middleware/errorHandler";

export const getAllLastRuns = asyncHandler(async (_req: Request, res: Response) => {
  const lastRuns = await SettingsService.getAllLastRuns();
  res.status(200).json(lastRuns);
});

const getLastRunSchema = z.object({
  type: z.enum(["images", "headers", "scores"]),
});

export const getLastRun = asyncHandler(async (req: Request, res: Response) => {
  const parsed = getLastRunSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError("Resource must be 'images', 'headers', or 'scores'", 400);
  }
  const lastRun = await SettingsService.getLastRun(parsed.data.type);
  res.status(200).json({ lastRun });
});

const settingKeySchema = z.object({
  key: z.string().min(1),
});

const setSettingSchema = z.object({
  value: z.string(),
});

export const getSetting = asyncHandler(async (req: Request, res: Response) => {
  const parsed = settingKeySchema.safeParse(req.params);
  if (!parsed.success) throw new AppError("Setting key is required", 400);

  const value = await SettingsService.get(parsed.data.key);
  res.status(200).json({ key: parsed.data.key, value });
});

export const setSetting = asyncHandler(async (req: Request, res: Response) => {
  const keyParsed = settingKeySchema.safeParse(req.params);
  if (!keyParsed.success) throw new AppError("Setting key is required", 400);

  const bodyParsed = setSettingSchema.safeParse(req.body);
  if (!bodyParsed.success) throw new AppError("Setting value is required", 400);

  await SettingsService.set(keyParsed.data.key, bodyParsed.data.value);
  res.status(200).json({ key: keyParsed.data.key, value: bodyParsed.data.value, message: "Setting updated successfully" });
});

export const recalculateArtistScores = asyncHandler(async (_req: Request, res: Response) => {
  const result = await ArtistService.recalculateAllArtistScores();
  await SettingsService.setLastRun("scores");
  res.status(200).json(result);
});
