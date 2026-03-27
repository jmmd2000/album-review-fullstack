import type { Request, Response } from "express";
import { AlbumService } from "@/api/services/albumService";
import type { DisplayTrack, ExtractedColor, ReviewedAlbum, SpotifyAlbum } from "@shared/types";
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

const reviewDataSchema = z.object({
  ratedTracks: z.array(z.any()),
  bestSong: z.string(),
  worstSong: z.string(),
  reviewContent: z.string(),
  affectsArtistScore: z.boolean(),
  album: z.record(z.string(), z.any()),
  colors: z.array(z.any()),
  genres: z.array(z.string()),
  selectedArtistIDs: z.array(z.string()).optional(),
  scoreArtistIDs: z.array(z.string()).optional(),
});

export const createAlbumReview = asyncHandler(async (req: Request, res: Response) => {
  const parsed = reviewDataSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(parsed.error.message, 400);

  const reviewedAlbum = await AlbumService.createAlbumReview(req.body as ReceivedReviewData);
  res.status(201).json(reviewedAlbum);
});

export const getAlbumByID = asyncHandler(async (req: Request, res: Response) => {
  const reviewedAlbumData = await AlbumService.getAlbumByID(
    req.params.albumID as string,
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

  const { page, orderBy, order, search, genres: genresString, secondaryOrderBy, secondaryOrder } = parsed.data;

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

  res.status(200).json({ albums, furtherPages, totalCount, genres: returnedGenres, relatedGenres });
});

export const deleteAlbum = asyncHandler(async (req: Request, res: Response) => {
  await AlbumService.deleteAlbum(req.params.albumID as string);
  res.status(204).end();
});

export const updateAlbumReview = asyncHandler(async (req: Request, res: Response) => {
  const parsed = reviewDataSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(parsed.error.message, 400);

  const updatedAlbum = await AlbumService.updateAlbumReview(
    req.body as ReceivedReviewData,
    req.params.albumID as string
  );
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
