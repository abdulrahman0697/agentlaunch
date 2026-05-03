import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-sia-deep text-white">
      {/* Subtle radial glow + grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          background:
            "radial-gradient(60rem 40rem at 80% -10%, rgba(197,165,114,0.10), transparent 60%), radial-gradient(50rem 30rem at -10% 110%, rgba(197,165,114,0.08), transparent 55%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Top bar */}
      <header className="relative z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-sm bg-sia-gold text-sia-deep">
              <span className="font-display text-lg font-semibold leading-none">S</span>
            </div>
            <div className="leading-tight">
              <p className="font-display text-base font-semibold tracking-tight">
                Sia Partners
              </p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                Agentic AI Accelerator
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
            <a href="#programme" className="hover:text-white">The programme</a>
            <a href="#roles" className="hover:text-white">Who it's for</a>
            <a href="#weeks" className="hover:text-white">10 weeks</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-sm border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/40 hover:text-white sm:inline-flex"
            >
              Client / Participant
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 rounded-sm bg-sia-gold px-4 py-2 text-sm font-medium text-sia-deep transition hover:bg-sia-champagne"
            >
              Sia Admin
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
        <div className="mx-auto h-px max-w-7xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </header>

      {/* Hero */}
      <section className="relative z-10">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-20 lg:grid-cols-12 lg:gap-10 lg:px-10 lg:pb-32 lg:pt-28">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-sia-gold">
              <span className="h-px w-10 bg-sia-gold/60" />
              An accelerator by Sia Partners
            </div>
            <h1 className="mt-8 font-display text-[3.25rem] font-light leading-[1.02] tracking-[-0.02em] text-white sm:text-[4.5rem] lg:text-[6.25rem]">
              From challenge
              <br />
              to{" "}
              <span className="italic text-sia-gold">agent</span>
              <span className="text-sia-gold">.</span>
              <br />
              In ten weeks.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/65">
              AgentLaunch is the digital companion to Sia Partners' agentic AI
              programme — a structured ten-week journey that takes consultants,
              client sponsors and AI Champions from a strategic problem
              statement to a working agent at Demo Day.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/admin/login"
                className="group inline-flex items-center gap-3 rounded-sm bg-sia-gold px-6 py-3.5 text-sm font-medium text-sia-deep transition hover:bg-sia-champagne"
              >
                Enter as Sia Admin
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
              <Link
                href="/login"
                className="group inline-flex items-center gap-3 rounded-sm border border-white/20 px-6 py-3.5 text-sm font-medium text-white transition hover:border-white/50 hover:bg-white/5"
              >
                Client / Participant login
                <span
                  aria-hidden
                  className="text-white/60 transition-transform group-hover:translate-x-0.5 group-hover:text-white"
                >
                  →
                </span>
              </Link>
            </div>
          </div>

          {/* Editorial side block */}
          <aside className="lg:col-span-4">
            <div className="relative h-full">
              <div className="absolute -top-6 left-0 h-px w-16 bg-sia-gold" />
              <p className="font-display text-2xl font-light italic leading-snug text-white/85">
                "We don't ship slide-ware. We ship agents — co-built with the
                client, in production, in ten weeks."
              </p>
              <p className="mt-6 text-xs uppercase tracking-[0.18em] text-white/50">
                — Sia Partners · Heka AI
              </p>

              <dl className="mt-12 grid grid-cols-2 gap-6 border-t border-white/10 pt-8">
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                    Cohort length
                  </dt>
                  <dd className="mt-2 font-display text-3xl font-light text-white">
                    10 <span className="text-sia-gold">/</span> weeks
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                    AI prompts wired
                  </dt>
                  <dd className="mt-2 font-display text-3xl font-light text-white">
                    07
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                    Toolbox pillars
                  </dt>
                  <dd className="mt-2 font-display text-3xl font-light text-white">
                    06
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                    Output
                  </dt>
                  <dd className="mt-2 font-display text-3xl font-light italic text-sia-gold">
                    Demo Day
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
        <div className="mx-auto h-px max-w-7xl bg-white/10" />
      </section>

      {/* Roles — three numbered editorial cards */}
      <section id="roles" className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-sia-gold">
                Who it's for
              </p>
              <h2 className="mt-3 font-display text-4xl font-light leading-tight tracking-tight text-white lg:text-5xl">
                Three roles. <span className="italic">One platform.</span>
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-white/60">
              Built around the way a Sia engagement actually runs — a
              consulting team, a client sponsor, and the AI Champions who
              build the agent.
            </p>
          </div>

          <div className="mt-14 grid gap-px bg-white/10 lg:grid-cols-3">
            {ROLES.map((r) => (
              <article
                key={r.title}
                className="group relative bg-sia-deep p-8 transition hover:bg-[#0c1828] lg:p-10"
              >
                <div className="flex items-start justify-between">
                  <span className="font-display text-sm tracking-[0.2em] text-sia-gold">
                    {r.num}
                  </span>
                  <span
                    aria-hidden
                    className="text-white/30 transition-all group-hover:translate-x-1 group-hover:text-sia-gold"
                  >
                    →
                  </span>
                </div>
                <h3 className="mt-8 font-display text-2xl font-normal text-white">
                  {r.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/65">
                  {r.body}
                </p>
                <ul className="mt-6 space-y-1.5 border-t border-white/10 pt-5 text-xs text-white/55">
                  {r.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="text-sia-gold">·</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={r.href}
                  className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/80 transition hover:text-sia-gold"
                >
                  {r.cta} <span aria-hidden>→</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
        <div className="mx-auto h-px max-w-7xl bg-white/10" />
      </section>

      {/* The 10 weeks rail */}
      <section id="weeks" className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-sia-gold">
                The programme
              </p>
              <h2 className="mt-3 font-display text-4xl font-light leading-tight tracking-tight text-white lg:text-5xl">
                Ten weeks,
                <br />
                <span className="italic">four phases.</span>
              </h2>
              <p className="mt-6 text-sm leading-relaxed text-white/60">
                Each phase has its own workspace inside AgentLaunch — wired to
                the right Claude model, the right Sia toolbox assets, and the
                right milestones for that point in the journey.
              </p>
            </div>

            <ol className="space-y-px lg:col-span-8">
              {PHASES.map((phase) => (
                <li
                  key={phase.label}
                  className="grid grid-cols-12 items-baseline gap-4 border-b border-white/10 py-6"
                >
                  <span className="col-span-2 font-display text-sm tracking-[0.2em] text-sia-gold lg:col-span-1">
                    {phase.weeks}
                  </span>
                  <div className="col-span-10 lg:col-span-4">
                    <p className="font-display text-xl font-normal text-white">
                      {phase.label}
                    </p>
                  </div>
                  <p className="col-span-12 text-sm leading-relaxed text-white/60 lg:col-span-7">
                    {phase.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section
        id="programme"
        className="relative z-10 border-t border-white/10 bg-gradient-to-b from-transparent to-black/40"
      >
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="text-[11px] uppercase tracking-[0.22em] text-sia-gold">
                Ready when you are
              </p>
              <h2 className="mt-4 font-display text-4xl font-light leading-tight tracking-tight text-white lg:text-6xl">
                Begin a cohort, or join an
                <br className="hidden lg:block" />
                {" "}existing one.
              </h2>
            </div>
            <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-3 rounded-sm bg-sia-gold px-6 py-3.5 text-sm font-medium text-sia-deep transition hover:bg-sia-champagne"
              >
                Sia Admin
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-3 rounded-sm border border-white/20 px-6 py-3.5 text-sm font-medium text-white transition hover:border-white/50 hover:bg-white/5"
              >
                Client / Participant
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p>© {new Date().getFullYear()} Sia Partners — AgentLaunch.</p>
          <p className="font-display italic">Strategy, designed and built.</p>
        </div>
      </footer>
    </main>
  );
}

const ROLES = [
  {
    num: "01",
    title: "Sia Admin",
    body: "Stand up new client cohorts, configure branding, curate the toolbox, and watch every engagement from one console.",
    bullets: [
      "Multi-client portfolio",
      "Per-project branding cascade",
      "Toolbox & learning library",
    ],
    cta: "Sia Admin login",
    href: "/admin/login",
  },
  {
    num: "02",
    title: "Project Admin",
    body: "Post strategic challenges, run the AI analyses, manage teams and learning, and steward the cohort to Demo Day.",
    bullets: [
      "Challenge desk",
      "AI-powered analyses",
      "Teams, learning, comms",
    ],
    cta: "Client login",
    href: "/login",
  },
  {
    num: "03",
    title: "AI Champion",
    body: "Take a live business problem from blueprint to a working agent — coached by Claude, framed by Sia, shipped by you.",
    bullets: [
      "Discovery → Blueprint",
      "Build → Iterate",
      "ROI → Pitch",
    ],
    cta: "Participant login",
    href: "/login",
  },
];

const PHASES = [
  {
    weeks: "W1—2",
    label: "Discovery & Scoping",
    body: "Reframe the strategic challenge with consulting rigor, surface root causes, and propose candidate agents grounded in real-world benchmarks.",
  },
  {
    weeks: "W3—4",
    label: "Agent Design",
    body: "Pick the architecture, the framework, and the model. Coach-reviewed blueprint with explicit guardrails before a single line is written.",
  },
  {
    weeks: "W5—8",
    label: "Build & Iterate",
    body: "Scaffold the agent, iterate against test scenarios, and stay in conversation with an AI Coach that knows the brief intimately.",
  },
  {
    weeks: "W9—10",
    label: "Realization & Demo Day",
    body: "Validate the ROI model, generate the executive pitch deck, and present a working agent to a Demo Day jury.",
  },
];
