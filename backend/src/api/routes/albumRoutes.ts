import express from "express";
import * as albumController from "../controllers/albumController";

const router = express.Router();

router.get("/:albumID", albumController.getAlbumByID);
router.post("/create", albumController.createAlbumReview);
router.get("/", albumController.getAllAlbums);
router.delete("/:albumID", albumController.deleteAlbum);

export default router;
