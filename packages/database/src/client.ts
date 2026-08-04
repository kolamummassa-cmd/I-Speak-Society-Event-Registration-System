import { PrismaClient } from "@prisma/client";

// Prevents exhausting database connections by creating a new PrismaClient
// on every hot-reload in development. Standard Next.js/Prisma pattern.
declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma__ ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma__ = prisma;
}
