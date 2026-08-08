"use client";

import { useEffect, useState } from "react";

/**
 * Guest-facing pages (public registration, success page) have no visible
 * toggle - they just silently follow whatever the visitor's own device or
 * browser is set to, and update live if that OS-level setting changes while
 * the page is open. This is intentionally independent of the dashboard's
 * ThemeProvider (which is a user-controlled toggle, persisted per admin).
 */
export function useSystemTheme(): "light" | "dark" {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isDark ? "dark" : "light";
}
