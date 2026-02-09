import { Request, Response } from "express";
import { GenreService } from "../services/genreService";
import { asyncHandler } from "../middleware/asyncHandler";

export const getAllGenres = asyncHandler(async (_req: Request, res: Response) => {
  const albums = await GenreService.getAllGenres();
  res.status(200).json(albums);
});
