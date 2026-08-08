import rateLimit from "express-rate-limit";

// Login is the most likely target for brute-force attempts, so it gets its
// own strict limiter separate from the general API limiter below. Keyed by
// IP; each response also carries standard RateLimit-* headers so a
// well-behaved client can back off gracefully.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Try again in 15 minutes." },
});

// Applied to every /api route as a defense-in-depth backstop, on top of the
// endpoint-specific limiters (login, public registration, check-in). High
// enough that it never bothers a real organizer or a check-in desk scanning
// continuously; low enough to blunt a scripted flood.
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Slow down and try again shortly." },
});

// Check-in is authenticated, but a check-in desk hammering the scan/manual
// endpoints during a rush is exactly the traffic pattern a scripted abuse
// attempt would also produce - a per-event-organizer cap that's generous
// for real use but not unlimited.
export const checkinLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many check-in requests. Slow down and try again." },
});
