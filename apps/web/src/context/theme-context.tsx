"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "isociety-dashboard-theme";

/**
 * Used by the admin-facing surfaces of the app - the dashboard route group
 * and the login page - both mount their own instance of this provider and
 * share the same persisted preference via localStorage. Guest-facing pages
 * (public registration, success page, printable badge/report) never render
 * this provider; they follow the visitor's own device preference instead
 * (see lib/use-system-theme.ts), independent of this admin toggle.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      return;
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  // Radix components (Dialog, etc.) portal their content straight to
  // document.body, escaping the dashboard's own dark-scoped wrapper div -
  // so a dialog opened while dark mode is on would otherwise fall back to
  // the light-mode tokens. Toggling the class on <html> instead means every
  // portal (which is still a descendant of <html>) picks up the same
  // variables. Removed on unmount so guest-facing routes, which never mount
  // this provider, are never affected.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    return () => {
      root.classList.remove("dark");
    };
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
