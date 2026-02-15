import { Request, Response } from "express";
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

export const getSetting = asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params as { key: string };
  const value = await SettingsService.get(key);
  res.status(200).json({ key, value });
});

export const setSetting = asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params as { key: string };
  const { value } = req.body;

  await SettingsService.set(key, value);
  res.status(200).json({ key, value, message: "Setting updated successfully" });
});

export const recalculateArtistScores = asyncHandler(async (_req: Request, res: Response) => {
  const result = await ArtistService.recalculateAllArtistScores();
  await SettingsService.setLastRun("scores");
  res.status(200).json(result);
});
