import express from "express";
import * as genreController from "@/api/controllers/genreController";
import { requireAdmin } from "@/api/middleware/authMiddleware";

const router = express.Router();

router.get("/all", genreController.getAllGenres);

export default router;
