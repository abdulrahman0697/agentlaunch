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

### M2 — Auth + role-based routing skeleton (Section 10 step 3)

- Added JWT-based session via `jose` (HS256, 7-day TTL, httpOnly cookie)
  in `lib/auth/session.ts`, with `bcryptjs` password hashing in
  `lib/auth/passwords.ts`. Per Section 11 — no SSO/SAML, just cookie auth.
- Authentication lookups in `lib/auth/lookup.ts`:
  - `authenticateSiaAdmin()` for the separate `/admin/login` flow (Section 4).
  - `authenticateClientUser()` covers Project Admins **and** Participants on
    the shared `/login` form, returning a role-tagged session that the
    redirect logic uses (Section 5/6).
- `middleware.ts` enforces role-scoped paths: `/admin/**` requires
  `sia_admin`, `/dashboard|/challenges|/results|/demo-day|/settings`
  require `project_admin`, `/my/**` requires `participant`. Already-logged-in
  users hitting a login page are redirected to the right home.
- Login pages: `/admin/login` (Sia navy/gold) and `/login` (client-themed),
  both wrapped in Suspense to satisfy `useSearchParams` prerender.
- API routes: `POST /api/auth/admin-login`, `POST /api/auth/client-login`,
  `POST /api/auth/logout` — each writes an `ActivityLog` entry.
- shadcn-style UI primitives added: `Button`, `Input`, `Textarea`, `Label`,
  `Card` family. Shared `SidebarNav` + `LogoutButton`.
- Role-scoped layouts with dark sidebars (Section 8 "dark sidebar nav,
  role-aware"): `app/admin/layout.tsx`, `app/(client)/layout.tsx`,
  `app/my/layout.tsx`. The `(client)` and `my` layouts read the project's
  `primaryColor`/`secondaryColor`/`backgroundAccent` and inject them as CSS
  variables — wiring the per-project branding cascade for Section 4.4.
- Smoke-test seed at `prisma/seed-auth-skeleton.ts` — one Sia Admin, one
  Project + Project Admin + Participant. Verified end-to-end via curl: 10/10
  auth tests pass (login, redirect by role, blocked routes, bad password,
  logout). The full Section 9 seed ships in M7.
