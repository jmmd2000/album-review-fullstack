import { Request, Response } from "express";
import { SpotifyService } from "@/api/services/spotifyService";
import { SearchAlbumsOptions } from "@shared/types";

export const getAccessToken = async (_req: Request, res: Response) => {
  try {
    const token = await SpotifyService.getAccessToken();
    res.status(200).setHeader("Content-Type", "application/json").json({ token });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const searchAlbums = async (req: Request, res: Response) => {
  const query: SearchAlbumsOptions = {
    query: req.query.query as string,
  };
  try {
    const spotifyResponse = await SpotifyService.searchAlbums(query);
    res.status(200).json(spotifyResponse);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const getAlbum = async (req: Request, res: Response) => {
  const albumID = req.params.albumID;
  const includeGenres = req.query.includeGenres !== "false";
  try {
    const spotifyAlbumData = await SpotifyService.getAlbum(albumID, includeGenres);
    res.status(200).json(spotifyAlbumData);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};
