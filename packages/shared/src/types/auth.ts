// Mirrors the Prisma `Role` enum without importing @prisma/client into
// shared code - keeps this package usable from the frontend without
// pulling in database internals.
export type Role = "ORGANIZER";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AccessTokenPayload {
  sub: string; // user id
  role: Role;
}
