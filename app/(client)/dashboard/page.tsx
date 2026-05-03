import Link from "next/link";
import { prisma } from "@/lib/db";
import { getProjectAdminSession } from "@/lib/auth/server";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityFeed } from "@/components/activity-feed";
import { Badge } from "@/components/ui/badge";
import { phaseForWeek, PHASE_LABEL } from "@/lib/program";

export const dynamic = "force-dynamic";

export default async function ProjectAdminDashboard() {
  const session = await getProjectAdminSession();
  const projectId = session.projectId;

  const [project, challenges, teams, participants, certified, activity] =
    await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.strategicChallenge.findMany({
        where: { projectId },
        include: { agents: true, team: true },
      }),
      prisma.team.findMany({ where: { projectId }, include: { _count: { select: { members: true } } } }),
      prisma.participant.findMany({ where: { projectId }, include: { progress: true } }),
      prisma.participant.count({
        where: { projectId, certificationsEarned: { not: "[]" } },
      }),
      prisma.activityLog.findMany({
        where: { projectId },
        orderBy: { timestamp: "desc" },
        take: 12,
      }),
    ]);
  if (!project) return null;

  const buildAgents = challenges
    .flatMap((c) => c.agents)
    .filter((a) => ["building", "testing"].includes(a.status));

  const totalCompletions = participants.reduce(
    (sum, p) => sum + p.progress.filter((r) => r.completedAt).length,
    0,
  );
  const avgEngagement =
    participants.length > 0
      ? Math.round((totalCompletions / participants.length) * 10) / 10
      : 0;

  const phase = phaseForWeek(project.programWeek);

  return (
    <div className="space-y-6">
      <Card
        className="overflow-hidden border-0 text-white"
        style={{ background: project.primaryColor }}
      >
        <div className="flex items-center justify-between gap-6 p-6">
          <div className="flex items-center gap-4">
            {project.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={project.logoUrl}
                alt="logo"
                className="h-14 w-14 rounded bg-white/10 object-contain p-1"
              />
            ) : (
              <div
                className="flex h-14 w-14 items-center justify-center rounded bg-white/15 text-lg font-semibold"
              >
                {(project.shortName || project.clientOrgName).slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-wider text-white/70">
                {project.clientOrgName}
              </p>
              <h1 className="text-2xl font-semibold">{project.name}</h1>
              {project.welcomeMessage ? (
                <p className="mt-1 max-w-2xl text-sm text-white/80">
                  {project.welcomeMessage}
                </p>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-white/70">
              Week
            </p>
            <p className="text-3xl font-semibold">{project.programWeek}/10</p>
            <p className="mt-1 text-xs text-white/70">{PHASE_LABEL[phase]}</p>
          </div>
        </div>
        <div className="flex bg-black/15">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((w) => (
            <div
              key={w}
              className={`flex-1 border-r border-white/10 px-2 py-2 text-center text-xs ${
                w === project.programWeek ? "bg-white/15 font-semibold" : "text-white/60"
              }`}
              style={
                w === project.programWeek
                  ? { background: project.secondaryColor + "33", color: "white" }
                  : undefined
              }
            >
              W{w}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Strategic Challenges" value={challenges.length} />
        <StatCard label="Active Teams" value={teams.length} />
        <StatCard label="Agents in Build" value={buildAgents.length} />
        <StatCard label="Certifications Earned" value={certified} />
        <StatCard label="Avg Engagement" value={avgEngagement} hint="modules / participant" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent challenges</h2>
            <Link href="/challenges">
              <Button size="sm" variant="outline">View all challenges</Button>
            </Link>
          </div>
          <ul className="divide-y">
            {challenges.slice(0, 6).map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3 text-sm">
                <div className="flex-1">
                  <Link href={`/challenges/${c.id}`} className="font-medium hover:underline">
                    {c.title}
                  </Link>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Badge variant={c.status}>{c.status.replace("_", " ")}</Badge>
                    <Badge variant={c.priority}>{c.priority}</Badge>
                    {c.team ? <span>· {c.team.name}</span> : null}
                    {c.aiAnalysis ? <span className="text-emerald-700">· AI analysis ready</span> : null}
                  </p>
                </div>
              </li>
            ))}
            {challenges.length === 0 ? (
              <li className="py-8 text-center text-sm text-slate-500">
                No challenges yet.{" "}
                <Link href="/challenges/new" className="font-medium text-slate-800 underline">
                  Post your first
                </Link>
                .
              </li>
            ) : null}
          </ul>
          <div className="mt-2">
            <Link href="/challenges/new">
              <Button variant="gold" size="sm">+ New strategic challenge</Button>
            </Link>
          </div>
        </Card>

        <div className="space-y-3">
          <h2 className="px-1 text-sm font-semibold text-slate-700">Recent activity</h2>
          <ActivityFeed
            entries={activity.map((a) => ({
              id: a.id,
              action: a.action,
              userName: a.userName,
              userType: a.userType,
              timestamp: a.timestamp,
            }))}
            emptyText="Activity will appear as your team posts challenges and works on agents."
          />
        </div>
      </div>
    </div>
  );
}
