import { Request, Response, NextFunction, RequestHandler } from "express";
import { AuthService } from "../services/authService";

export const requireAdmin: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.token;
  if (AuthService.verifyToken(token)) {
    next();
    return;
  }
  res.status(401).json({ message: "Unauthorised" });
};
