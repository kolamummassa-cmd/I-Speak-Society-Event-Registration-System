import type { EventStatus } from "./event";

export interface DashboardUpcomingEvent {
  id: string;
  name: string;
  eventDate: string;
  venue: string | null;
  status: EventStatus;
  attendeeCount: number;
}

export interface DashboardOverview {
  totalEvents: number;
  totalAttendees: number;
  totalCheckedIn: number;
  checkInRate: number;
  eventsByStatus: Record<EventStatus, number>;
  upcomingEvents: DashboardUpcomingEvent[];
}
