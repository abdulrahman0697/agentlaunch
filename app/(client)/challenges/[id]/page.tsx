import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getProjectAdminSession } from "@/lib/auth/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabNav } from "@/components/tab-nav";
import { ActivityFeed } from "@/components/activity-feed";
import { safeJson } from "@/lib/utils";
import type { ChallengeAnalysis } from "@/lib/ai/types";
import { GenerateAnalysisButton } from "./_generate";
import { AssignTeamPanel } from "./_assign-team";
import { CommentForm } from "./_comments";
import { FeasibilityImpactScatter } from "@/components/charts/feasibility-impact-scatter";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "brief", label: "Brief" },
  { key: "analysis", label: "AI Analysis" },
  { key: "benchmarks", label: "Benchmarks" },
  { key: "agents", label: "Suggested Agents" },
  { key: "toolbox", label: "Toolbox" },
  { key: "discussion", label: "Discussion" },
];

export default async function ChallengeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getProjectAdminSession();
  const { id } = await params;
  const sp = await searchParams;
  const tab = sp.tab || "brief";
  const challenge = await prisma.strategicChallenge.findUnique({
    where: { id },
    include: {
      team: { include: { members: true } },
      agents: true,
      comments: { orderBy: { createdAt: "asc" } },
      project: true,
    },
  });
  if (!challenge || challenge.projectId !== session.projectId) notFound();

  const analysis = safeJson<ChallengeAnalysis | null>(challenge.aiAnalysis, null);
  const tags = safeJson<string[]>(challenge.departmentTags, []);
  const teams = await prisma.team.findMany({
    where: { projectId: session.projectId },
    include: { _count: { select: { members: true } }, challenge: true },
  });

  const recentActivity = await prisma.activityLog.findMany({
    where: {
      projectId: session.projectId,
      payload: { contains: challenge.id },
    },
    orderBy: { timestamp: "desc" },
    take: 10,
  });

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

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {tags.map((t) => (
          <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
            {t}
          </span>
        ))}
        {challenge.team ? (
          <span>· Assigned to {challenge.team.name} ({challenge.team.members.length})</span>
        ) : null}
      </div>

      <TabNav tabs={TABS} basePath={`/challenges/${challenge.id}`} defaultKey="brief" />

      {tab === "brief" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="space-y-5 p-6 lg:col-span-2">
            <Section title="Description" body={challenge.description} />
            <Section title="Business context" body={challenge.businessContext} />
            <Section title="Current pain points" body={challenge.currentPainPoints} />
            <Section title="Desired outcome" body={challenge.desiredOutcome} />
          </Card>
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="font-semibold">AI analysis</h2>
              {analysis ? (
                <p className="mt-2 text-sm text-emerald-700">
                  ✓ Generated · {analysis.suggestedAgents.length} agent concepts
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  Not yet generated. Run analysis to surface candidate agents,
                  benchmarks, and toolbox recommendations.
                </p>
              )}
              <div className="mt-3">
                <GenerateAnalysisButton
                  challengeId={challenge.id}
                  hasAnalysis={!!analysis}
                />
              </div>
            </Card>
            <Card className="p-6">
              <h2 className="font-semibold">Assignment</h2>
              <AssignTeamPanel
                challengeId={challenge.id}
                currentTeamId={challenge.team?.id || null}
                teams={teams.map((t) => ({
                  id: t.id,
                  name: t.name,
                  members: t._count.members,
                  hasChallenge: !!t.challenge,
                }))}
              />
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "analysis" ? (
        analysis ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="space-y-5 p-6 lg:col-span-2">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Reframed problem
                </h3>
                <p className="mt-2 text-slate-800">{analysis.reframedProblem.statement}</p>
              </div>
              <BulletList title="Root cause hypotheses" items={analysis.reframedProblem.rootCauseHypotheses} />
              <BulletList title="Success criteria" items={analysis.reframedProblem.successCriteria} />
            </Card>
            <Card className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Stakeholder map
              </h3>
              <ul className="mt-3 divide-y text-sm">
                {analysis.reframedProblem.stakeholderMap.map((s, i) => (
                  <li key={i} className="py-2">
                    <p className="font-medium">{s.stakeholder}</p>
                    <p className="text-xs text-slate-500">{s.interest}</p>
                    <Badge variant={s.influence}>{s.influence}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6 lg:col-span-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Executive summary
              </h3>
              <p className="mt-2 text-slate-800">{analysis.executiveSummary}</p>
            </Card>
          </div>
        ) : (
          <EmptyAnalysis challengeId={challenge.id} hasAnalysis={false} />
        )
      ) : null}

      {tab === "benchmarks" ? (
        analysis ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {analysis.benchmarking.similarCases.map((c, i) => (
                <Card key={i} className="space-y-2 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{c.organization}</h3>
                    <span className="text-xs text-slate-500">{c.industry}</span>
                  </div>
                  <p className="text-sm text-slate-700">{c.approach}</p>
                  <p className="text-sm">
                    <span className="font-medium">Outcome:</span>{" "}
                    <span className="text-slate-700">{c.outcome}</span>
                  </p>
                  <p className="text-xs text-slate-500">{c.relevanceToThisChallenge}</p>
                </Card>
              ))}
            </div>
            <div className="space-y-4">
              <Card className="p-5">
                <BulletList title="Industry best practices" items={analysis.benchmarking.industryBestPractices} />
              </Card>
              <Card className="p-5">
                <BulletList title="Common pitfalls" items={analysis.benchmarking.commonPitfalls} />
              </Card>
            </div>
          </div>
        ) : (
          <EmptyAnalysis challengeId={challenge.id} hasAnalysis={false} />
        )
      ) : null}

      {tab === "agents" ? (
        analysis ? (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Feasibility × Impact
              </h3>
              <FeasibilityImpactScatter
                color={challenge.project.primaryColor}
                points={analysis.suggestedAgents.map((a) => ({
                  name: a.name,
                  feasibility: a.feasibilityScore,
                  impact: a.impactScore,
                }))}
              />
            </Card>
            <div className="grid gap-4 md:grid-cols-2">
              {analysis.suggestedAgents.map((a, i) => (
                <Card key={i} className="space-y-3 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold">{a.name}</h3>
                      <p className="text-sm text-slate-600">{a.oneLiner}</p>
                    </div>
                    <Badge>{a.agentType}</Badge>
                  </div>
                  <div className="grid gap-2 rounded-md bg-slate-50 p-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Feasibility</span>
                      <span className="font-medium">{a.feasibilityScore}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Impact</span>
                      <span className="font-medium">{a.impactScore}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Effort</span>
                      <span className="font-medium">{a.estimatedBuildEffort}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Tech stack
                    </p>
                    <p className="text-sm">
                      {a.suggestedTechStack.framework} · {a.suggestedTechStack.llm}
                    </p>
                    <p className="text-xs text-slate-500">{a.suggestedTechStack.rationale}</p>
                  </div>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-slate-700">Capabilities & data</summary>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Capabilities</p>
                    <ul className="ml-4 list-disc text-sm">
                      {a.coreCapabilities.map((c, j) => <li key={j}>{c}</li>)}
                    </ul>
                    <p className="mt-2 text-xs font-semibold text-slate-500">Required data</p>
                    <ul className="ml-4 list-disc text-sm">
                      {a.requiredDataSources.map((c, j) => <li key={j}>{c}</li>)}
                    </ul>
                    <p className="mt-2 text-xs font-semibold text-slate-500">Risks</p>
                    <ul className="ml-4 list-disc text-sm">
                      {a.risks.map((c, j) => <li key={j}>{c}</li>)}
                    </ul>
                  </details>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <EmptyAnalysis challengeId={challenge.id} hasAnalysis={false} />
        )
      ) : null}

      {tab === "toolbox" ? (
        analysis ? (
          <div className="grid gap-4 md:grid-cols-2">
            {analysis.toolboxRecommendations.map((r, i) => (
              <Card key={i} className="p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500">{r.pillar}</p>
                <p className="mt-1 font-semibold">{r.asset}</p>
                <p className="mt-2 text-sm text-slate-600">{r.whyRelevant}</p>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyAnalysis challengeId={challenge.id} hasAnalysis={false} />
        )
      ) : null}

      {tab === "discussion" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card className="p-6">
              <h2 className="mb-3 font-semibold">Comments</h2>
              <ul className="space-y-3">
                {challenge.comments.map((c) => (
                  <li key={c.id} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">{c.authorName}{" "}
                      <span className="text-xs font-normal text-slate-500">· {c.authorRole}</span>
                    </p>
                    <p className="mt-1 text-slate-700">{c.body}</p>
                  </li>
                ))}
                {challenge.comments.length === 0 ? (
                  <li className="text-sm text-slate-500">No comments yet.</li>
                ) : null}
              </ul>
              <CommentForm challengeId={challenge.id} />
            </Card>
          </div>
          <ActivityFeed
            entries={recentActivity.map((a) => ({
              id: a.id,
              action: a.action,
              userName: a.userName,
              userType: a.userType,
              timestamp: a.timestamp,
            }))}
            emptyText="No related activity."
          />
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <p className="mt-2 whitespace-pre-line text-slate-800">{body}</p>
    </div>
  );
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <ul className="mt-2 ml-4 list-disc space-y-1 text-slate-800">
        {items.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

function EmptyAnalysis({
  challengeId,
  hasAnalysis,
}: {
  challengeId: string;
  hasAnalysis: boolean;
}) {
  return (
    <Card className="p-10 text-center text-sm text-slate-500">
      AI analysis not yet generated.
      <div className="mt-4">
        <GenerateAnalysisButton challengeId={challengeId} hasAnalysis={hasAnalysis} />
      </div>
    </Card>
  );
}
