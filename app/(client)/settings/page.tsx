import { prisma } from "@/lib/db";
import { getProjectAdminSession } from "@/lib/auth/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { ParticipantManager } from "./_participants";

export const dynamic = "force-dynamic";

export default async function ProjectAdminSettingsPage() {
  const session = await getProjectAdminSession();
  const [project, participants] = await Promise.all([
    prisma.project.findUnique({ where: { id: session.projectId } }),
    prisma.participant.findMany({
      where: { projectId: session.projectId },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!project) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Project Admin"
        title="Settings"
        description="Manage participants and your notification preferences. Branding is controlled by the Sia team."
      />

      <Card className="p-6">
        <h2 className="font-semibold">Branding (read-only)</h2>
        <p className="mt-1 text-xs text-slate-500">
          The Sia team owns branding. Reach out if you need a change.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-md border p-4">
            <p className="text-xs uppercase text-slate-500">Client</p>
            <p className="mt-1 font-medium">{project.clientOrgName}</p>
            <p className="mt-1 text-sm text-slate-600">{project.welcomeMessage || "—"}</p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-xs uppercase text-slate-500">Palette</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="h-6 w-6 rounded" style={{ background: project.primaryColor }} />
              {project.primaryColor}
              <span className="ml-3 h-6 w-6 rounded" style={{ background: project.secondaryColor }} />
              {project.secondaryColor}
            </div>
          </div>
        </div>
      </Card>

      <ParticipantManager
        participants={participants.map((p) => ({
          id: p.id,
          email: p.email,
          name: p.name,
          department: p.department,
          jobTitle: p.jobTitle,
        }))}
      />

      <Card className="p-6">
        <h2 className="font-semibold">Notification preferences</h2>
        <p className="mt-1 text-xs text-slate-500">
          Local-only toggles for the prototype — preferences are not persisted.
        </p>
        <div className="mt-4 space-y-2 text-sm">
          {[
            "Daily digest of cohort activity",
            "New challenge AI analysis ready",
            "Blueprint submitted for review",
            "Demo Day reminders",
          ].map((label) => (
            <label key={label} className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              {label}
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}
