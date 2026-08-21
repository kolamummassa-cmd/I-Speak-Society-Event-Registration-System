import { prisma } from "@isociety/database";
import type { LoginInput } from "@isociety/shared";
import { AppError } from "../../middleware/errorHandler";
import {
  generateRefreshToken,
  getRefreshTokenExpiry,
  hashToken,
  signAccessToken,
} from "../../utils/jwt";
import { verifyPassword } from "../../utils/password";

function toAuthUser(user: { id: string; name: string; email: string; role: "ORGANIZER" }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Same error for "no such user" and "wrong password" - don't let an
  // attacker use the login form to enumerate which emails have accounts.
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AppError(401, "Invalid email or password");
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return { accessToken, refreshToken, user: toAuthUser(user) };
}

export async function refresh(rawToken: string | undefined) {
  if (!rawToken) {
    throw new AppError(401, "No refresh token provided");
  }

  const tokenHash = hashToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AppError(401, "Refresh token is invalid or expired");
  }

  // Rotation: the old token is revoked the moment it's used, and a new one
  // takes its place. If a stolen refresh token is ever replayed after the
  // legitimate user has already refreshed, it will be rejected here.
  const newRefreshToken = generateRefreshToken();

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        userId: stored.userId,
        tokenHash: hashToken(newRefreshToken),
        expiresAt: getRefreshTokenExpiry(),
      },
    }),
  ]);

  const accessToken = signAccessToken({ sub: stored.user.id, role: stored.user.role });

  return { accessToken, refreshToken: newRefreshToken, user: toAuthUser(stored.user) };
}

export async function logout(rawToken: string | undefined) {
  if (!rawToken) return;

  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(401, "User no longer exists");
  return toAuthUser(user);
}
