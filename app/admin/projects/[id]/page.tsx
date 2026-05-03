import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabNav } from "@/components/tab-nav";
import { ActivityFeed } from "@/components/activity-feed";
import { StatCard } from "@/components/stat-card";
import { formatDate, safeJson } from "@/lib/utils";
import { ProjectSettings } from "./_settings";
import { AddUsersPanel } from "./_add-users";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "users", label: "Users" },
  { key: "challenges", label: "Challenges" },
  { key: "agents", label: "Agents" },
  { key: "activity", label: "Activity" },
  { key: "settings", label: "Settings" },
];

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const tab = sp.tab || "overview";
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          participants: true,
          teams: true,
          challenges: true,
          projectAdmins: true,
        },
      },
      projectAdmins: { orderBy: { name: "asc" } },
      participants: { orderBy: { name: "asc" }, include: { team: true } },
      teams: { include: { _count: { select: { members: true } }, challenge: true } },
      challenges: {
        orderBy: { createdAt: "asc" },
        include: { team: true, agents: true },
      },
      activityLog: {
        orderBy: { timestamp: "desc" },
        take: 30,
      },
    },
  });
  if (!project) notFound();

  const allAgents = project.challenges.flatMap((c) => c.agents);
  const workingAgents = allAgents.filter((a) =>
    ["building", "testing", "demo_ready"].includes(a.status),
  ).length;

  const headerActions = (
    <div className="flex gap-2">
      <Link href={`/admin/projects/${project.id}?tab=settings`}>
        <Button variant="outline">Edit settings</Button>
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={project.clientOrgName}
        title={project.name}
        description={project.description || project.welcomeMessage || undefined}
        actions={headerActions}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={project.status}>{project.status}</Badge>
        <span className="text-sm text-slate-500">
          {formatDate(project.startDate)} → {formatDate(project.endDate)}
        </span>
        <span className="text-sm text-slate-500">· Week {project.programWeek}/10</span>
        <span
          className="ml-auto inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs"
          style={{ borderColor: project.primaryColor, color: project.primaryColor }}
        >
          <span className="h-3 w-3 rounded-full" style={{ background: project.primaryColor }} />
          {project.primaryColor}
          <span className="h-3 w-3 rounded-full" style={{ background: project.secondaryColor }} />
          {project.secondaryColor}
        </span>
      </div>

      <TabNav tabs={TABS} basePath={`/admin/projects/${project.id}`} defaultKey="overview" />

      {tab === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Participants" value={`${project._count.participants}/${project.cohortSize}`} />
            <StatCard label="Teams" value={project._count.teams} />
            <StatCard label="Challenges" value={project._count.challenges} />
            <StatCard label="Working Agents" value={workingAgents} hint={`${allAgents.length} total`} />
          </div>
          <Card className="p-6">
            <h2 className="mb-4 font-semibold">Program timeline</h2>
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((week) => (
                <div
                  key={week}
                  className={`h-8 flex-1 rounded text-center text-xs leading-8 ${
                    week === project.programWeek
                      ? "text-white"
                      : week < project.programWeek
                        ? "bg-slate-200 text-slate-700"
                        : "bg-slate-100 text-slate-400"
                  }`}
                  style={
                    week === project.programWeek
                      ? { background: project.primaryColor }
                      : undefined
                  }
                >
                  W{week}
                </div>
              ))}
            </div>
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="mb-3 font-semibold">Teams</h2>
              <ul className="divide-y">
                {project.teams.map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-slate-500">
                        {t._count.members} members
                        {t.challenge ? ` · ${t.challenge.title}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
                {project.teams.length === 0 ? (
                  <li className="py-4 text-sm text-slate-500">No teams yet.</li>
                ) : null}
              </ul>
            </Card>
            <Card className="p-6">
              <h2 className="mb-3 font-semibold">Challenges</h2>
              <ul className="divide-y">
                {project.challenges.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-xs text-slate-500">
                        <Badge variant={c.status}>{c.status.replace("_", " ")}</Badge>
                        <Badge variant={c.priority} className="ml-2">{c.priority}</Badge>
                        {c.team ? (
                          <span className="ml-2">· {c.team.name}</span>
                        ) : null}
                      </p>
                    </div>
                  </li>
                ))}
                {project.challenges.length === 0 ? (
                  <li className="py-4 text-sm text-slate-500">No challenges yet.</li>
                ) : null}
              </ul>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "users" ? (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-3 font-semibold">Project admins</h2>
            <ul className="divide-y">
              {project.projectAdmins.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.email} · {a.jobTitle || "—"}</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {a.lastLoginAt ? `Last login ${formatDate(a.lastLoginAt)}` : "Never logged in"}
                  </span>
                </li>
              ))}
              {project.projectAdmins.length === 0 ? (
                <li className="py-4 text-sm text-slate-500">No project admins yet.</li>
              ) : null}
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 font-semibold">
              Participants ({project.participants.length})
            </h2>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Department</th>
                  <th className="py-2">Team</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {project.participants.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2">{p.name}</td>
                    <td className="py-2 text-slate-500">{p.email}</td>
                    <td className="py-2 text-slate-500">{p.department || "—"}</td>
                    <td className="py-2 text-slate-500">{p.team?.name || "—"}</td>
                  </tr>
                ))}
                {project.participants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-sm text-slate-500">
                      No participants yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </Card>

          <AddUsersPanel projectId={project.id} />
        </div>
      ) : null}

      {tab === "challenges" ? (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-2.5">Title</th>
                <th className="px-5 py-2.5">Status</th>
                <th className="px-5 py-2.5">Priority</th>
                <th className="px-5 py-2.5">Team</th>
                <th className="px-5 py-2.5">AI Analysis</th>
                <th className="px-5 py-2.5">Suggested agents</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {project.challenges.map((c) => {
                const suggested = safeJson<unknown[]>(c.suggestedAgents, []);
                return (
                  <tr key={c.id}>
                    <td className="px-5 py-3 font-medium">{c.title}</td>
                    <td className="px-5 py-3">
                      <Badge variant={c.status}>{c.status.replace("_", " ")}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={c.priority}>{c.priority}</Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{c.team?.name || "—"}</td>
                    <td className="px-5 py-3 text-slate-500">{c.aiAnalysis ? "✓ Generated" : "—"}</td>
                    <td className="px-5 py-3 text-slate-500">{suggested.length}</td>
                  </tr>
                );
              })}
              {project.challenges.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                    No challenges yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>
      ) : null}

      {tab === "agents" ? (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-2.5">Agent</th>
                <th className="px-5 py-2.5">Challenge</th>
                <th className="px-5 py-2.5">Framework</th>
                <th className="px-5 py-2.5">Feasibility</th>
                <th className="px-5 py-2.5">Impact</th>
                <th className="px-5 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allAgents.map((a) => {
                const challenge = project.challenges.find((c) => c.id === a.challengeId);
                return (
                  <tr key={a.id}>
                    <td className="px-5 py-3 font-medium">{a.name}</td>
                    <td className="px-5 py-3 text-slate-500">{challenge?.title || "—"}</td>
                    <td className="px-5 py-3 text-slate-500">{a.framework}</td>
                    <td className="px-5 py-3">{a.feasibilityScore}/10</td>
                    <td className="px-5 py-3">{a.impactScore}/10</td>
                    <td className="px-5 py-3">
                      <Badge variant={a.status}>{a.status.replace("_", " ")}</Badge>
                    </td>
                  </tr>
                );
              })}
              {allAgents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                    No agents yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>
      ) : null}

      {tab === "activity" ? (
        <ActivityFeed
          entries={project.activityLog.map((a) => ({
            id: a.id,
            action: a.action,
            userName: a.userName,
            userType: a.userType,
            timestamp: a.timestamp,
          }))}
        />
      ) : null}

      {tab === "settings" ? <ProjectSettings project={project} /> : null}
    </div>
  );
}
