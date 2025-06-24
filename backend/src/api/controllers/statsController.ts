import { Request, Response } from "express";
import { StatsService } from "@/api/services/statsService";

export const getFavourites = async (_req: Request, res: Response) => {
  try {
    const stats = await StatsService.getFavourites();
    res.status(200).json(stats);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const getGenreStats = async (req: Request, res: Response) => {
  const slug = req.query.slug as string | undefined;

  try {
    const stats = await StatsService.getGenreStats(slug);
    res.status(200).json(stats);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const getRatingDistribution = async (_req: Request, res: Response) => {
  try {
    const stats = await StatsService.getRatingDistribution();
    res.status(200).json(stats);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const getResourceCounts = async (_req: Request, res: Response) => {
  try {
    const counts = await StatsService.getResourceCounts();
    res.status(200).json(counts);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};
