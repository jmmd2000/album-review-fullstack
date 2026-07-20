import type { Request, Response } from "express";
import { query } from "@/db/client";

export const getHealth = async (_req: Request, res: Response) => {
  try {
    await query("SELECT 1");
    res.status(200).json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
};
