import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { ComparisonBars } from "@/components/charts/comparison-bars";
import { safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface RoiModel {
  timeSavedHours?: number;
  costReducedAmount?: number;
  revenueEnabledAmount?: number;
}

export default async function CrossProjectAnalyticsPage() {
  const projects = await prisma.project.findMany({
    where: { status: { not: "archived" } },
    include: {
      _count: { select: { participants: true, challenges: true } },
      challenges: {
        include: {
          agents: true,
        },
      },
      participants: { include: { progress: true } },
    },
  });

  const comparisonData = projects.map((p) => {
    let totalTime = 0;
    let totalCost = 0;
    let totalRev = 0;
    let demoReady = 0;
    for (const c of p.challenges) {
      for (const a of c.agents) {
        const roi = safeJson<RoiModel | null>(a.roiModel || null, null);
        if (roi) {
          totalTime += roi.timeSavedHours || 0;
          totalCost += roi.costReducedAmount || 0;
          totalRev += roi.revenueEnabledAmount || 0;
        }
        if (a.status === "demo_ready") demoReady++;
      }
    }
    const completions = p.participants.flatMap((u) => u.progress);
    const completionRate =
      p.participants.length > 0
        ? Math.round(
            (completions.filter((c) => c.completedAt).length /
              Math.max(p.participants.length, 1)) *
              10,
          )
        : 0;
    return {
      name: p.shortName || p.clientOrgName,
      timeSaved: totalTime,
      costReducedK: Math.round(totalCost / 1000),
      revenueEnabledK: Math.round(totalRev / 1000),
      demoReady,
      completionRate,
      week: p.programWeek,
    };
  });

  // Top challenges by impact
  const allChallenges = projects.flatMap((p) =>
    p.challenges.map((c) => ({
      project: p.shortName || p.clientOrgName,
      title: c.title,
      maxImpact: c.agents.reduce((m, a) => Math.max(m, a.impactScore), 0),
    })),
  );
  const topChallenges = allChallenges
    .filter((c) => c.maxImpact > 0)
    .sort((a, b) => b.maxImpact - a.maxImpact)
    .slice(0, 8);

  // Toolbox utilization
  const toolboxAssignments = await prisma.projectToolboxItem.findMany({
    where: { enabled: true },
    include: { toolboxItem: true },
  });
  const utilization = new Map<string, { name: string; pillar: string; count: number }>();
  for (const a of toolboxAssignments) {
    const key = a.toolboxItemId;
    const cur = utilization.get(key);
    if (cur) cur.count++;
    else
      utilization.set(key, {
        name: a.toolboxItem.name,
        pillar: a.toolboxItem.pillar,
        count: 1,
      });
  }
  const utilizationList = Array.from(utilization.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // AI cost log
  const aiCalls = await prisma.aiCallLog.findMany({
    take: 200,
    orderBy: { createdAt: "desc" },
  });
  const totalCost = aiCalls.reduce((s, c) => s + c.estimatedCost, 0);
  const totalCalls = aiCalls.length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sia Admin"
        title="Cross-Project Analytics"
        description="Compare how every active engagement is tracking — engagement, completion, and projected business impact."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-1 font-semibold">Projected ROI by project</h2>
          <p className="mb-4 text-xs text-slate-500">
            Aggregate of every team's ROI model — annualized.
          </p>
          <ComparisonBars
            data={comparisonData}
            bars={[
              { key: "timeSaved", name: "Hours saved", color: "#0B1F3A" },
              { key: "costReducedK", name: "Cost reduced ($K)", color: "#C5A572" },
              { key: "revenueEnabledK", name: "Revenue enabled ($K)", color: "#8A1538" },
            ]}
          />
        </Card>

        <Card className="p-6">
          <h2 className="mb-1 font-semibold">Engagement & completion</h2>
          <p className="mb-4 text-xs text-slate-500">
            % of participants completing learning modules · current program week.
          </p>
          <ComparisonBars
            data={comparisonData}
            bars={[
              { key: "completionRate", name: "Completion %", color: "#0F7B3F" },
              { key: "week", name: "Week (1-10)", color: "#1B1B3A" },
              { key: "demoReady", name: "Demo-ready agents", color: "#D4A017" },
            ]}
          />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-3 font-semibold">Top challenges by impact score</h2>
          <ul className="divide-y text-sm">
            {topChallenges.map((c, i) => (
              <li key={i} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-slate-500">{c.project}</p>
                </div>
                <span className="text-sm font-semibold">{c.maxImpact}/10</span>
              </li>
            ))}
            {topChallenges.length === 0 ? (
              <li className="py-4 text-sm text-slate-500">No scored agents yet.</li>
            ) : null}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="mb-3 font-semibold">Toolbox utilization</h2>
          <p className="mb-3 text-xs text-slate-500">
            Which Sia toolbox assets are most used across projects.
          </p>
          <ul className="divide-y text-sm">
            {utilizationList.map((u) => (
              <li key={u.name} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.pillar}</p>
                </div>
                <span className="text-sm font-semibold">{u.count}</span>
              </li>
            ))}
            {utilizationList.length === 0 ? (
              <li className="py-4 text-sm text-slate-500">No assignments yet.</li>
            ) : null}
          </ul>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="mb-3 font-semibold">AI cost log</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Total calls</p>
            <p className="text-2xl font-semibold">{totalCalls}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Estimated cost</p>
            <p className="text-2xl font-semibold">${totalCost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Last 200 calls</p>
            <p className="text-sm text-slate-700">
              {aiCalls.length > 0
                ? `${aiCalls.filter((c) => c.status === "ok").length} ok · ${aiCalls.filter((c) => c.status === "error").length} errors`
                : "No calls yet"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
