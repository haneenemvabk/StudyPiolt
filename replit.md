# StudyPilot

An iOS-first academic planning app that turns a student’s courses, deadlines, and available time into an adaptive daily study plan.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/studypilot/app/` — Expo Router screens for onboarding, Home/Now, Planner, Courses, Progress, Profile, focus sessions, and Pro plan presentation.
- `artifacts/studypilot/context/StudyPilotContext.tsx` — local app state, demo semester data, recommendation ranking, and AsyncStorage persistence.
- `artifacts/studypilot/constants/colors.ts` — StudyPilot light/dark semantic colors.
- `artifacts/studypilot/assets/images/icon.png` — conceptual StudyPilot app icon.

## Architecture decisions

- Phase 1 is local-first with AsyncStorage so the core planning loop works without requiring an account or network service.
- Recommendations rank unfinished work using priority and deadline, while generated sessions stay within the declared daily availability.
- Demo data is opt-in from onboarding and can be removed from Profile; it is never mixed silently into a fresh workspace.
- AI, cloud sync, notifications, and StoreKit are intentionally staged behind the working local MVP.

## Product

- Onboarding captures an initial course and study availability.
- Home answers “What should I do now?” with a ranked next best action and today’s sessions.
- Planner supports generated sessions and adding tasks; Courses supports course CRUD and topic review toggles.
- Progress shows study time, task completion, course progress, and descriptive exam-readiness categories.
- Profile includes local data controls and a Pro subscription presentation prepared for future StoreKit wiring.

## User preferences

- The user wants the product built directly without manually writing code.

## Gotchas

- Expo workflow is managed as `artifacts/studypilot: expo`; use the workflow rather than starting Expo manually.
- Native API and subscription integrations are not connected in this MVP; keep the local-first flow functional while adding them.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
