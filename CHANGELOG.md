# Changelog

All notable changes to AgentLaunch are tracked here, milestone by milestone, as Claude Code follows Section 10 of the BRD.

## [Unreleased]

### M1 — Project scaffold + data model (Section 10 steps 1-2)

- Initialized Next.js 14 (App Router) project with TypeScript, Tailwind CSS,
  and shadcn-style utility setup (`cn`, CSS-variable theme, brand tokens).
- Added base config: `package.json`, `tsconfig.json`, `next.config.mjs`,
  `tailwind.config.ts`, `postcss.config.mjs`, `.gitignore`, `.env.example`.
- Created Prisma schema at `prisma/schema.prisma` covering every model from
  BRD Section 3 — `SiaAdmin`, `Project`, `ProjectAdmin`, `Participant`, `Team`,
  `StrategicChallenge`, `AgentSolution`, `LearningResource`,
  `ParticipantProgress`, `ActivityLog` — plus operational extras:
  `ToolboxItem` / `ProjectToolboxItem`, `ChallengeComment`, `QuizAttempt`,
  `CoachMessage`, `AiCallLog`, `DemoDay`. SQLite for the prototype per
  Section 2.
- Added `lib/db.ts` (Prisma client singleton) and `lib/utils.ts` (helpers:
  `cn`, `formatDate`, `timeAgo`, `slugify`, `safeJson`).
- Built a minimal landing page (`app/page.tsx`) with role-based login CTAs
  using Sia's navy/gold palette.
