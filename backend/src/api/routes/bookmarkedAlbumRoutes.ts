import express from "express";
import * as bookmarkedAlbumController from "@/api/controllers/bookmarkedAlbumController";
import { requireAdmin } from "@/api/middleware/authMiddleware";

const router = express.Router();
router.get("/status", requireAdmin, bookmarkedAlbumController.getBookmarkStatuses);
router.get("/all", requireAdmin, bookmarkedAlbumController.getAllBookmarkedAlbums);
router.get("/", requireAdmin, bookmarkedAlbumController.getPaginatedBookmarkedAlbums);
router.get("/:albumID", requireAdmin, bookmarkedAlbumController.getBookmarkedAlbum);
router.post("/:albumID/add", requireAdmin, bookmarkedAlbumController.bookmarkAlbum);
router.delete("/:albumID/remove", requireAdmin, bookmarkedAlbumController.removeBookmarkedAlbum);

export default router;
