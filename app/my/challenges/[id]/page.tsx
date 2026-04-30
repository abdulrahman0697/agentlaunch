import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getParticipantSession } from "@/lib/auth/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeJson } from "@/lib/utils";
import type { ChallengeAnalysis } from "@/lib/ai/types";
import { FeasibilityImpactScatter } from "@/components/charts/feasibility-impact-scatter";
import { ClaimChallengeButton } from "./_claim";

export const dynamic = "force-dynamic";

export default async function ParticipantChallengeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getParticipantSession();
  const [challenge, project] = await Promise.all([
    prisma.strategicChallenge.findUnique({
      where: { id: params.id },
      include: { team: true },
    }),
    prisma.project.findUnique({ where: { id: session.projectId } }),
  ]);
  if (!challenge || challenge.projectId !== session.projectId || !project) notFound();

  const analysis = safeJson<ChallengeAnalysis | null>(challenge.aiAnalysis, null);
  const tags = safeJson<string[]>(challenge.departmentTags, []);
  const myTeam = session.teamId
    ? await prisma.team.findUnique({ where: { id: session.teamId } })
    : null;
  const myTeamHasChallenge = !!(myTeam && myTeam.challengeId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Strategic Challenge"
        title={challenge.title}
        description={challenge.description}
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant={challenge.status}>{challenge.status.replace("_", " ")}</Badge>
            <Badge variant={challenge.priority}>{challenge.priority}</Badge>
          </div>
        }
      />
      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        {tags.map((t) => (
          <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5">
            {t}
          </span>
        ))}
        {challenge.team ? (
          <span>· Claimed by {challenge.team.name}</span>
        ) : null}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Claim with my team</h2>
            <p className="text-xs text-slate-500">
              {myTeam
                ? `You're on ${myTeam.name}.`
                : "You aren't on a team yet — ask your project admin."}
            </p>
          </div>
          <ClaimChallengeButton
            challengeId={challenge.id}
            myTeamId={session.teamId}
            challengeStatus={challenge.status}
            myTeamHasChallenge={myTeamHasChallenge}
            currentTeamId={challenge.team?.id || null}
          />
        </div>
      </Card>

      {!analysis ? (
        <Card className="p-10 text-center text-sm text-slate-500">
          AI analysis hasn't been generated for this challenge yet — check back
          shortly.
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold">Reframed problem</h2>
            <p className="mt-2 text-slate-800">{analysis.reframedProblem.statement}</p>
            <p className="mt-4 text-sm font-semibold text-slate-700">Success criteria</p>
            <ul className="mt-1 ml-4 list-disc text-sm text-slate-700">
              {analysis.reframedProblem.successCriteria.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </Card>
          <Card className="p-6">
            <h2 className="font-semibold">Feasibility × Impact</h2>
            <FeasibilityImpactScatter
              color={project.primaryColor}
              points={analysis.suggestedAgents.map((a) => ({
                name: a.name,
                feasibility: a.feasibilityScore,
                impact: a.impactScore,
              }))}
            />
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            {analysis.suggestedAgents.map((a, i) => (
              <Card key={i} className="space-y-2 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{a.name}</h3>
                  <Badge>{a.agentType}</Badge>
                </div>
                <p className="text-sm text-slate-600">{a.oneLiner}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded bg-slate-50 p-2 text-center">
                    Feas <strong className="block text-base">{a.feasibilityScore}</strong>
                  </div>
                  <div className="rounded bg-slate-50 p-2 text-center">
                    Impact <strong className="block text-base">{a.impactScore}</strong>
                  </div>
                  <div className="rounded bg-slate-50 p-2 text-center">
                    {a.suggestedTechStack.framework}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
