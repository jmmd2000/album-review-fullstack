import { Request, Response } from "express";
import { AlbumService } from "@/api/services/albumService";
import {
  DisplayTrack,
  ExtractedColor,
  GetPaginatedAlbumsOptions,
  ReviewedAlbum,
  SpotifyAlbum,
} from "@shared/types";
import { asyncHandler } from "../middleware/asyncHandler";
import z from "zod";
import { AppError } from "../middleware/errorHandler";

export type ReceivedReviewData = {
  ratedTracks: DisplayTrack[];
  bestSong: string;
  worstSong: string;
  reviewContent: string;
  affectsArtistScore: boolean;
  album: SpotifyAlbum | ReviewedAlbum;
  colors: ExtractedColor[];
  genres: string[];
  selectedArtistIDs: string[];
  scoreArtistIDs: string[];
};

export const createAlbumReview = asyncHandler(async (req: Request, res: Response) => {
  const reviewedAlbum = await AlbumService.createAlbumReview(req.body);
  res.status(201).json(reviewedAlbum);
});

export const getAlbumByID = asyncHandler(async (req: Request, res: Response) => {
  const reviewedAlbumData = await AlbumService.getAlbumByID(
    req.params.albumID,
    req.query.includeGenres !== "false"
  );
  res.status(200).json(reviewedAlbumData);
});

export const getAllAlbums = asyncHandler(async (req: Request, res: Response) => {
  const albums = await AlbumService.getAllAlbums(req.query.includeCounts === "true");
  res.status(200).json(albums);
});

const getPaginatedAlbumsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  orderBy: z.enum(["finalScore", "releaseYear", "name", "createdAt"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
  genres: z.string().optional(),
  secondaryOrderBy: z.enum(["finalScore", "name", "createdAt"]).optional(),
  secondaryOrder: z.enum(["asc", "desc"]).optional(),
});

export const getPaginatedAlbums = asyncHandler(async (req: Request, res: Response) => {
  const parsed = getPaginatedAlbumsSchema.safeParse(req.query);
  if (!parsed.success) {
    throw new AppError(parsed.error.message, 400);
  }

  const {
    page,
    orderBy,
    order,
    search,
    genres: genresString,
    secondaryOrderBy,
    secondaryOrder,
  } = parsed.data;

  let genres: string[] | undefined;
  if (genresString) {
    genres = genresString
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }
  const {
    albums,
    furtherPages,
    totalCount,
    genres: returnedGenres,
    relatedGenres,
  } = await AlbumService.getPaginatedAlbums({
    page,
    orderBy,
    order,
    search,
    genres,
    secondaryOrderBy,
    secondaryOrder,
  });

  res
    .status(200)
    .json({ albums, furtherPages, totalCount, genres: returnedGenres, relatedGenres });
});

export const deleteAlbum = asyncHandler(async (req: Request, res: Response) => {
  await AlbumService.deleteAlbum(req.params.albumID);
  res.status(204).end();
});

export const updateAlbumReview = asyncHandler(async (req: Request, res: Response) => {
  const updatedAlbum = await AlbumService.updateAlbumReview(req.body, req.params.albumID);
  res.status(200).json(updatedAlbum);
});

const getReviewScoresByIdsSchema = z.object({
  ids: z.string().min(1, "ids parameter is required"),
});

export const getReviewScoresByIds = asyncHandler(async (req: Request, res: Response) => {
  const parsed = getReviewScoresByIdsSchema.safeParse({ ids: req.query.ids });
  if (!parsed.success) {
    throw new AppError("ids parameter is required", 400);
  }

  const idsString = parsed.data.ids;
  const ids = idsString.includes(",") ? idsString.split(",").map(s => s.trim()) : [idsString];

  const scores = await AlbumService.getReviewScoresByIds(ids);
  res.status(200).json(scores);
});
