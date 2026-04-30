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

### M3 — Sia Admin end-to-end (Section 4 / Section 10 step 4a)

- **Dashboard (`/admin/dashboard`)** — Section 4.1: 4 stat cards (Active
  Projects, Participants, Avg Program Week, Completed Demo Days), full
  projects table (status, week, participants, challenges, working agents,
  last activity), live cross-project activity feed, "+ New Project" and
  "Invite Sia team member" quick actions.
- **Projects list (`/admin/projects`)** + **Project detail (`/admin/projects/[id]`)**
  with the six tabs from Section 4.2: Overview / Users / Challenges /
  Agents / Activity / Settings. Overview includes a 10-week program
  timeline visual, teams panel, challenges panel.
- **Create project (`/admin/projects/new`)** — Section 4.2: form with
  client name, logo upload (data-URL for prototype), primary/secondary
  hex color pickers with live brand preview, start/end dates, cohort
  size, welcome message; auto-slug generated; soft-collision suffixing.
- **Settings tab** — Section 4.2/4.4: edit every field including
  "advance program week (1→10) manually" (range slider), feature toggle
  for the certifications track, archive button (soft-delete to
  `status=archived` with confirm).
- **User management** — Section 4.3:
  - Add Project Admin (in-tab form; mocked email send via
    `console.log` per Section 11).
  - Add single participant.
  - Bulk CSV upload (`email,name,department,jobTitle`) with default
    password — duplicate emails are skipped.
  - **Global users table (`/admin/users`)** — Sia Admins, Project Admins
    (with project + last-login), all Participants (with stage badge).
- **Cross-Project Analytics (`/admin/analytics`)** — Section 4.5:
  Recharts bars comparing projected ROI (hours saved · cost reduced ·
  revenue enabled), engagement & completion · current week ·
  demo-ready agents, top challenges by impact score, toolbox
  utilization, AI cost log summary (calls / estimated cost / errors).
- **Sia Toolbox (`/admin/toolbox`)** — Section 4.6: full CRUD on the
  6-pillar toolbox plus a project × toolbox-item assignment matrix
  (checkbox grid) so each item's visibility per project is controlled.
- **API** — `POST/PUT/DELETE /api/admin/projects[/id]`,
  `/admins`, `/participants`, `/api/admin/toolbox[/id][/assign]`. Every
  admin write logs an `ActivityLog` entry feeding the dashboard feed.
- **UI primitives** — `Badge` (status/priority variants), `StatCard`,
  `PageHeader`, `ActivityFeed`, `TabNav`, recharts wrappers
  (`ComparisonBars`, `FunnelBars`, `FeasibilityImpactScatter` —
  the scatter is reused in M4).
- **Verification** — `next build` clean. Curl-driven end-to-end:
  create project → 4 detail tabs render → invite Project Admin → admin
  logs in → CSV import 3 participants → all 3 log in → bump program
  week → activity feed shows every action → toolbox CRUD works.
