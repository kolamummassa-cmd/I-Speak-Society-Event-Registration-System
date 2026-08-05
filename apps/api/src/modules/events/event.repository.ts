import { type EventStatus, Prisma, prisma } from "@isociety/database";

export interface ListEventsFilters {
  page: number;
  pageSize: number;
  search?: string;
  status?: EventStatus;
}

// All Prisma access for events lives here - the service layer never touches
// `prisma` directly. Swapping the ORM or adding caching later only means
// changing this file.
export async function findMany(filters: ListEventsFilters) {
  const where: Prisma.EventWhereInput = {
    ...(filters.search
      ? { name: { contains: filters.search, mode: "insensitive" as const } }
      : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const [events, total] = await prisma.$transaction([
    prisma.event.findMany({
      where,
      orderBy: { eventDate: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      include: { _count: { select: { attendees: true } } },
    }),
    prisma.event.count({ where }),
  ]);

  return { events, total };
}

export function findById(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: { _count: { select: { attendees: true } } },
  });
}

export function create(data: Prisma.EventCreateInput) {
  return prisma.event.create({
    data,
    include: { _count: { select: { attendees: true } } },
  });
}

export function update(id: string, data: Prisma.EventUpdateInput) {
  return prisma.event.update({
    where: { id },
    data,
    include: { _count: { select: { attendees: true } } },
  });
}

export function remove(id: string) {
  return prisma.event.delete({ where: { id } });
}
