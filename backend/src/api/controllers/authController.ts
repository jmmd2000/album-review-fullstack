import type { Request, Response } from "express";
import { AuthService } from "@/api/services/authService";
import { asyncHandler } from "../middleware/asyncHandler";
import z from "zod";
import { AppError } from "../middleware/errorHandler";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const loginSchema = z.object({
  password: z.string().min(1),
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Password is required", 400);

  const token = await AuthService.authenticate(parsed.data.password);
  res.cookie("token", token, COOKIE_OPTIONS);
  res.status(204).end();
});

export const logout = (_req: Request, res: Response): void => {
  res.clearCookie("token");
  res.status(204).end();
};

export const status = (req: Request, res: Response): void => {
  const isAdmin = AuthService.verifyToken(req.cookies?.token);
  res.status(200).json({ isAdmin });
};
