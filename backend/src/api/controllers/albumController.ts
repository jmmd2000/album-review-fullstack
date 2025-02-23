import { Request, Response } from "express";
import { AlbumService } from "../services/albumService";

export const getAlbum = async (req: Request, res: Response) => {
  const albumID = req.params.albumID;
  try {
    const reviewedAlbum = await AlbumService.getAlbumByID(albumID);
    res.status(200).json(reviewedAlbum);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};
