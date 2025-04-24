import express from "express";
import * as albumController from "@/api/controllers/albumController";
import { requireAdmin } from "@/api/middleware/authMiddleware";

const router = express.Router();

router.get("/all", albumController.getAllAlbums);
router.get("/:albumID", albumController.getAlbumByID);
router.post("/create", requireAdmin, albumController.createAlbumReview);
router.get("/", albumController.getPaginatedAlbums);
router.delete("/:albumID", requireAdmin, albumController.deleteAlbum);
router.put("/:albumID/edit", requireAdmin, albumController.updateAlbumReview);

export default router;
