import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import { authRouter } from "./modules/auth/auth.routes";
import { eventRouter } from "./modules/events/event.routes";
import { uploadRouter } from "./modules/uploads/upload.routes";
import { publicRouter } from "./modules/public/public.routes";

export function createApp() {
  const app = express();

  // Render (and any other reverse-proxy host) sits in front of this
  // process - without this, req.ip/req.secure are wrong, which breaks
  // IP-keyed rate limiting and the refresh cookie's `secure` flag.
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

  // Ahead of the rate limiter and routers so uptime monitors/load balancer
  // health checks are never throttled or logged as API traffic.
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ success: true, message: "OK", timestamp: new Date().toISOString() });
  });

  // General backstop on top of the endpoint-specific limiters (login,
  // public registration, check-in) - see middleware/rateLimiter.ts.
  app.use("/api", apiLimiter);

  app.use("/api/auth", authRouter);
  app.use("/api/events", eventRouter);
  app.use("/api/uploads", uploadRouter);
  app.use("/api/public", publicRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
