import type { NextFunction, Request, Response } from "express";
import type { AccessTokenPayload } from "@isociety/shared";
import { verifyAccessToken } from "../utils/jwt";
import { AppError } from "./errorHandler";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

// Protects any route that requires an organizer to be logged in. Reads the
// access token from the Authorization header (never from a cookie - access
// tokens are kept in memory on the frontend, so there is nothing for an
// XSS payload to steal from storage).
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "Authentication required"));
  }

  const token = header.slice("Bearer ".length);

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new AppError(401, "Invalid or expired access token"));
  }
}
