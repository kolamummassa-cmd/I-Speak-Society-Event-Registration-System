import crypto from "node:crypto";

// A short, unguessable, human-typeable code - not a sequential counter, so
// no transaction/race-condition handling is needed when two attendees
// register at the exact same moment.
export function generateRegistrationNumber(): string {
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `REG-${suffix}`;
}
