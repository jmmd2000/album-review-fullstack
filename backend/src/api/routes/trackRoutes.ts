import express from "express";
import * as trackController from "../controllers/trackController";

const router = express.Router();

router.get("/:albumID", trackController.getAlbumTracks);
router.delete("/:albumID", trackController.deleteAlbumTracks);

export default router;
