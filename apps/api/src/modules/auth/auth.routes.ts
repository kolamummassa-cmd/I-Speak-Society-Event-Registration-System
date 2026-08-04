import { Router } from "express";
import { loginSchema } from "@isociety/shared";
import { authenticate } from "../../middleware/authenticate";
import { loginLimiter } from "../../middleware/rateLimiter";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { loginHandler, logoutHandler, meHandler, refreshHandler } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/login", loginLimiter, validateBody(loginSchema), asyncHandler(loginHandler));
authRouter.post("/refresh", loginLimiter, asyncHandler(refreshHandler));
authRouter.post("/logout", asyncHandler(logoutHandler));
authRouter.get("/me", authenticate, asyncHandler(meHandler));
