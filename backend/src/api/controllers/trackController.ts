import { Request, Response } from "express";
import { TrackService } from "../services/trackService";

export const getTracksByAlbumID = async (req: Request, res: Response) => {
  const albumID = req.params.albumID;
  try {
    const albumTracks = await TrackService.getAlbumTracks(albumID);
    res.status(200).json(albumTracks);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const deleteTracksByAlbumID = async (req: Request, res: Response) => {
  const albumID = req.params.albumID;
  try {
    await TrackService.deleteTracksByAlbumID(albumID);
    res.status(204).end();
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};
