import { Request, Response } from "express";
import { ArtistService } from "../services/artistService";
import { GetPaginatedArtistsOptions } from "@shared/types";

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

export const getPaginatedArtists = async (req: Request, res: Response) => {
  const options: GetPaginatedArtistsOptions = {
    page: req.query.page as number | undefined,
    orderBy: req.query.orderBy as GetPaginatedArtistsOptions["orderBy"] | undefined,
    order: req.query.order as GetPaginatedArtistsOptions["order"] | undefined,
    search: req.query.search as string | undefined,
  };

  try {
    const { artists, furtherPages, totalCount } = await ArtistService.getPaginatedArtists(options);
    res.status(200).json({ artists, furtherPages, totalCount });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

// This endpoint is for fetching a specific artist by their Spotify ID.
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

// This endpoint is for fetching detailed information about an artist, including their albums and tracks.
export const getArtistDetails = async (req: Request, res: Response) => {
  const artistID = req.params.artistID;
  try {
    const data = await ArtistService.getArtistDetails(artistID);
    res.status(200).json(data);
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
