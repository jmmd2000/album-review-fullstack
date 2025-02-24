import { Request, Response } from "express";
import { AlbumService } from "../services/albumService";
import { SpotifyAlbum } from "../../../types";

export type ReceivedReviewData = {
  ratedTracks: { id: string; rating: number }[];
  bestSong: string;
  worstSong: string;
  reviewContent: string;
  album: SpotifyAlbum;
};

export const createAlbumReview = async (req: Request, res: Response) => {
  const reviewData: ReceivedReviewData = req.body;
  console.log(reviewData.ratedTracks);
  try {
    const reviewedAlbum = await AlbumService.createAlbumReview(reviewData);
    res.status(201).json(reviewedAlbum);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const getAlbumByID = async (req: Request, res: Response) => {
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
