import express from "express";
import * as artistController from "../controllers/artistController";

const router = express.Router();

router.get("/", artistController.getAllArtists);
router.get("/stats", artistController.getPersonalStats);
router.get("/:artistID", artistController.getArtistByID);
router.delete("/:artistID", artistController.deleteArtist);

export default router;
