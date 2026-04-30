import Link from "next/link";
import { prisma } from "@/lib/db";
import { getProjectAdminSession } from "@/lib/auth/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ChallengesListPage() {
  const session = await getProjectAdminSession();
  const challenges = await prisma.strategicChallenge.findMany({
    where: { projectId: session.projectId },
    orderBy: { createdAt: "desc" },
    include: { team: true, agents: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Project Admin"
        title="Strategic Challenges"
        description="Post the highest-impact problems for your AI Champions to attack. Each challenge runs through AI analysis to surface candidate agents."
        actions={
          <Link href="/challenges/new">
            <Button variant="gold">+ New challenge</Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {challenges.map((c) => {
          const suggested = safeJson<unknown[]>(c.suggestedAgents, []);
          const tags = safeJson<string[]>(c.departmentTags, []);
          return (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/challenges/${c.id}`} className="flex-1">
                  <h2 className="text-lg font-semibold hover:underline">{c.title}</h2>
                </Link>
                <Badge variant={c.priority}>{c.priority}</Badge>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-slate-600">{c.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <Badge variant={c.status}>{c.status.replace("_", " ")}</Badge>
                {c.aiAnalysis ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                    AI analysis · {suggested.length} agents
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                    Awaiting analysis
                  </span>
                )}
                {c.team ? <span className="text-slate-500">· {c.team.name}</span> : null}
                {tags.slice(0, 3).map((t) => (
                  <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                    {t}
                  </span>
                ))}
              </div>
            </Card>
          );
        })}
        {challenges.length === 0 ? (
          <Card className="p-10 text-center text-sm text-slate-500 md:col-span-2">
            No challenges yet.{" "}
            <Link href="/challenges/new" className="font-medium text-slate-800 underline">
              Post your first
            </Link>
            .
          </Card>
        ) : null}
      </div>
    </div>
  );
}
