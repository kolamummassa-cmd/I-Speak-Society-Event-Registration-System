import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { eventRouter } from "./modules/events/event.routes";
import { uploadRouter } from "./modules/uploads/upload.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ success: true, message: "OK", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/events", eventRouter);
  app.use("/api/uploads", uploadRouter);

  // Further feature routes are mounted here as each module is built:
  // app.use("/api/attendees", attendeeRouter);
  // ...

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
