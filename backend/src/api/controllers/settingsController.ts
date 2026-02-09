import { Request, Response } from "express";
import { SettingsService } from "@/api/services/settingsService";
import { ArtistService } from "@/api/services/artistService";
import { asyncHandler } from "../middleware/asyncHandler";

export const getAllLastRuns = asyncHandler(async (_req: Request, res: Response) => {
  const lastRuns = await SettingsService.getAllLastRuns();
  res.status(200).json(lastRuns);
});

export const getLastRun = asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.params;
  const lastRun = await SettingsService.getLastRun(type as "images" | "headers" | "scores");
  res.status(200).json({ lastRun });
});

export const getSetting = asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params;
  const value = await SettingsService.get(key);
  res.status(200).json({ key, value });
});

export const setSetting = asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params;
  const { value } = req.body;

  await SettingsService.set(key, value);
  res.status(200).json({ key, value, message: "Setting updated successfully" });
});

export const recalculateArtistScores = asyncHandler(async (_req: Request, res: Response) => {
  const result = await ArtistService.recalculateAllArtistScores();
  await SettingsService.setLastRun("scores");
  res.status(200).json(result);
});
