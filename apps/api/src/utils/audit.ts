import { prisma } from "@isociety/database";

interface RecordAuditLogInput {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  eventId?: string;
  changes?: unknown;
}

// Fire-and-forget by design: an audit log failure should never block the
// actual operation it's describing. Errors are logged, not thrown.
export async function recordAuditLog(input: RecordAuditLogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        eventId: input.eventId,
        changes: input.changes as never,
      },
    });
  } catch (err) {
    console.error("Failed to record audit log:", err);
  }
}
