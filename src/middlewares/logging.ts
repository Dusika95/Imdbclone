import { Request, Response, NextFunction } from "express";

export function loggingMiddleware(
  req: Request,
  _: Response,
  next: NextFunction
) {
  const started = new Date();
  next();
  const ended = new Date();
  const elapsed = ended.getTime() - started.getTime();
  console.log(`Request ${req.method} ${req.url} was served in ${elapsed} ms`);
}
