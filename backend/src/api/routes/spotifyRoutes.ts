import express from "express";
import * as spotifyController from "../controllers/spotifyController";

const router = express.Router();

router.get("/", spotifyController.getAccessToken);

export default router;
