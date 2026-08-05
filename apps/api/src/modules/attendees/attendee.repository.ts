import { Prisma, prisma } from "@isociety/database";

export interface ListAttendeesFilters {
  page: number;
  pageSize: number;
  search?: string;
  checkedIn?: boolean;
}

export async function findMany(eventId: string, filters: ListAttendeesFilters) {
  const where: Prisma.AttendeeWhereInput = {
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
