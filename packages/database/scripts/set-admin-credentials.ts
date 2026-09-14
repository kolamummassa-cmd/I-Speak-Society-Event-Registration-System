// Run this yourself after the "add username" migration has been applied.
// It updates your existing organizer account in place (same id, so every
// event/attendee/check-in you already have stays exactly as it is) and lets
// you type a new password locally - it's hashed on your machine and never
// leaves it.
//
// Usage:
//   pnpm --filter @isociety/database set-credentials
//
// You'll be prompted for email, username, and password. Press Enter to keep
// the suggested default for email/username.

import "dotenv/config";
import bcrypt from "bcrypt";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  const emailAnswer = await rl.question("Email [admin@gmail.com]: ");
  const email = emailAnswer.trim() || "admin@gmail.com";

  const usernameAnswer = await rl.question("Username [admin]: ");
  const username = usernameAnswer.trim() || "admin";

  const password = await rl.question("New password (min 8 characters): ");
  rl.close();

  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters. Nothing was changed.");
  }

  const existing = await prisma.user.findFirst();
  if (!existing) {
    throw new Error("No organizer account found. Run `pnpm db:seed` first, then re-run this script.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const updated = await prisma.user.update({
    where: { id: existing.id },
    data: { email, username, passwordHash },
  });

  console.log(`\nDone. Log in with username "${updated.username}" and your new password.`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
