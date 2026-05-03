import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivityFeed } from "@/components/activity-feed";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SiaAdminDashboard() {
  const [projects, totalParticipants, completedDemos, recentActivity] =
    await Promise.all([
      prisma.project.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          _count: {
            select: {
              participants: true,
              challenges: true,
            },
          },
          challenges: {
            select: {
              agents: {
                select: { id: true, status: true },
              },
            },
          },
          activityLog: {
            orderBy: { timestamp: "desc" },
            take: 1,
            select: { timestamp: true },
          },
        },
      }),
      prisma.participant.count(),
      prisma.project.count({ where: { status: "completed" } }),
      prisma.activityLog.findMany({
        orderBy: { timestamp: "desc" },
        take: 20,
        include: { project: { select: { shortName: true, clientOrgName: true } } },
      }),
    ]);

  const activeProjects = projects.filter((p) => p.status === "active");
  const avgWeek =
    activeProjects.length > 0
      ? Math.round(
          (activeProjects.reduce((s, p) => s + p.programWeek, 0) /
            activeProjects.length) *
            10,
        ) / 10
      : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Sia Admin Console"
        title="AgentLaunch — Cross-Project Overview"
        description="Manage every active client engagement, brand each instance, and monitor activity in real time."
        actions={
          <div className="flex gap-2">
            <Link href="/admin/projects/new">
              <Button variant="gold">+ New Project</Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline">Invite Sia team member</Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Active Projects"
          value={activeProjects.length}
          hint={`${projects.length} total · ${completedDemos} completed`}
        />
        <StatCard
          label="Participants"
          value={totalParticipants}
          hint="Across all projects"
        />
        <StatCard
          label="Avg Program Week"
          value={avgWeek}
          hint="Across active engagements"
        />
        <StatCard
          label="Completed Demo Days"
          value={completedDemos}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="font-semibold">Projects</h2>
            <Link href="/admin/projects" className="text-xs text-slate-500 hover:text-slate-700">
              View all →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-2.5">Project</th>
                <th className="px-5 py-2.5">Status</th>
                <th className="px-5 py-2.5">Week</th>
                <th className="px-5 py-2.5">Participants</th>
                <th className="px-5 py-2.5">Challenges</th>
                <th className="px-5 py-2.5">Working Agents</th>
                <th className="px-5 py-2.5">Last Activity</th>
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {projects.map((p) => {
                const workingAgents = p.challenges.reduce(
                  (sum, c) =>
                    sum +
                    c.agents.filter((a) =>
                      ["building", "testing", "demo_ready"].includes(a.status),
                    ).length,
                  0,
                );
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded text-xs font-semibold text-white"
                          style={{ background: p.primaryColor }}
                        >
                          {(p.shortName || p.clientOrgName).slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <Link
                            href={`/admin/projects/${p.id}`}
                            className="font-medium text-slate-900 hover:underline"
                          >
                            {p.shortName || p.name}
                          </Link>
                          <p className="text-xs text-slate-500">{p.clientOrgName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={p.status}>{p.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{p.programWeek}/10</td>
                    <td className="px-5 py-3 text-slate-600">
                      {p._count.participants}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {p._count.challenges}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{workingAgents}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {p.activityLog[0]
                        ? formatDate(p.activityLog[0].timestamp)
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/projects/${p.id}`}
                        className="text-xs font-medium text-slate-700 hover:underline"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-500">
                    No projects yet.{" "}
                    <Link
                      href="/admin/projects/new"
                      className="font-medium text-slate-800 underline"
                    >
                      Create your first project
                    </Link>
                    .
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>

        <div className="space-y-3">
          <h2 className="px-1 text-sm font-semibold text-slate-700">
            Activity feed
          </h2>
          <ActivityFeed
            showProject
            entries={recentActivity.map((a) => ({
              id: a.id,
              action: a.action,
              userName: a.userName,
              userType: a.userType,
              timestamp: a.timestamp,
              projectName: a.project?.shortName || a.project?.clientOrgName,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
