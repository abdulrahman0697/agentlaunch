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

### M4 — Project Admin end-to-end (Section 5 / Section 10 step 4b)

- **Dashboard (`/dashboard`)** — Section 5.1: client-branded welcome
  banner (logo, navy/maroon header, 10-week strip with current week
  highlighted in `secondaryColor`), 5 stat cards (Strategic
  Challenges · Active Teams · Agents in Build · Certifications Earned
  · Avg Engagement), recent challenges with status/priority/AI-ready
  badges, recent activity feed.
- **Strategic Challenges (`/challenges`)** — Section 5.2: card grid
  with status, priority, AI-analysis tag, department tags. **New
  challenge form** (`/challenges/new`) with all fields from the BRD.
  **Challenge detail (`/challenges/[id]`)** with 6 tabs: Brief · AI
  Analysis · Benchmarks · Suggested Agents · Toolbox · Discussion.
  - Suggested Agents tab includes the **2x2 feasibility × impact
    scatter** (recharts) with each agent labeled.
  - Discussion tab: comments + scoped activity stream.
  - "Generate AI Analysis" button with progress messages and
    cache/regenerate semantics. *AI is a stub in M4 — returns
    consulting-grade canned data so the entire UI is demonstrable.
    M6 swaps in the real Claude call (PROMPT 1 from Section 7.3).*
  - "Assign to Team" panel with create-new-team flow inline.
- **Teams & Participants (`/teams`)** — Section 5.3: per-team cards
  with members + assigned challenge, dropdown-based participant
  re-assignment, unassigned-participant pool, in-place team creation.
- **Results & KPIs (`/results`)** — Section 5.4 in full:
  - Phase progress (stacked bars per phase Discovery/Design/Build/Realization)
  - Use case pipeline funnel (Posted → Concepts → Blueprints → Working → Demo-Ready)
  - Projected ROI stat cards (annualized hours saved · cost reduced · revenue enabled)
  - Certification tracker (% earned)
  - Engagement heatmap by department × week (last 6 weeks)
  - Export PDF button (window.print())
- **Demo Day (`/demo-day`)** — Section 5.5: schedule (datetime-local),
  reviewers/jury list (add/remove), pitch order (up/down to reorder),
  per-agent greenlight / needs-revision / no-go decision capture,
  decisions log, all persisted via `DemoDay` model.
- **Settings (`/settings`)** — Section 5.6: read-only branding card
  (Sia controls), full participant manager (add / reset password
  with mocked email / remove), notification-preference toggles.
- **APIs** — `/api/challenges`, `/api/challenges/[id]/assign`,
  `/api/challenges/[id]/comments`, `/api/teams`,
  `/api/teams/[id]/members`, `/api/demo-day`,
  `/api/demo-day/decisions`, `/api/participants[/:id][/reset-password]`.
  Every write logs to `ActivityLog`.
- **AI analysis stub** at `/api/ai/analyze-challenge` writes to
  `aiAnalysis`, `suggestedAgents`, `benchmarkData`, plus an `AiCallLog`
  entry. M6 replaces the body with the real Claude call.
- **Helpers** — `lib/auth/server.ts` (role-checked `getXSession`
  helpers), `lib/program.ts` (week → 4-phase mapping).
- **Verification** — `next build` clean. Curl-driven end-to-end:
  PA login → all 7 pages 200 → create challenge → run analysis →
  4 suggested agents render in Agents tab → create team →
  assign team to challenge → add participant to team → post
  comment → save Demo Day plan → add new participant → dashboard
  shows "AI analysis ready" and Team Skyway.
