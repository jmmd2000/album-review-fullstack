import { Request, Response } from "express";
import { ArtistService } from "@/api/services/artistService";
import { GetPaginatedArtistsOptions } from "@shared/types";
import { asyncHandler } from "../middleware/asyncHandler";
import z from "zod";
import { AppError } from "../middleware/errorHandler";

export const getAllArtists = asyncHandler(async (_req: Request, res: Response) => {
  const artists = await ArtistService.getAllArtists();
  res.status(200).json(artists);
});

const getPaginatedArtistsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  orderBy: z
    .enum([
      "totalScore",
      "peakScore",
      "latestScore",
      "reviewCount",
      "name",
      "createdAt",
      "leaderboardPosition",
    ])
    .optional(),
  order: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
  scoreType: z.enum(["overall", "peak", "latest"]).optional(),
});

export const getPaginatedArtists = asyncHandler(async (req: Request, res: Response) => {
  const parsed = getPaginatedArtistsSchema.safeParse(req.query);
  if (!parsed.success) {
    throw new AppError(parsed.error.message, 400);
  }

  const { artists, furtherPages, totalCount } = await ArtistService.getPaginatedArtists(
    parsed.data
  );
  res.status(200).json({ artists, furtherPages, totalCount });
});

export const getArtistByID = asyncHandler(async (req: Request, res: Response) => {
  const artist = await ArtistService.getArtistByID(req.params.artistID);
  res.status(200).json(artist);
});

// This endpoint is for fetching detailed information about an artist, including their albums and tracks.
export const getArtistDetails = asyncHandler(async (req: Request, res: Response) => {
  const data = await ArtistService.getArtistDetails(req.params.artistID);
  res.status(200).json(data);
});

export const deleteArtist = asyncHandler(async (req: Request, res: Response) => {
  await ArtistService.deleteArtist(req.params.artistID);
  res.status(204).end();
});

export const updateArtistHeaders = asyncHandler(async (req: Request, res: Response) => {
  const all = req.query.all === "true";
  const spotifyID = typeof req.query.spotifyID === "string" ? req.query.spotifyID : undefined;

  await ArtistService.updateArtistHeaders(all, spotifyID);
  res.status(204).end(); // no json, just “No Content”
});

export const updateArtistImages = asyncHandler(async (req: Request, res: Response) => {
  const all = req.query.all === "true";
  const spotifyID = typeof req.query.spotifyID === "string" ? req.query.spotifyID : undefined;

  await ArtistService.updateArtistImages(all, spotifyID);
  res.status(204).end(); // no json, just “No Content”
});

const updateSingleArtistHeaderBodySchema = z.object({
  headerImage: z.string().nullable(),
});

const updateSingleArtistHeaderParamsSchema = z.object({
  artistID: z.string().min(1, "Artist ID is required"),
});

export const updateSingleArtistHeader = asyncHandler(async (req: Request, res: Response) => {
  const bodyValid = updateSingleArtistHeaderBodySchema.safeParse(req.body);
  if (!bodyValid.success) throw new AppError(bodyValid.error.message, 400);

  const paramsValid = updateSingleArtistHeaderParamsSchema.safeParse(req.params);
  if (!paramsValid.success) throw new AppError(paramsValid.error.message, 400);

  await ArtistService.updateSingleArtistHeader(
    paramsValid.data.artistID,
    bodyValid.data.headerImage
  );
  res.status(200).json({ message: "Header image updated successfully" });
});
