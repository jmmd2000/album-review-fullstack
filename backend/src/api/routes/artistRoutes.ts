import express from "express";
import * as artistController from "@/api/controllers/artistController";
import { requireAdmin } from "@/api/middleware/authMiddleware";

const router = express.Router();

router.get("/all", artistController.getAllArtists);
router.get("/", artistController.getPaginatedArtists);
router.get("/:artistID", artistController.getArtistByID);
router.get("/details/:artistID", artistController.getArtistDetails);
router.delete("/:artistID", requireAdmin, artistController.deleteArtist);
router.post("/headerImage", requireAdmin, artistController.updateArtistHeaders);
router.post("/profileImage", requireAdmin, artistController.updateArtistImages);

export default router;
