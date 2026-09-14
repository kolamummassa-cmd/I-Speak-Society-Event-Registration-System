import type { Request } from "express";
import { AppError } from "../middleware/errorHandler";

// Our tsconfig enables noUncheckedIndexedAccess, which makes req.params.id
// type as `string | undefined` even on routes declared with `:id` - Express
// guarantees it's present at runtime for a matched route, but TypeScript
// can't know that. Centralizing the narrowing here means every handler that
// reads a route param gets the same 400-on-missing behavior for free,
// instead of scattering non-null assertions through the controllers.
export function requireParam(req: Request, name: string): string {
  const value = req.params[name];
  if (!value) {
    throw new AppError(400, `Missing required route parameter: ${name}`);
  }
  return value;
}
