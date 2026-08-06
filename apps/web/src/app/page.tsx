"use client";

import Image from "next/image";
import Link from "next/link";
import { BarChart3, CheckCircle2, FileText, Moon, QrCode, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeProvider, useTheme } from "@/context/theme-context";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: QrCode,
    label: "QR-based registration",
    description: "Attendees register from a single scan - no paper, no queues.",
    iconClassName: "bg-gradient-to-br from-primary to-[#3b82f6]",
  },
  {
    icon: CheckCircle2,
    label: "Live check-in",
    description: "Scan or search attendees at the door with an instant, undoable check-in.",
    iconClassName: "bg-gradient-to-br from-accent to-[#2dd4bf]",
  },
  {
    icon: BarChart3,
    label: "Analytics & insights",
    description: "Registration and check-in trends, gender and country breakdowns, per event.",
    iconClassName: "bg-gradient-to-br from-purple to-[#9333ea]",
  },
  {
    icon: FileText,
    label: "Exportable reports",
    description: "A printable A4 attendee report or an Excel export, whenever you need one.",
    iconClassName: "bg-gradient-to-br from-warning to-[#fbbf24]",
  },
];

export default function LandingPage() {
  return (
    <ThemeProvider>
      <Landing />
    </ThemeProvider>
  );
}

function Landing() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={cn("min-h-screen bg-background text-foreground", theme === "dark" ? "dark" : "")}>
      {/* Hero: the photo + gradient overlay are deliberately theme-independent
          (always a dark scrim under white text) - a bright outdoor photo
          needs a dark overlay for legible text regardless of light/dark mode. */}
      <section className="relative flex min-h-[560px] flex-col items-center justify-center overflow-hidden px-4 text-center sm:min-h-[640px]">
        <Image
          src="/landing-hero.jpg"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(11,18,32,0.45) 0%, rgba(11,18,32,0.8) 60%, rgba(11,18,32,0.96) 100%)",
          }}
        />

        <Button
          variant="ghost"
          size="sm"
          className="absolute right-4 top-4 z-10 h-11 w-11 rounded-full bg-white/[0.08] p-0 text-white hover:bg-white/[0.16]"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <div className="relative z-10 flex flex-col items-center gap-5">
          <Image
            src="/logo.jpg"
            alt="I Speak Society"
            width={72}
            height={72}
            priority
            className="h-16 w-16 rounded-xl shadow-[0_0_25px_rgba(20,184,166,0.35)] sm:h-[4.5rem] sm:w-[4.5rem]"
          />
          <div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">I Speak Society</h1>
            <p className="mt-2 text-sm font-medium uppercase tracking-wide text-white/70">
              Event Registration System
            </p>
          </div>
          <p className="max-w-md text-base text-white/85">
            Event registration and check-in for I Speak Society.
          </p>
          <Button asChild variant="accent" size="lg" className="mt-2">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </section>

      {/* Feature strip */}
      <section className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="dashboard-backdrop" />
        <div className="relative z-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.label}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", feature.iconClassName)}>
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <p className="font-semibold">{feature.label}</p>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} I Speak Society
      </footer>
    </div>
  );
}
