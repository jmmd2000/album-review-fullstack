import express from "express";
import * as authController from "@/api/controllers/authController";

const router = express.Router();

router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/status", authController.status);

export default router;
