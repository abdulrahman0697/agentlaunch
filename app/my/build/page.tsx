import Link from "next/link";
import { prisma } from "@/lib/db";
import { getParticipantSession } from "@/lib/auth/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabNav } from "@/components/tab-nav";
import { Button } from "@/components/ui/button";
import { getOrCreateTeamAgent } from "@/lib/agent";
import { safeJson } from "@/lib/utils";
import type { ChallengeAnalysis, RoiModel, PitchDeck } from "@/lib/ai/types";
import { DiscoveryTab } from "./_discovery";
import { BlueprintTab } from "./_blueprint";
import { BuildIterateTab } from "./_build-iterate";
import { RealizationTab } from "./_realization";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "discovery", label: "1 · Discovery & Scoping" },
  { key: "blueprint", label: "2 · Agent Design" },
  { key: "build", label: "3 · Build & Iterate" },
  { key: "realization", label: "4 · Realization" },
];

export default async function BuildWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const session = await getParticipantSession();
  if (!session.teamId) {
    return (
      <Card className="p-10 text-center text-sm text-slate-500">
        You're not on a team yet — your project admin hasn't assigned you to one.
      </Card>
    );
  }
  const team = await prisma.team.findUnique({
    where: { id: session.teamId },
    include: { challenge: true, members: true, project: true },
  });
  if (!team) return null;
  if (!team.challenge) {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Build Workspace"
          title="Pick a challenge first"
          description="Your team hasn't claimed a strategic challenge yet."
        />
        <Card className="p-6">
          <Link href="/my/challenges">
            <Button variant="gold">Browse challenges</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const tab = sp.tab || "discovery";
  const agent = await getOrCreateTeamAgent(team.id, team.challenge.id);
  const analysis = safeJson<ChallengeAnalysis | null>(team.challenge.aiAnalysis, null);
  const roi = safeJson<RoiModel | null>(agent.roiModel || null, null);
  const kpis = safeJson<string[]>(agent.kpis, []);
  const risks = safeJson<string[]>(agent.risks, []);
  const roadmap = safeJson<{ months3: string[]; months6: string[]; months12: string[] }>(
    agent.roadmap,
    { months3: [], months6: [], months12: [] },
  );
  const tools = safeJson<string[]>(agent.tools, []);
  const inputs = safeJson<string[]>(agent.inputs, []);
  const outputs = safeJson<string[]>(agent.outputs, []);
  const pitchDeck = safeJson<PitchDeck | null>(agent.pitchDeck || null, null);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Team ${team.name} · Week ${team.project.programWeek} of 10`}
        title={`Build: ${agent.name}`}
        description={team.challenge.title}
        actions={
          <div className="flex gap-2">
            <Badge variant={agent.status}>{agent.status.replace("_", " ")}</Badge>
            <Link href={`/my/challenges/${team.challenge.id}`}>
              <Button variant="outline" size="sm">View challenge brief</Button>
            </Link>
          </div>
        }
      />

      <TabNav tabs={TABS} basePath="/my/build" defaultKey="discovery" />

      {tab === "discovery" ? (
        <DiscoveryTab
          agentId={agent.id}
          challengeTitle={team.challenge.title}
          analysis={analysis}
          name={agent.name}
          purpose={agent.purpose}
          description={agent.description}
        />
      ) : null}

      {tab === "blueprint" ? (
        <BlueprintTab
          agentId={agent.id}
          framework={agent.framework}
          llm={agent.llm}
          purpose={agent.purpose}
          inputs={inputs}
          tools={tools}
          outputs={outputs}
          memory={agent.memory}
          guardrails={agent.guardrails}
          status={agent.status}
          existingReview={agent.blueprintReview || ""}
          analysis={analysis}
        />
      ) : null}

      {tab === "build" ? (
        <BuildIterateTab
          agentId={agent.id}
          framework={agent.framework}
          existingScaffold={agent.scaffoldCode || ""}
          status={agent.status}
        />
      ) : null}

      {tab === "realization" ? (
        <RealizationTab
          agentId={agent.id}
          roi={roi}
          kpis={kpis}
          risks={risks}
          roadmap={roadmap}
          existingValidation={agent.roiValidation || ""}
          existingPitch={pitchDeck}
        />
      ) : null}
    </div>
  );
}
