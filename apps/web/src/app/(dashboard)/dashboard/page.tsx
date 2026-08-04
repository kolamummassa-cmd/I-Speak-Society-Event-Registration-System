import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Placeholder shell - the real stat cards (Total Events, Registrations,
// Checked In, etc.) are wired up in Phase 11 once there's data to show.
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>You&apos;re logged in</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Event management, QR codes, and analytics will appear here as we build
          each phase.
        </CardContent>
      </Card>
    </div>
  );
}
