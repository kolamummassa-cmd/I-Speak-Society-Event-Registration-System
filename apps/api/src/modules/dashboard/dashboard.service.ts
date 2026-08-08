import type { DashboardOverview } from "@isociety/shared";
import * as dashboardRepository from "./dashboard.repository";

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const [totalEvents, totalAttendees, totalCheckedIn, draftCount, publishedCount, completedCount, cancelledCount] =
    await dashboardRepository.getAggregateCounts();

  const upcoming = await dashboardRepository.findUpcomingEvents(5);

  return {
    totalEvents,
    totalAttendees,
    totalCheckedIn,
    checkInRate: totalAttendees > 0 ? Math.round((totalCheckedIn / totalAttendees) * 100) : 0,
    eventsByStatus: {
      DRAFT: draftCount,
      PUBLISHED: publishedCount,
      COMPLETED: completedCount,
      CANCELLED: cancelledCount,
    },
    upcomingEvents: upcoming.map((event) => ({
      id: event.id,
      name: event.name,
      eventDate: event.eventDate as unknown as string,
      venue: event.venue,
      status: event.status,
      attendeeCount: event._count.attendees,
    })),
  };
}
