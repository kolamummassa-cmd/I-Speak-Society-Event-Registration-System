import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { AccessTokenPayload } from "@isociety/shared";
import { env } from "../config/env";

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

// Refresh tokens are opaque random strings, not JWTs - they only need to be
// unguessable and looked up in the database, so there is nothing to "verify"
// client-side and no payload to leak if intercepted.
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

// We never store the raw refresh token, only this hash - so a leaked
// database dump alone can't be used to authenticate as a user.
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getRefreshTokenExpiry(): Date {
  const days = parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN);
  return new Date(Date.now() + days);
}

function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d
  const value = Number(match[1]);
  const unit = match[2];
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit as "s" | "m" | "h" | "d"];
  return value * unitMs;
}
