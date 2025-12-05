import { Request, Response } from "express";
import { SettingsService } from "@/api/services/settingsService";
import { ArtistService } from "@/api/services/artistService";

export const getAllLastRuns = async (req: Request, res: Response) => {
  try {
    const lastRuns = await SettingsService.getAllLastRuns();
    res.status(200).json(lastRuns);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const getLastRun = async (req: Request, res: Response) => {
  const { type } = req.params;

  if (type !== "images" && type !== "headers" && type !== "scores") {
    return res.status(400).json({
      message: "Type must be 'images', 'headers', or 'scores'",
    });
  }

  try {
    const lastRun = await SettingsService.getLastRun(
      type as "images" | "headers" | "scores"
    );
    res.status(200).json({ lastRun });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const getSetting = async (req: Request, res: Response) => {
  const { key } = req.params;

  try {
    const value = await SettingsService.get(key);
    res.status(200).json({ key, value });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const setSetting = async (req: Request, res: Response) => {
  const { key } = req.params;
  const { value } = req.body;

  if (value === undefined) {
    return res.status(400).json({ message: "Value is required" });
  }

  try {
    await SettingsService.set(key, value);
    res
      .status(200)
      .json({ key, value, message: "Setting updated successfully" });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const recalculateArtistScores = async (_req: Request, res: Response) => {
  try {
    const result = await ArtistService.recalculateAllArtistScores();
    await SettingsService.setLastRun("scores");
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};
