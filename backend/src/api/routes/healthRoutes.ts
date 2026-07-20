import express from "express";
import * as healthController from "@/api/controllers/healthController";

const router = express.Router();

router.get("/", healthController.getHealth);
export default router;
