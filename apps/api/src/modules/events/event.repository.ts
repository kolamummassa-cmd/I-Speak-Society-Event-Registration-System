import { type EventStatus, Prisma, prisma } from "@isociety/database";
import { DEFAULT_FIELDS } from "@isociety/shared";

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

// Creates the event and its registration form (pre-populated with the 8
// default fields) in a single atomic write - a form always exists the
// moment an event does, rather than being a separate best-effort step.
export function create(data: Prisma.EventCreateInput) {
  return prisma.event.create({
    data: {
      ...data,
      registrationForm: {
        create: {
          fields: {
            create: DEFAULT_FIELDS.map((field) => ({
              fieldKey: field.fieldKey,
              label: field.label,
              fieldType: field.fieldType,
              isDefaultField: true,
              isRequired: field.isRequired,
              displayOrder: field.displayOrder,
              options: field.options
                ? {
                    create: field.options.map((opt, i) => ({
                      label: opt.label,
                      value: opt.value,
                      displayOrder: i,
                    })),
                  }
                : undefined,
            })),
          },
        },
      },
    },
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
