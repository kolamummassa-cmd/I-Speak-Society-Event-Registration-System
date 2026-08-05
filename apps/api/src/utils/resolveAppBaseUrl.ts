import type { Request } from "express";
import { env } from "../config/env";

// Registration/check-in links and QR codes need to point at whatever
// domain the web app is currently served from. Rather than relying on the
// static APP_BASE_URL env var (which goes stale the moment that domain
// changes - e.g. moving from an onrender.com URL to a custom domain), we
// read the Origin header of the request that triggered the generation.
// Every call site here is always a real browser hitting the API directly
// from the web app (the organizer's dashboard, or a guest on the public
// registration page), so Origin reliably reflects the web app's current
// domain with zero config to maintain. APP_BASE_URL remains as a fallback
// for the rare non-browser caller (e.g. a script hitting the API directly)
// where Origin isn't sent.
export function resolveAppBaseUrl(req: Request): string {
  const origin = req.headers.origin;
  if (origin) return origin.replace(/\/+$/, "");
  return env.APP_BASE_URL;
}
