// src/api/middleware/authMiddleware.ts
import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Ensure that `req.cookies.isadmin === 'true'`.
 * If not, sends 401 and ends the request.
 */
export const requireAdmin: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (req.cookies?.isadmin === "true") {
    next();
    return;
  }

  // Send a 401 and then return void
  res.status(401).json({ message: "Unauthorized" });
  return;
};
