# I Speak Society - Event Registration System

Digital, QR-code-based event registration and check-in system, replacing manual
paper sign-in at I Speak Society events. Built as a single-tenant application
with a modular architecture that can evolve into a multi-tenant SaaS product
(Foluxnova) in the future.

## Tech stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL via Prisma
- **Auth:** JWT (access + refresh tokens), bcrypt
- **Validation:** Zod
- **QR codes:** `qrcode` (generation), `html5-qrcode` (scanning)
- **Reports:** ExcelJS
- **Package manager:** pnpm workspaces

## Project structure

```
apps/
  web/                 Next.js app - organizer dashboard + public registration pages
  api/                 Express API - auth, events, forms, attendees, check-in, reports
packages/
  database/            Prisma schema + generated client (@isociety/database)
  shared/               Shared TypeScript types, DTOs, Zod schemas (@isociety/shared)
  config/              Shared tsconfig base used by every package/app
```

Each app/package is an independent workspace member linked via pnpm's
`workspace:*` protocol, so `@isociety/shared` and `@isociety/database` are
consumed directly from source during development - no build step required
until you deploy.

## Getting started

1. Install dependencies (run once, from the repo root):
   ```
   pnpm install
   ```
2. Set up environment variables:
   ```
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.local.example apps/web/.env.local
   ```
   Fill in `DATABASE_URL` and the JWT secrets in `apps/api/.env`. See the root
   `.env.example` for a description of every variable used across the
   monorepo.
3. Create the database and generate the Prisma client (added in Phase 2):
   ```
   pnpm db:migrate
   pnpm db:generate
   ```
4. Run the apps in separate terminals:
   ```
   pnpm dev:api    # http://localhost:4000
   pnpm dev:web    # http://localhost:3000
   ```

## Build status

This project is being built phase by phase. See the task list for current
progress. Phase 1 (this scaffold) sets up tooling and folder structure only -
no business logic, database models, or UI beyond the framework defaults exist
yet. Those are added in the phases that follow.
