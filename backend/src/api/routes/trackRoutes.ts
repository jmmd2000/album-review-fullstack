import express from "express";
import * as trackController from "@/api/controllers/trackController";
import { requireAdmin } from "@/api/middleware/authMiddleware";

const router = express.Router();

router.get("/:albumID", trackController.getTracksByAlbumID);
router.delete("/:albumID", requireAdmin, trackController.deleteTracksByAlbumID);

export default router;
