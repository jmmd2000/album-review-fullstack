import { Request, Response } from "express";
import { SpotifyService } from "../services/spotifyService";

export const getAccessToken = async (_req: Request, res: Response) => {
  try {
    const token = await SpotifyService.getAccessToken();
    res.status(200).json({ token });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};
