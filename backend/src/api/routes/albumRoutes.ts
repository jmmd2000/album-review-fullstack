import express from "express";
import * as albumController from "../controllers/albumController";

const router = express.Router();

router.get("/:albumID", albumController.getAlbum);

export default router;
