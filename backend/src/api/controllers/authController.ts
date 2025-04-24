import { Request, Response } from "express";
import { AuthService } from "@/api/services/authService";

/**
 * POST /api/auth/login
 * Body: { password: string }
 * Sets an HTTP-only cookie `isadmin=true` on success.
 */
export const login = (req: Request, res: Response): void => {
  try {
    AuthService.authenticate(req.body.password);
    res.cookie("isadmin", "true", { httpOnly: true });
    res.status(204).end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Authentication failed";
    res.status(401).json({ message: msg });
  }
};

/**
 * POST /api/auth/logout
 * Clears the `isadmin` cookie.
 */
export const logout = (_req: Request, res: Response): void => {
  res.clearCookie("isadmin");
  res.status(204).end();
};

/**
 * GET /api/auth/status
 * Returns { isAdmin: boolean } based on the cookie.
 */
export const status = (req: Request, res: Response): void => {
  const isAdmin = AuthService.isAdmin(req);
  res.status(200).json({ isAdmin });
};
