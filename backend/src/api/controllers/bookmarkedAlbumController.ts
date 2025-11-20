import { Request, Response } from "express";
import { BookmarkedAlbumService } from "@/api/services/bookmarkedAlbumService";
import { DisplayAlbum, GetPaginatedBookmarkedAlbumsOptions } from "@shared/types";

export const bookmarkAlbum = async (req: Request, res: Response) => {
  const album: DisplayAlbum = req.body;
  try {
    const bookmarkedAlbum = await BookmarkedAlbumService.bookmarkAlbum(album);
    res.status(200).json(bookmarkedAlbum);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const removeBookmarkedAlbum = async (req: Request, res: Response) => {
  const albumID = req.params.albumID;
  try {
    await BookmarkedAlbumService.removeBookmarkedAlbum(albumID);
    res.status(204).end();
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const getBookmarkedAlbum = async (req: Request, res: Response) => {
  const albumID = req.params.albumID;
  try {
    const album = await BookmarkedAlbumService.getAlbumByID(albumID);
    res.status(200).json(album);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const getBookmarkStatuses = async (req: Request, res: Response) => {
  // Accept ?ids=1,2,3 or multiple ?ids=1&ids=2
  const raw = req.query.ids;
  let ids: string[] = [];

  if (Array.isArray(raw)) {
    ids = raw as string[];
  } else if (typeof raw === "string") {
    ids = raw.includes(",") ? raw.split(",") : [raw];
  }

  try {
    const bookmarkedIds = await BookmarkedAlbumService.getBookmarkedByIds(ids);
    const statusMap: Record<string, boolean> = {};
    for (const id of ids) {
      statusMap[id] = bookmarkedIds.includes(id);
    }
    res.status(200).json(statusMap);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const getAllBookmarkedAlbums = async (req: Request, res: Response) => {
  try {
    const albums = await BookmarkedAlbumService.getAllAlbums();
    res.status(200).json(albums);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

export const getPaginatedBookmarkedAlbums = async (req: Request, res: Response) => {
  const options: GetPaginatedBookmarkedAlbumsOptions = {
    page: req.query.page as number | undefined,
    orderBy: req.query.orderBy as GetPaginatedBookmarkedAlbumsOptions["orderBy"] | undefined,
    order: req.query.order as GetPaginatedBookmarkedAlbumsOptions["order"] | undefined,
    search: req.query.search as string | undefined,
  };

  try {
    const { albums, furtherPages, totalCount } =
      await BookmarkedAlbumService.getPaginatedAlbums(options);
    res.status(200).json({ albums, furtherPages, totalCount });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};
