import { Request, Response } from "express";
import { ArtistService } from "../services/artistService";

export const getAllArtists = async (_req: Request, res: Response) => {
  try {
    const artists = await ArtistService.getAllArtists();
    res.status(200).json(artists);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const getArtistByID = async (req: Request, res: Response) => {
  const artistID = req.params.artistID;
  try {
    const artist = await ArtistService.getArtistByID(artistID);
    res.status(200).json(artist);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const deleteArtist = async (req: Request, res: Response) => {
  const artistID = req.params.artistID;
  try {
    await ArtistService.deleteArtist(artistID);
    res.status(204).end();
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};
