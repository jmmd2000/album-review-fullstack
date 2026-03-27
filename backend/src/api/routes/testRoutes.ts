import express from "express";
import { resetTestData } from "../controllers/testController";

const router = express.Router();

/**
 * DELETE /api/test/reset
 * Reset test data by truncating review-related tables
 * **DEV/TEST ONLY** — guarded by NODE_ENV check in index.ts
 */
router.delete("/reset", resetTestData);

export default router;
