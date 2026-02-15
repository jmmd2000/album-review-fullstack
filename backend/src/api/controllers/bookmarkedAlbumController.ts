import { Request, Response } from "express";
import { BookmarkedAlbumService } from "@/api/services/bookmarkedAlbumService";
import { DisplayAlbum, GetPaginatedBookmarkedAlbumsOptions } from "@shared/types";
import { asyncHandler } from "../middleware/asyncHandler";
import z from "zod";
import { AppError } from "../middleware/errorHandler";

export const bookmarkAlbum = async (req: Request, res: Response) => {
  const bookmarkedAlbum = await BookmarkedAlbumService.bookmarkAlbum(req.body);
  res.status(200).json(bookmarkedAlbum);
};

export const removeBookmarkedAlbum = asyncHandler(async (req: Request, res: Response) => {
  await BookmarkedAlbumService.removeBookmarkedAlbum(req.params.albumID as string);
  res.status(204).end();
});

export const getBookmarkedAlbum = asyncHandler(async (req: Request, res: Response) => {
  const album = await BookmarkedAlbumService.getAlbumByID(req.params.albumID as string);
  res.status(200).json(album);
});

const getBookmarkStatusesSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  orderBy: z.enum(["finalScore", "releaseYear", "name", "createdAt"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
  genres: z.string().optional(),
  secondaryOrderBy: z.enum(["finalScore", "name", "createdAt"]).optional(),
  secondaryOrder: z.enum(["asc", "desc"]).optional(),
});

export const getBookmarkStatuses = asyncHandler(async (req: Request, res: Response) => {
  // Accept ?ids=1,2,3 or multiple ?ids=1&ids=2
  const raw = req.query.ids;
  let ids: string[] = [];

  if (Array.isArray(raw)) {
    ids = raw as string[];
  } else if (typeof raw === "string") {
    ids = raw.includes(",") ? raw.split(",") : [raw];
  }

  if (ids.length === 0) throw new AppError("ids parameter is required.", 400);

  const bookmarkedIds = await BookmarkedAlbumService.getBookmarkedByIds(ids);
  const statusMap: Record<string, boolean> = {};
  for (const id of ids) {
    statusMap[id] = bookmarkedIds.includes(id);
  }
  res.status(200).json(statusMap);
});

export const getAllBookmarkedAlbums = asyncHandler(async (_req: Request, res: Response) => {
  const albums = await BookmarkedAlbumService.getAllAlbums();
  res.status(200).json(albums);
});

const getPaginatedBookmarkedAlbumsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  orderBy: z.enum(["artistName", "releaseYear", "name", "createdAt"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
});

export const getPaginatedBookmarkedAlbums = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = getPaginatedBookmarkedAlbumsSchema.safeParse(req.query);
    if (!parsed.success) throw new AppError(parsed.error.message, 400);

    const { page, orderBy, order, search } = parsed.data;

    const { albums, furtherPages, totalCount } =
      await BookmarkedAlbumService.getPaginatedAlbums({ page, orderBy, order, search });
    res.status(200).json({ albums, furtherPages, totalCount });
  }
);
