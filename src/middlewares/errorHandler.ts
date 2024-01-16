import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof z.ZodError) {
    res.status(400).json(err.issues);
    return;
  }

  next(err);
}
