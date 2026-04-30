import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0B1F3A] to-[#0E1B2C] text-white">
      <div className="container py-24">
        <div className="max-w-3xl">
          <p className="mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-wider text-[#C5A572]">
            Sia Partners · Agentic AI Accelerator
          </p>
          <h1 className="text-5xl font-semibold leading-tight">
            AgentLaunch
          </h1>
          <p className="mt-4 text-xl text-white/70">
            The 10-week digital companion for Sia consultants, client admins,
            and AI Champions — from kickoff to Demo Day.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/admin/login"
              className="rounded-md bg-[#C5A572] px-5 py-3 text-sm font-medium text-[#0B1F3A] hover:bg-[#d4b886]"
            >
              Sia Admin login
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-white/30 px-5 py-3 text-sm font-medium hover:bg-white/10"
            >
              Client / Participant login
            </Link>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              { t: "Sia Admin", d: "Manage every client engagement, branding, and toolbox." },
              { t: "Project Admin", d: "Post strategic challenges, run AI analyses, manage teams." },
              { t: "Participant", d: "Design, build and pitch your AI agent in 10 weeks." },
            ].map((c) => (
              <div
                key={c.t}
                className="rounded-xl border border-white/10 bg-white/5 p-5"
              >
                <p className="font-medium">{c.t}</p>
                <p className="mt-2 text-sm text-white/70">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
