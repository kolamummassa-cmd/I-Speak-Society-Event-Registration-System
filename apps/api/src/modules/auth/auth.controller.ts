import type { Request, Response } from "express";
import { env } from "../../config/env";
import { parseDurationToMs } from "../../utils/jwt";
import * as authService from "./auth.service";

const REFRESH_COOKIE_NAME = "refreshToken";

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth",
  // Without this, it's a session cookie the browser can drop the moment it
  // fully closes, even though the refresh token itself is still valid on
  // the server for JWT_REFRESH_EXPIRES_IN - that mismatch was why staying
  // logged in across a closed browser/phone didn't reliably work.
  maxAge: parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN),
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
