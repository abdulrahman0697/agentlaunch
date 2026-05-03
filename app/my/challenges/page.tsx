import { prisma } from "@/lib/db";
import { getParticipantSession } from "@/lib/auth/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeJson } from "@/lib/utils";
import type { ChallengeAnalysis } from "@/lib/ai/types";
import { ChallengeBrowse } from "./_browse";

export const dynamic = "force-dynamic";

export default async function MyChallengesPage() {
  const session = await getParticipantSession();
  const challenges = await prisma.strategicChallenge.findMany({
    where: { projectId: session.projectId },
    orderBy: { createdAt: "asc" },
    include: { team: true },
  });

  const rows = challenges.map((c) => {
    const tags = safeJson<string[]>(c.departmentTags, []);
    const analysis = safeJson<ChallengeAnalysis | null>(c.aiAnalysis, null);
    const agents = analysis?.suggestedAgents ?? [];
    const avgFeas =
      agents.length > 0
        ? Math.round(
            (agents.reduce((s, a) => s + a.feasibilityScore, 0) / agents.length) * 10,
          ) / 10
        : null;
    const avgImpact =
      agents.length > 0
        ? Math.round(
            (agents.reduce((s, a) => s + a.impactScore, 0) / agents.length) * 10,
          ) / 10
        : null;
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      status: c.status,
      priority: c.priority,
      tags,
      teamName: c.team?.name || null,
      teamId: c.team?.id || null,
      hasAnalysis: !!analysis,
      agentCount: agents.length,
      avgFeas,
      avgImpact,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Browse"
        title="Strategic Challenges"
        description="Explore the problems posted by your project admin. Open one to read the full AI analysis, then claim it with your team."
      />
      <ChallengeBrowse
        rows={rows}
        myTeamId={session.teamId}
      />
    </div>
  );
}
