import express from "express";
import * as statsController from "@/api/controllers/statsController";

const router = express.Router();

router.get("/favourites", statsController.getFavourites);
router.get("/genres", statsController.getGenreStats);
router.get("/distribution", statsController.getRatingDistribution);
router.get("/counts", statsController.getResourceCounts);

export default router;
