import { Request, Response } from "express";
import { TrackService } from "@/api/services/trackService";
import { asyncHandler } from "../middleware/asyncHandler";
import { AppError } from "../middleware/errorHandler";

export const getTracksByAlbumID = asyncHandler(async (req: Request, res: Response) => {
  const albumID = req.params.albumID;
  if (!albumID) throw new AppError("Album ID is required", 400);

  const albumTracks = await TrackService.getAlbumTracks(req.params.albumID);
  res.status(200).json(albumTracks);
});

export const deleteTracksByAlbumID = asyncHandler(async (req: Request, res: Response) => {
  const albumID = req.params.albumID;
  if (!albumID) throw new AppError("Album ID is required", 400);

  await TrackService.deleteTracksByAlbumID(req.params.albumID);
  res.status(204).end();
});
