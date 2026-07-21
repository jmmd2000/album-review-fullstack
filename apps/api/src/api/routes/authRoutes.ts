import express from "express";
import * as authController from "@/api/controllers/authController";
import { loginRateLimiter } from "@/api/middleware/rateLimiters";

const router = express.Router();

router.post("/login", loginRateLimiter, authController.login);
router.post("/logout", authController.logout);
router.get("/status", authController.status);

export default router;
