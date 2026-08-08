import type { CheckInMethod } from "@isociety/database";
import { Prisma, prisma } from "@isociety/database";

// Writes are transactional: the CheckIn log row and the denormalized
// Attendee.checkedIn/checkInTime/checkInMethod columns must never drift
// apart. The CheckIn.attendeeId column has a DB-level @unique constraint,
// so a second check-in attempt fails atomically here (P2002) rather than
// racing on the Attendee.checkedIn boolean.
export async function createCheckIn(attendeeId: string, method: CheckInMethod, checkedInById: string) {
  const now = new Date();
  const data: Prisma.CheckInUncheckedCreateInput = { attendeeId, method, checkedInById };

  await prisma.$transaction([
    prisma.checkIn.create({ data }),
    prisma.attendee.update({
      where: { id: attendeeId },
      data: { checkedIn: true, checkInTime: now, checkInMethod: method },
    }),
  ]);
}

export async function removeCheckIn(attendeeId: string) {
  await prisma.$transaction([
    prisma.checkIn.delete({ where: { attendeeId } }),
    prisma.attendee.update({
      where: { id: attendeeId },
      data: { checkedIn: false, checkInTime: null, checkInMethod: null },
    }),
  ]);
}
