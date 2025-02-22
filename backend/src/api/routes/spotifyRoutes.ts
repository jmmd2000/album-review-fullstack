import express from "express";
import * as spotifyController from "../controllers/spotifyController";

const router = express.Router();

router.get("/token", spotifyController.getAccessToken);
router.get("/search", spotifyController.searchAlbums);

export default router;
