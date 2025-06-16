import { Request, Response } from "express";
import { GenreService } from "../services/genreService";

export const getAllGenres = async (_req: Request, res: Response) => {
  try {
    const albums = await GenreService.getAllGenres();
    res.status(200).json(albums);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};
