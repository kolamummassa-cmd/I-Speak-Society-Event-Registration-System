"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, LayoutDashboard, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { ThemeProvider, useTheme } from "@/context/theme-context";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events", label: "Events", icon: CalendarDays },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <DashboardShell>{children}</DashboardShell>
    </ThemeProvider>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  // Close the mobile nav dropdown on route change.
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    // Redirect above is in flight; render nothing to avoid a flash of
    // protected content.
    return null;
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className={cn("relative min-h-screen bg-background text-foreground", theme === "dark" ? "dark" : "")}>
      {/* Decorative depth layer - fixed, pointer-events-none, sits behind everything. */}
      <div className="dashboard-backdrop" />

      <header className="sticky top-0 z-40 h-[72px] border-b border-black/[0.06] bg-white/75 backdrop-blur-[18px] dark:border-white/[0.06] dark:bg-[rgba(15,23,42,0.75)]">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Logo */}
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#14b8a6] to-[#06b6d4] text-sm font-bold text-white shadow-[0_0_25px_rgba(20,184,166,0.35)]">
              IS
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold">I Speak Society</p>
              <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Event Registration System
              </p>
            </div>
          </Link>

          {/* Floating pill nav menu - desktop only */}
          <nav className="hidden items-center gap-2 rounded-full border border-primary/[0.18] bg-white/60 p-1.5 shadow-sm dark:border-[rgba(59,130,246,0.18)] dark:bg-[rgba(17,24,39,0.85)] dark:shadow-none md:flex">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-[42px] items-center gap-2 rounded-full px-6 text-sm font-semibold transition-all duration-300",
                    active
                      ? "bg-[linear-gradient(135deg,#2563eb,#3b82f6_55%,#14b8a6)] text-white shadow-[0_0_30px_rgba(37,99,235,0.35)]"
                      : "text-muted-foreground hover:scale-[1.02] hover:border-[rgba(37,99,235,0.25)] hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side: theme toggle, profile, logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="hidden h-11 w-11 rounded-full bg-black/[0.04] p-0 hover:bg-black/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] sm:flex"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <div className="hidden items-center gap-2 md:flex">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
              <span className="max-w-[10rem] truncate text-sm text-muted-foreground">{user.name}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hidden rounded-full border border-white/[0.08] bg-[#1f2937] px-4 text-white hover:scale-100 hover:bg-[#374151] md:inline-flex"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              aria-label={isMobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setIsMobileOpen((open) => !open)}
            >
              {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile dropdown - the floating pill menu doesn't fit below md. */}
        {isMobileOpen && (
          <nav className="flex flex-col gap-1 border-t border-border bg-background px-4 py-3 md:hidden">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "bg-gradient-to-r from-[#2563eb] to-[#14b8a6] text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
                <span className="truncate text-sm text-muted-foreground">{user.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 rounded-full bg-muted p-0"
                  onClick={toggleTheme}
                  aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="rounded-full bg-[#1f2937] text-white hover:scale-100 hover:bg-[#374151]"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </Button>
              </div>
            </div>
          </nav>
        )}
      </header>

      <main className="relative z-10 mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
    </div>
  );
}
