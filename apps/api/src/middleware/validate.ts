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
