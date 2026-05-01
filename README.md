# AgentLaunch

Sia Partners' agentic-AI accelerator platform — a working prototype of the
10-week digital companion for Sia consultants, client admins, and AI
Champions, from kickoff to Demo Day.

Built per `AgentLaunch_BRD_for_ClaudeCode.md` (Sections 1-12), shipped
milestone-by-milestone per Section 10. Full progress in
[`CHANGELOG.md`](./CHANGELOG.md).

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind + shadcn-style primitives
- Prisma ORM + SQLite (per BRD §2 — Postgres-ready)
- NextAuth-style cookie sessions via `jose` + bcrypt (no external auth dep)
- Anthropic Claude API via `@anthropic-ai/sdk` (Section 7)
- Recharts for analytics
- Local filesystem for logos (S3-ready abstraction)

## Quick start

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env
# Edit .env and add ANTHROPIC_API_KEY (optional — see "Running without a key" below)

# 3. Initialize the database
npx prisma db push

# 4. Seed (Section 9 — full 3-project demo dataset)
npm run seed

# 5. Run
npm run dev
# → http://localhost:3000
```

`npm run seed` is idempotent — it drops and recreates every table, so you
can re-run it anytime to reset the demo to a known good state.

## Demo credentials

All passwords are demo-only.

| Role | Email | Password | What you'll see |
|---|---|---|---|
| **Sia Admin** | `admin@sia-partners.com` | `sia2026` | Cross-project console with all 3 client engagements |
| Sia Admin (alt) | `taha@sia-partners.com` | `sia2026` | Same scope — second admin for testing |
| **QCAA Project Admin** | `sara.almansoori@caa.gov.qa` | `qcaa2026` | QCAA-branded dashboard, Week 6 of 10 |
| MWAN Project Admin | `abdulaziz.alharbi@mwan.gov.sa` | `mwan2026` | MWAN-branded dashboard, Week 4 of 10 |
| DC Project Admin | `mariam.alshamsi@dubaicustoms.ae` | `dc2026` | Graduated cohort with Demo Day decisions logged |
| **QCAA Participant** | `ahmed.alkuwari@caa.gov.qa` | `qcaa2026` | Team Skyway · Permit Triage Agent in build |

All 18 QCAA participants share password `qcaa2026`; all 15 MWAN participants
share `mwan2026`; all 20 DC participants share `dc2026`. The full participant
roster is in `prisma/seed-data/people.ts`.

## The sales-demo flow (BRD §12)

Every step works end-to-end without errors after `npm run seed && npm run dev`:

1. **Open `/admin/login`** → sign in as Sia Admin → see dashboard with 3
   projects (QCAA, MWAN, DC) and live activity feed.
2. **Click into the QCAA project** → see all 18 participants, 4 teams, 5
   challenges, branding applied.
3. **Log out, sign in as Sara Al-Mansoori** (QCAA Project Admin) → see the
   QCAA-branded dashboard (maroon/gold), Week 6 of 10 indicator, all 5
   challenges visible.
4. **Open the "Passenger Complaint Resolution Agent" challenge** (the open
   one) → click "Generate AI Analysis" → watch Claude stream a real
   analysis with reframed problem, 3 benchmarks, suggested agents on a
   2x2 matrix, and toolbox recs. _This is the wow moment._
5. **Sign in as Ahmed Al-Kuwari** (Team Skyway participant) → see the Build
   Workspace for the Drone Permit Triage Agent → open the AI Coach sidebar
   → ask _"How should I add a guardrail for restricted airspace queries?"_
   → get a streaming, contextual answer.
6. **Click "Generate Code Scaffolding"** → see real LangGraph starter code
   generated.
7. **Click "Generate Pitch Deck"** → see a 5-slide deck outline auto-created
   from the team's challenge + blueprint + ROI data.
8. **Sign back in as Sia Admin** → open Cross-Project Analytics → see QCAA
   at Week 6, MWAN at Week 4, DC graduated, with comparable ROI projections
   across all three.

## The Sia internal flow (BRD §12)

Proves the platform handles a fresh client onboarding:

1. As Sia Admin, click **"Create New Project"** → fill in (e.g.,
   "Bahrain Postal Authority") → upload a logo → set brand colors → save.
2. Add a **Project Admin invitation** (email send is mocked — invite is
   logged to the server console).
3. Add 5 **participants via CSV upload** (`email,name,department,jobTitle`).
4. The new project appears in the dashboard with empty-state CTAs guiding
   the next steps.

## AI integration (Section 7)

All 7 prompts from BRD Section 7 are organized per Section 7.10:

```
/lib/ai/
  ├── claude.ts        — central client wrapper (env, models, JSON, streaming, cost log)
  ├── types.ts         — TypeScript types for every prompt's I/O
  └── prompts/
      ├── analyzeChallenge.ts   — PROMPT 1, opus-4-7,  4000 tok, T 0.7
      ├── reviewBlueprint.ts    — PROMPT 2, opus-4-7,  2500 tok, T 0.5  (streaming)
      ├── scaffoldCode.ts       — PROMPT 3, opus-4-7,  4000 tok, T 0.3
      ├── generatePitch.ts      — PROMPT 4, opus-4-7,  3000 tok, T 0.6
      ├── coachChat.ts          — PROMPT 5, sonnet-4-6, 1500 tok, T 0.7 (streaming)
      ├── generateQuiz.ts       — PROMPT 6, haiku-4-5,  1500 tok, T 0.4
      └── validateRoi.ts        — PROMPT 7, sonnet-4-6, 1500 tok, T 0.4
```

Each module exports `systemPrompt`, `buildUserMessage(input)`,
`parseOutput(raw)`, `model`, `maxTokens`, `temperature` — exactly as
Section 7.10 specifies. The system prompts are reproduced **verbatim**
from BRD Sections 7.3-7.9; the user message templates are re-built per
the BRD's curly-brace format from the actual participant data.

### Running without an API key

The platform runs end-to-end **without** an `ANTHROPIC_API_KEY`. Each AI
endpoint detects an unconfigured/placeholder key and falls back to a
high-quality canned response that matches the prompt's JSON schema.
This keeps the demo reliable even on offline machines or behind
corporate firewalls — and guards against any single-call API failure
(timeouts, rate limits, model rejections) by transparently routing to
the same fallback.

To enable real Claude calls:

```bash
# In .env
ANTHROPIC_API_KEY=sk-ant-api03-…YOUR-KEY…
```

Models default to `claude-opus-4-7`, `claude-sonnet-4-6`, and
`claude-haiku-4-5-20251001`. Override via `CLAUDE_MODEL_OPUS`,
`CLAUDE_MODEL_SONNET`, `CLAUDE_MODEL_HAIKU` in `.env`.

### AI cost log

Every call writes one `AiCallLog` row (feature, model, in/out tokens,
estimated cost, status, error message). Visible at
`/admin/analytics` → "AI cost log" card.

## Project layout

```
/app
  /admin/**         Sia Admin console (Section 4)
  /(client)/**      Project Admin console — branded per project (Section 5)
  /my/**            Participant workspace + AI Coach widget (Section 6)
  /api/**           All API routes
    /auth           login / logout for both flows
    /admin          project CRUD, users, toolbox
    /challenges     challenge CRUD + assignment + comments
    /teams          team CRUD + member moves
    /participants   add / remove / reset password
    /demo-day       schedule + decisions
    /my             participant-scoped agent + learning + claim
    /ai             7 endpoints — one per Section 7 prompt
/components         reusable UI (sidebar, cards, charts, AI Coach)
/lib
  /ai               Section 7 prompts + central Claude client
  /auth             session, password, role helpers
  db.ts             Prisma singleton
  program.ts        week → 4-phase mapping
/prisma
  schema.prisma     full BRD Section 3 model
  seed.ts           BRD Section 9 seed (idempotent)
  /seed-data
    people.ts       53 participants across 3 projects
    /ai-outputs     pre-generated AI analyses for already-claimed challenges
/public/seed/logos  placeholder client logos
```

## Useful commands

```bash
npm run dev           # Next.js dev server
npm run build         # production build
npm run lint          # ESLint
npm run seed          # full Section 9 reset
npx prisma studio     # browse the SQLite DB in your browser
npx prisma db push    # rebuild the schema after editing schema.prisma
```

## Out of scope (Section 11)

For the prototype:

- Real email send (mocked → console.log)
- Payment / billing
- SSO / SAML / advanced auth
- Mobile native
- Production-grade hardening
- Multi-language (English only)
- Real video hosting (link out)
- Real-time collaboration (polling acceptable, no WebSockets)

## License

Proprietary — Sia Partners internal.
