import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "./errorHandler";

// Validates and replaces req.body with the parsed (and type-coerced) result,
// so downstream handlers can trust the shape matches the schema exactly.
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new AppError(400, "Validation failed", result.error.flatten().fieldErrors));
    }
    req.body = result.data;
    next();
  };
}

// Same idea for query strings (e.g. pagination, search, status filters) -
// coerces types (page: "2" -> 2) and rejects anything that doesn't match.
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(new AppError(400, "Invalid query parameters", result.error.flatten().fieldErrors));
    }
    // Express types req.query as ParsedQs (all strings); we're intentionally
    // replacing it with the coerced, typed result from the schema.
    req.query = result.data as unknown as Request["query"];
    next();
  };
}
