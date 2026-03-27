import express from "express";
import * as genreController from "@/api/controllers/genreController";

const router = express.Router();

router.get("/all", genreController.getAllGenres);

export default router;
