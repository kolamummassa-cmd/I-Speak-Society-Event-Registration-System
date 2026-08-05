import { prisma } from "@isociety/database";
import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`[api] listening on http://localhost:${env.PORT}`);
});

// Render (and most container hosts) send SIGTERM on deploys/restarts and
// expect the process to finish in-flight requests and exit promptly rather
// than being hard-killed - stop accepting new connections, let existing
// ones drain, then close the DB connection before exiting.
function shutdown(signal: string) {
  console.log(`[api] received ${signal}, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log("[api] shutdown complete");
    process.exit(0);
  });

  // Don't hang forever if a connection never drains.
  setTimeout(() => {
    console.error("[api] forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
