"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events", label: "Events", icon: CalendarDays },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

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

  return (
    <div className="min-h-screen bg-muted">
      <header className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <div className="flex items-center gap-8">
          <div>
            <p className="text-sm font-semibold">I Speak Society</p>
            <p className="text-xs text-muted-foreground">Event Registration System</p>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.name}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
