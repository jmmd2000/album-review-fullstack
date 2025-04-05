import express from "express";
import * as spotifyController from "../controllers/spotifyController";

const router = express.Router();

router.get("/token", spotifyController.getAccessToken);
router.get("/albums/search", spotifyController.searchAlbums);
router.get("/albums/:albumID", spotifyController.getAlbum);

export default router;
