import { prisma } from "@/lib/db";
import { getProjectAdminSession } from "@/lib/auth/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { ComparisonBars } from "@/components/charts/comparison-bars";
import { FunnelBars } from "@/components/charts/funnel-bars";
import { StatCard } from "@/components/stat-card";
import { ExportPdfButton } from "./_export";
import { safeJson } from "@/lib/utils";
import { PHASES, PHASE_LABEL } from "@/lib/program";
import type { RoiModel } from "@/lib/ai/types";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const session = await getProjectAdminSession();
  const project = await prisma.project.findUnique({
    where: { id: session.projectId },
    include: {
      participants: { include: { progress: true } },
      teams: {
        include: {
          members: true,
          challenge: true,
          agents: true,
        },
      },
      challenges: { include: { agents: true } },
    },
  });
  if (!project) return null;

  // Phase progress: count teams in each phase based on their challenge's
  // most-mature agent's status (or progressStage of any member).
  const teamPhases = project.teams.map((t) => {
    const stages = t.members.map((m) => m.progressStage);
    const counts: Record<string, number> = {};
    for (const s of stages) counts[s] = (counts[s] || 0) + 1;
    const phase = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "discovery";
    return phase;
  });
  const phaseData = PHASES.map((p) => ({
    name: PHASE_LABEL[p],
    count: teamPhases.filter((tp) => tp === p).length,
  }));

  // Use case pipeline funnel
  const totalChallenges = project.challenges.length;
  const conceptsDrafted = project.teams.flatMap((t) => t.agents).length;
  const blueprintsValidated = project.teams
    .flatMap((t) => t.agents)
    .filter((a) => ["blueprint", "building", "testing", "demo_ready"].includes(a.status)).length;
  const workingAgents = project.teams
    .flatMap((t) => t.agents)
    .filter((a) => ["building", "testing", "demo_ready"].includes(a.status)).length;
  const demoReady = project.teams
    .flatMap((t) => t.agents)
    .filter((a) => a.status === "demo_ready").length;
  const funnel = [
    { stage: "Challenges Posted", count: totalChallenges },
    { stage: "Concepts Drafted", count: conceptsDrafted },
    { stage: "Blueprints Validated", count: blueprintsValidated },
    { stage: "Working Agents", count: workingAgents },
    { stage: "Demo-Ready", count: demoReady },
  ];

  // Projected ROI aggregated
  let totalTime = 0;
  let totalCost = 0;
  let totalRev = 0;
  for (const t of project.teams) {
    for (const a of t.agents) {
      const roi = safeJson<RoiModel | null>(a.roiModel || null, null);
      if (roi) {
        totalTime += roi.timeSavedHours || 0;
        totalCost += roi.costReducedAmount || 0;
        totalRev += roi.revenueEnabledAmount || 0;
      }
    }
  }

  // Certification tracker
  const totalParticipants = project.participants.length;
  const certifiedCount = project.participants.filter(
    (p) => p.certificationsEarned !== "[]",
  ).length;
  const certPercent = totalParticipants
    ? Math.round((certifiedCount / totalParticipants) * 100)
    : 0;

  // Engagement heatmap by department × week (last 6 weeks of activity)
  const departments = Array.from(
    new Set(project.participants.map((p) => p.department || "Unassigned")),
  );
  const heatmap: Array<{ name: string } & Record<string, number>> = [];
  for (const dept of departments) {
    const row: Record<string, string | number> = { name: dept };
    const peopleInDept = project.participants.filter(
      (p) => (p.department || "Unassigned") === dept,
    );
    for (let week = 1; week <= 6; week++) {
      const completions = peopleInDept.reduce(
        (sum, p) =>
          sum +
          p.progress.filter((r) => {
            if (!r.completedAt) return false;
            const ageWeeks = Math.floor(
              (Date.now() - new Date(r.completedAt).getTime()) / (1000 * 60 * 60 * 24 * 7),
            );
            return ageWeeks === week - 1;
          }).length,
        0,
      );
      row[`w${week}`] = completions;
    }
    heatmap.push(row as { name: string } & Record<string, number>);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Project Admin"
        title="Results & KPIs"
        description="The numbers your leadership wants to see — phase progress, pipeline, ROI, certifications, and engagement."
        actions={<ExportPdfButton />}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Annualized Time Saved" value={`${totalTime.toLocaleString()} hrs`} />
        <StatCard label="Cost Reduced" value={`$${totalCost.toLocaleString()}`} />
        <StatCard label="Revenue Enabled" value={`$${totalRev.toLocaleString()}`} />
        <StatCard label="Certifications" value={`${certPercent}%`} hint={`${certifiedCount} of ${totalParticipants}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-1 font-semibold">Phase progress</h2>
          <p className="mb-3 text-xs text-slate-500">Number of teams in each phase.</p>
          <ComparisonBars
            data={phaseData}
            bars={[{ key: "count", name: "Teams", color: project.primaryColor }]}
          />
        </Card>

        <Card className="p-6">
          <h2 className="mb-1 font-semibold">Use case pipeline</h2>
          <p className="mb-3 text-xs text-slate-500">From challenges posted to demo-ready agents.</p>
          <FunnelBars data={funnel} color={project.primaryColor} />
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="mb-1 font-semibold">Engagement heatmap (last 6 weeks)</h2>
        <p className="mb-3 text-xs text-slate-500">Module completions per department per week.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left">
                <th className="px-3 py-2 text-slate-500">Department</th>
                {[1, 2, 3, 4, 5, 6].map((w) => (
                  <th key={w} className="px-3 py-2 text-center text-slate-500">
                    W-{w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmap.map((row) => (
                <tr key={row.name} className="border-t">
                  <td className="px-3 py-2 font-medium text-slate-800">{row.name}</td>
                  {[1, 2, 3, 4, 5, 6].map((w) => {
                    const v = (row as Record<string, number>)[`w${w}`] || 0;
                    const intensity = Math.min(v / 5, 1);
                    return (
                      <td key={w} className="px-1 py-1 text-center">
                        <div
                          className="mx-auto flex h-7 w-7 items-center justify-center rounded text-[10px] font-medium"
                          style={{
                            background:
                              intensity === 0
                                ? "#f1f5f9"
                                : `${project.primaryColor}${Math.round(intensity * 200 + 30)
                                    .toString(16)
                                    .padStart(2, "0")}`,
                            color: intensity > 0.4 ? "white" : "#0f172a",
                          }}
                        >
                          {v || ""}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {heatmap.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-sm text-slate-500">
                    No engagement data yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

