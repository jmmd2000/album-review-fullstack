import { Request, Response } from "express";
import { SpotifyService } from "@/api/services/spotifyService";
import { SearchAlbumsOptions } from "@shared/types";
import { asyncHandler } from "../middleware/asyncHandler";
import { AppError } from "../middleware/errorHandler";

export const getAccessToken = asyncHandler(async (_req: Request, res: Response) => {
  const token = await SpotifyService.getAccessToken();
  res.status(200).setHeader("Content-Type", "application/json").json({ token });
});

export const searchAlbums = asyncHandler(async (req: Request, res: Response) => {
  const query: SearchAlbumsOptions = { query: req.query.query as string };
  if (!query.query || query.query.trim() === "")
    throw new AppError("Search query is required.", 400);
  const spotifyResponse = await SpotifyService.searchAlbums(query);
  res.status(200).json(spotifyResponse);
});

export const getAlbum = asyncHandler(async (req: Request, res: Response) => {
  const albumID = req.params.albumID as string;
  if (!albumID) throw new AppError("Album ID is required.", 400);

  const spotifyAlbumData = await SpotifyService.getAlbum(
    albumID,
    req.query.includeGenres !== "false"
  );
  res.status(200).json(spotifyAlbumData);
});
