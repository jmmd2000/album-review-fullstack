import express from "express";
import * as albumController from "@/api/controllers/albumController";

const router = express.Router();

router.get("/all", albumController.getAllAlbums);
router.get("/:albumID", albumController.getAlbumByID);
router.post("/create", albumController.createAlbumReview);
router.get("/", albumController.getPaginatedAlbums);
router.delete("/:albumID", albumController.deleteAlbum);
router.put("/:albumID/edit", albumController.updateAlbumReview);

export default router;
