import { Request, Response, NextFunction } from "express";
import { Role } from "../types";
import { verifyAccessToken } from "../utils/authentication";

export function authenticateTokenMiddleware(roles?: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.sendStatus(401);
    }

    const result = verifyAccessToken(token);

    if (result.status === "error") {
      return res.status(403).json({ error: result.error });
    }

    if (roles && roles.length > 0) {
      const hasRole = roles.includes(result.data.role);

      if (!hasRole) {
        return res
          .status(403)
          .json({ error: "You don't have enough permission." });
      }
    }

    req.user = result.data;
    next();
  };
}
