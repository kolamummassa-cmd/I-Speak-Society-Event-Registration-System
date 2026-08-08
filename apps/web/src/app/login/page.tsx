"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api-client";
import { ThemeProvider, useTheme } from "@/context/theme-context";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <ThemeProvider>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </ThemeProvider>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("expired") === "1";
  const { theme, toggleTheme } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      suppressHydrationWarning
      className={cn(
        "relative flex min-h-screen items-center justify-center bg-muted px-4 text-foreground",
        theme === "dark" ? "dark" : ""
      )}
    >
      <div className="dashboard-backdrop" />
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-4 top-4 z-10 h-11 w-11 rounded-full bg-black/[0.04] p-0 hover:bg-black/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <Card className="relative z-10 w-full max-w-sm">
        <CardHeader className="items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- small static local asset */}
          <img src="/logo.jpg" alt="I Speak Society" className="mb-2 h-14 w-14 rounded-xl shadow-sm" />
          <CardTitle>I Speak Society</CardTitle>
          <CardDescription>Sign in to manage events and registrations.</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionExpired && (
            <p className="mb-4 rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
              Your session has expired. Please sign in again.
            </p>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isSubmitting} className="mt-2">
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
