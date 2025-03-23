import express from "express";
import * as trackController from "../controllers/trackController";

const router = express.Router();

router.get("/:albumID", trackController.getTracksByAlbumID);
router.delete("/:albumID", trackController.deleteTracksByAlbumID);

export default router;
