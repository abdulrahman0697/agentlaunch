import { prisma } from "@/lib/db";
import { getParticipantSession } from "@/lib/auth/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const TEMPLATES = [
  { name: "Concept brief (one-pager)", description: "Reframed problem, success criteria, scope." },
  { name: "Agent blueprint canvas", description: "Inputs · tools · outputs · memory · guardrails." },
  { name: "ROI model", description: "Time saved · cost reduced · revenue enabled · adoption curve." },
  { name: "Pitch deck (5 slides)", description: "Problem → solution → demo → impact → ask." },
];

export default async function ResourcesPage() {
  const session = await getParticipantSession();
  const assignments = await prisma.projectToolboxItem.findMany({
    where: { projectId: session.projectId, enabled: true },
    include: { toolboxItem: true },
  });

  const grouped: Record<string, typeof assignments> = {};
  for (const a of assignments) {
    grouped[a.toolboxItem.pillar] ??= [];
    grouped[a.toolboxItem.pillar].push(a);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Resources & Tools"
        title="Sia Toolbox & Templates"
        description="Curated assets your project admin has unlocked, plus the standard templates you'll need across the program."
      />

      <Card className="p-6">
        <h2 className="font-semibold">Templates</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {TEMPLATES.map((t) => (
            <li key={t.name} className="rounded-md border p-4">
              <p className="font-medium">{t.name}</p>
              <p className="mt-1 text-xs text-slate-500">{t.description}</p>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(grouped).map(([pillar, items]) => (
          <Card key={pillar} className="p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">{pillar}</p>
            <ul className="mt-2 divide-y text-sm">
              {items.map((a) => (
                <li key={a.id} className="py-2">
                  <p className="font-medium">{a.toolboxItem.name}</p>
                  <p className="text-xs text-slate-500">{a.toolboxItem.description}</p>
                </li>
              ))}
            </ul>
          </Card>
        ))}
        {Object.keys(grouped).length === 0 ? (
          <Card className="p-6 text-sm text-slate-500 md:col-span-2">
            Your project admin hasn't enabled any toolbox items yet.
          </Card>
        ) : null}
      </div>

      <Card className="p-6">
        <h2 className="font-semibold">Community / Q&amp;A</h2>
        <p className="mt-1 text-xs text-slate-500">
          Lightweight forum for the cohort — coming soon.
        </p>
      </Card>
    </div>
  );
}
