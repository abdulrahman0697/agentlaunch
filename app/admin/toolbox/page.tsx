import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { ToolboxEditor } from "./_editor";

export const dynamic = "force-dynamic";

const PILLARS = [
  "Strategy",
  "Operating Model",
  "Solutions",
  "Skills",
  "Technology and Data",
  "Culture",
];

export default async function ToolboxPage() {
  const [items, projects, assignments] = await Promise.all([
    prisma.toolboxItem.findMany({ orderBy: [{ pillar: "asc" }, { name: "asc" }] }),
    prisma.project.findMany({
      where: { status: { in: ["active", "draft", "completed"] } },
      orderBy: { name: "asc" },
    }),
    prisma.projectToolboxItem.findMany(),
  ]);

  const grouped = PILLARS.map((p) => ({
    pillar: p,
    items: items.filter((i) => i.pillar === p),
  }));

  const assignmentMap: Record<string, Record<string, boolean>> = {};
  for (const a of assignments) {
    assignmentMap[a.toolboxItemId] ??= {};
    assignmentMap[a.toolboxItemId][a.projectId] = a.enabled;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sia Admin"
        title="Sia Toolbox"
        description="The 6-pillar Sia toolbox. Add or edit assets, then control which projects see each one."
      />

      <Card className="p-6">
        <ToolboxEditor
          pillars={PILLARS}
          items={items.map((i) => ({
            id: i.id,
            pillar: i.pillar,
            name: i.name,
            description: i.description,
            url: i.url,
          }))}
          projects={projects.map((p) => ({
            id: p.id,
            name: p.shortName || p.clientOrgName,
          }))}
          assignmentMap={assignmentMap}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {grouped.map((g) => (
          <Card key={g.pillar} className="p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {g.pillar}
            </h2>
            <ul className="divide-y text-sm">
              {g.items.map((i) => (
                <li key={i.id} className="py-2">
                  <p className="font-medium">{i.name}</p>
                  <p className="text-xs text-slate-500">{i.description}</p>
                </li>
              ))}
              {g.items.length === 0 ? (
                <li className="py-3 text-sm text-slate-400">No items yet in this pillar.</li>
              ) : null}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
