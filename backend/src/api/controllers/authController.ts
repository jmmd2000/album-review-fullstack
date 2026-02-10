import { Request, Response } from "express";
import { AuthService } from "@/api/services/authService";
import { asyncHandler } from "../middleware/asyncHandler";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const login = asyncHandler(async (req: Request, res: Response) => {
  const token = await AuthService.authenticate(req.body.password);
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
