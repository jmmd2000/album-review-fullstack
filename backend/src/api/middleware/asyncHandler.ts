import { NextFunction, Request, Response } from "express";

/**
 * A typed Express request handler that returns a Promise.
 * Used for async route handlers and middleware.
 */
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * Wraps an async Express handler and forwards any thrown or rejected errors
 * to the next middleware.
 *
 * Prevents unhandled promise rejections and ensures errors are handled
 * by the global error handler.
 *
 * @param func Async Express request handler
 * @returns Wrapped handler with error forwarding
 */
export const asyncHandler =
  (func: AsyncRequestHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(func(req, res, next)).catch(next);
  };
