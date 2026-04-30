import { prisma } from "@/lib/db";
import { getParticipantSession } from "@/lib/auth/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { LearningList } from "./_list";

export const dynamic = "force-dynamic";

export default async function LearningHubPage() {
  const session = await getParticipantSession();
  const [resources, progress] = await Promise.all([
    prisma.learningResource.findMany({
      orderBy: [{ topic: "asc" }, { title: "asc" }],
    }),
    prisma.participantProgress.findMany({
      where: { participantId: session.sub },
    }),
  ]);

  const progressMap: Record<string, { completed: boolean; score?: number | null }> = {};
  for (const p of progress) {
    progressMap[p.resourceId] = {
      completed: !!p.completedAt,
      score: p.scorePercent,
    };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Champion"
        title="Learning Hub"
        description="Curated learning pack tied to your phase + chosen agent framework. Each module ends with a 5-question quiz."
      />
      <LearningList
        items={resources.map((r) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          provider: r.provider,
          topic: r.topic,
          minutes: r.estimatedMinutes,
          url: r.url,
          ...progressMap[r.id],
        }))}
      />
      <Card className="p-6">
        <h2 className="font-semibold">Certification pathway</h2>
        <p className="mt-1 text-sm text-slate-600">
          Modules completed here put you within reach of these external
          certifications:
        </p>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {[
            { name: "Anthropic — Prompt Engineering Fundamentals", url: "https://www.anthropic.com/learn/prompt-engineering-interactive-tutorial" },
            { name: "Google Cloud — Generative AI Fundamentals", url: "https://www.cloudskillsboost.google" },
            { name: "Microsoft AI-900 — Azure AI Fundamentals", url: "https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/" },
            { name: "DeepLearning.AI — Prompt Engineering for Developers", url: "https://www.deeplearning.ai/short-courses/" },
          ].map((c) => (
            <li key={c.name} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>{c.name}</span>
              <a href={c.url} target="_blank" rel="noreferrer" className="text-xs underline">
                Open →
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
