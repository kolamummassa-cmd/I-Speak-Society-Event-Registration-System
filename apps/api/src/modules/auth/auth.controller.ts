import type { Request, Response } from "express";
import { env } from "../../config/env";
import * as authService from "./auth.service";

const REFRESH_COOKIE_NAME = "refreshToken";

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth",
};

export async function loginHandler(req: Request, res: Response) {
  const { accessToken, refreshToken, user } = await authService.login(req.body);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
  res.status(200).json({ success: true, data: { accessToken, user } });
}

export async function refreshHandler(req: Request, res: Response) {
  const { accessToken, refreshToken, user } = await authService.refresh(
    req.cookies?.[REFRESH_COOKIE_NAME]
  );

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
  res.status(200).json({ success: true, data: { accessToken, user } });
}

export async function logoutHandler(req: Request, res: Response) {
  await authService.logout(req.cookies?.[REFRESH_COOKIE_NAME]);
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
  res.status(200).json({ success: true, message: "Logged out" });
}

export async function meHandler(req: Request, res: Response) {
  const user = await authService.getCurrentUser(req.user!.sub);
  res.status(200).json({ success: true, data: { user } });
}
