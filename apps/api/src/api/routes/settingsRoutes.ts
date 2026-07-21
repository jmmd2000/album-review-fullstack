import express from "express";
import * as settingsController from "@/api/controllers/settingsController";
import { requireAdmin } from "@/api/middleware/authMiddleware";

const router = express.Router();

router.get("/last-runs", requireAdmin, settingsController.getAllLastRuns);
router.get("/last-runs/:type", requireAdmin, settingsController.getLastRun);
router.get("/setting/:key", requireAdmin, settingsController.getSetting);
router.put("/setting/:key", requireAdmin, settingsController.setSetting);
router.post("/recalculate-scores", requireAdmin, settingsController.recalculateArtistScores);

export default router;
