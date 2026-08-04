// Shared types, DTOs, and validation schemas consumed by both the
// Next.js frontend (apps/web) and the Express backend (apps/api).
//
// This package is consumed directly from source (no build step) during
// development. Populated incrementally as each feature is built:
//   - types/       plain TypeScript interfaces & enums (e.g. FieldType, CheckInStatus)
//   - dto/         Zod schemas for request/response payloads
//   - constants/   shared constants (e.g. default form fields)

export * from "./types";
export * from "./dto";
export * from "./constants";
