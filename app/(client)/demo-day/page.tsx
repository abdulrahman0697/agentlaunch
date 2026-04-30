import { prisma } from "@/lib/db";
import { getProjectAdminSession } from "@/lib/auth/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { DemoDayPanel } from "./_panel";
import { safeJson, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Reviewer {
  name: string;
  email: string;
  org?: string;
}

export default async function DemoDayPage() {
  const session = await getProjectAdminSession();
  const [demoDay, teams] = await Promise.all([
    prisma.demoDay.findUnique({ where: { projectId: session.projectId } }),
    prisma.team.findMany({
      where: { projectId: session.projectId },
      include: { challenge: true, agents: true },
    }),
  ]);

  const reviewers = safeJson<Reviewer[]>(demoDay?.reviewers ?? null, []);
  const order = safeJson<string[]>(demoDay?.pitchOrder ?? null, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Project Admin"
        title="Demo Day"
        description="Schedule the cohort's pitch session, invite reviewers, set the order, and capture greenlight decisions."
      />

      <DemoDayPanel
        scheduledAt={demoDay?.scheduledAt ? demoDay.scheduledAt.toISOString() : null}
        notes={demoDay?.notes || ""}
        reviewers={reviewers}
        teams={teams.map((t) => ({
          id: t.id,
          name: t.name,
          challenge: t.challenge?.title || null,
          agents: t.agents.map((a) => ({
            id: a.id,
            name: a.name,
            status: a.status,
            decision: a.demoDecision,
          })),
        }))}
        pitchOrder={order}
      />

      <Card className="p-6">
        <h2 className="font-semibold">Decisions logged</h2>
        <ul className="mt-3 divide-y text-sm">
          {teams.flatMap((t) =>
            t.agents
              .filter((a) => a.demoDecision)
              .map((a) => (
                <li key={a.id} className="py-2">
                  <p className="font-medium">{t.name} · {a.name}</p>
                  <p className="text-xs text-slate-500">
                    {a.demoDecision} · {a.updatedAt ? formatDate(a.updatedAt) : ""}
                  </p>
                </li>
              )),
          )}
          {teams.flatMap((t) => t.agents.filter((a) => a.demoDecision)).length === 0 ? (
            <li className="py-4 text-sm text-slate-500">
              No decisions logged yet — record one for any agent below.
            </li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}
