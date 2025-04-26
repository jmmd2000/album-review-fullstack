import { Request, Response } from "express";
import { AlbumService } from "@/api/services/albumService";
import { DisplayTrack, ExtractedColor, GetPaginatedAlbumsOptions, ReviewedAlbum, SpotifyAlbum } from "@shared/types";

export type ReceivedReviewData = {
  ratedTracks: DisplayTrack[];
  bestSong: string;
  worstSong: string;
  reviewContent: string;
  album: SpotifyAlbum | ReviewedAlbum;
  colors: ExtractedColor[];
  genres: string[];
};

export const createAlbumReview = async (req: Request, res: Response) => {
  const reviewData: ReceivedReviewData = req.body;
  try {
    const reviewedAlbum = await AlbumService.createAlbumReview(reviewData);
    res.status(201).json(reviewedAlbum);
  } catch (error: any) {
    console.error("Failed to create album review:", error);
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    }
    // Postgres code: 23505 → Duplicate Key Violation
    else if (error.code === "23505") {
      res.status(400).json({ message: "You have already reviewed this album." });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const getAlbumByID = async (req: Request, res: Response) => {
  const albumID = req.params.albumID;
  const includeGenres = req.query.includeGenres !== "false";
  try {
    const reviewedAlbumData = await AlbumService.getAlbumByID(albumID, includeGenres);
    res.status(200).json(reviewedAlbumData);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const getAllAlbums = async (req: Request, res: Response) => {
  const includeCounts = req.query.includeCounts === "true";
  try {
    const albums = await AlbumService.getAllAlbums(includeCounts);
    res.status(200).json(albums);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const getPaginatedAlbums = async (req: Request, res: Response) => {
  const options: GetPaginatedAlbumsOptions = {
    page: req.query.page as number | undefined,
    orderBy: req.query.orderBy as GetPaginatedAlbumsOptions["orderBy"] | undefined,
    order: req.query.order as GetPaginatedAlbumsOptions["order"] | undefined,
    search: req.query.search as string | undefined,
  };

  try {
    const { albums, furtherPages, totalCount } = await AlbumService.getPaginatedAlbums(options);
    res.status(200).json({ albums, furtherPages, totalCount });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const deleteAlbum = async (req: Request, res: Response) => {
  const albumID = req.params.albumID;
  console.log("Deleting album with ID:", albumID);
  try {
    await AlbumService.deleteAlbum(albumID);
    res.status(204).end();
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const updateAlbumReview = async (req: Request, res: Response) => {
  const reviewData: ReceivedReviewData = req.body;
  const albumID = req.params.albumID;
  console.log(reviewData);
  try {
    const updatedAlbum = await AlbumService.updateAlbumReview(reviewData, albumID);
    res.status(200).json(updatedAlbum);
  } catch (error: any) {
    console.error("Failed to create album review:", error);
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    }
    // Postgres code: 23505 → Duplicate Key Violation
    else if (error.code === "23505") {
      res.status(400).json({ message: "You have already reviewed this album." });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const getReviewScoresByIds = async (req: Request, res: Response) => {
  let raw = req.query.ids;
  let ids: string[] = [];

  if (Array.isArray(raw)) {
    ids = raw as string[];
  } else if (typeof raw === "string") {
    ids = raw.includes(",") ? raw.split(",") : [raw];
  }

  try {
    const scores = await AlbumService.getReviewScoresByIds(ids);
    res.status(200).json(scores);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};
