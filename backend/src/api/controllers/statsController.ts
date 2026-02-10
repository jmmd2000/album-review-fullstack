import { Request, Response } from "express";
import { StatsService } from "@/api/services/statsService";
import { asyncHandler } from "../middleware/asyncHandler";
import { AppError } from "../middleware/errorHandler";
import z from "zod";

export const getFavourites = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await StatsService.getFavourites();
  res.status(200).json(stats);
});

export const getGenreStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await StatsService.getGenreStats(req.query.slug as string | undefined);
  res.status(200).json(stats);
});

const getRatingDistributionSchema = z.object({
  resource: z.enum(["albums", "tracks", "artists"]),
});

export const getRatingDistribution = asyncHandler(async (req: Request, res: Response) => {
  const parsed = getRatingDistributionSchema.safeParse({ resource: req.query.resource });
  if (!parsed.success) {
    throw new AppError("Resource must be 'albums', 'tracks', or 'artists'", 400);
  }
  const stats = await StatsService.getRatingDistribution(parsed.data.resource);
  res.status(200).json(stats);
});

export const getResourceCounts = asyncHandler(async (_req: Request, res: Response) => {
  const counts = await StatsService.getResourceCounts();
  res.status(200).json(counts);
});
