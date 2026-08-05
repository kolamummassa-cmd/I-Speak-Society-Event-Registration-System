import { Prisma, prisma } from "@isociety/database";

export interface AttendeeFilters {
  search?: string;
  checkedIn?: boolean;
}

export interface ListAttendeesFilters extends AttendeeFilters {
  page: number;
  pageSize: number;
}

function buildWhere(eventId: string, filters: AttendeeFilters): Prisma.AttendeeWhereInput {
  return {
    eventId,
    ...(filters.checkedIn !== undefined ? { checkedIn: filters.checkedIn } : {}),
    ...(filters.search
      ? {
          OR: [
            { fullName: { contains: filters.search, mode: "insensitive" as const } },
            { email: { contains: filters.search, mode: "insensitive" as const } },
            { phone: { contains: filters.search, mode: "insensitive" as const } },
            { registrationNumber: { contains: filters.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

export async function findMany(eventId: string, filters: ListAttendeesFilters) {
  const where = buildWhere(eventId, filters);

  const [attendees, total] = await prisma.$transaction([
    prisma.attendee.findMany({
      where,
      orderBy: { registeredAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.attendee.count({ where }),
  ]);

  return { attendees, total };
}

export function findById(eventId: string, attendeeId: string) {
  return prisma.attendee.findFirst({
    where: { id: attendeeId, eventId },
    include: {
      responses: {
        include: { field: { select: { label: true, fieldType: true } } },
      },
    },
  });
}

// Unpaginated - used for Excel export, which needs every matching row in
// one pass rather than a page at a time.
export function findAllForExport(eventId: string, filters: AttendeeFilters) {
  return prisma.attendee.findMany({
    where: buildWhere(eventId, filters),
    orderBy: { registeredAt: "asc" },
    include: {
      responses: { select: { fieldId: true, value: true } },
    },
  });
}

export function update(attendeeId: string, data: Prisma.AttendeeUncheckedUpdateInput) {
  return prisma.attendee.update({ where: { id: attendeeId }, data });
}

export async function upsertResponses(attendeeId: string, responses: { fieldId: string; value: string }[]) {
  await prisma.$transaction(
    responses.map((r) =>
      prisma.attendeeResponse.upsert({
        where: { attendeeId_fieldId: { attendeeId, fieldId: r.fieldId } },
        update: { value: r.value },
        create: { attendeeId, fieldId: r.fieldId, value: r.value },
      })
    )
  );
}

export function remove(attendeeId: string) {
  return prisma.attendee.delete({ where: { id: attendeeId } });
}
