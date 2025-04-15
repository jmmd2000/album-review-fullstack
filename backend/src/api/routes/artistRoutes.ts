import express from "express";
import * as artistController from "@/api/controllers/artistController";

const router = express.Router();

router.get("/all", artistController.getAllArtists);
router.get("/", artistController.getPaginatedArtists);
router.get("/:artistID", artistController.getArtistByID);
router.get("/details/:artistID", artistController.getArtistDetails);
router.delete("/:artistID", artistController.deleteArtist);

export default router;
