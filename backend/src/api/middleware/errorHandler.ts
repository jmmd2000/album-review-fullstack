import { NextFunction, Request, Response } from "express";

/**
 * Global Express error-handling middleware.
 *
 * Formats errors into a consistent JSON response and determines
 * the appropriate HTTP status code.
 *
 * @param err Error thrown during request processing
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = err instanceof AppError ? err.status : 500;
  const message = err.message || "An unknown error occurred.";
  res.status(status).json({ message });
};

/**
 * Custom application error with an associated status code.
 */
export class AppError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
