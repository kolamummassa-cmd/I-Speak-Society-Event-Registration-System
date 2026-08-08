import { prisma } from "@isociety/database";

// A handful of cheap counts in one transaction - no need for a heavier
// groupBy since there are only 4 fixed EventStatus values.
export function getAggregateCounts() {
  return prisma.$transaction([
    prisma.event.count(),
    prisma.attendee.count(),
    prisma.attendee.count({ where: { checkedIn: true } }),
    prisma.event.count({ where: { status: "DRAFT" } }),
    prisma.event.count({ where: { status: "PUBLISHED" } }),
    prisma.event.count({ where: { status: "COMPLETED" } }),
    prisma.event.count({ where: { status: "CANCELLED" } }),
  ]);
}

// Soonest published events that haven't happened yet, for the dashboard's
// "Upcoming events" widget - same attendee-count pattern as the main events
// list (event.repository.ts).
export function findUpcomingEvents(take: number) {
  return prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      eventDate: { gte: new Date(new Date().toDateString()) },
    },
    orderBy: { eventDate: "asc" },
    take,
    include: { _count: { select: { attendees: true } } },
  });
}
