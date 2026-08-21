import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const name = process.env.SEED_ORGANIZER_NAME ?? "I Speak Society Admin";
  const email = process.env.SEED_ORGANIZER_EMAIL;
  const password = process.env.SEED_ORGANIZER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set SEED_ORGANIZER_EMAIL and SEED_ORGANIZER_PASSWORD in packages/database/.env before seeding."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {}, // Never overwrite an existing user's password on re-seed.
    create: { name, email, passwordHash, role: "ORGANIZER" },
  });

  console.log(`Seeded organizer account: ${user.email} (id: ${user.id})`);
  console.log("Log in with the email/password from your .env, then consider rotating it.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
