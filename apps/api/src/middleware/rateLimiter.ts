import rateLimit from "express-rate-limit";

// Login is the most likely target for brute-force attempts, so it gets its
// own strict limiter separate from any general API rate limiting added in
// Phase 12. Keyed by IP; each response also carries standard RateLimit-*
// headers so a well-behaved client can back off gracefully.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Try again in 15 minutes." },
});
