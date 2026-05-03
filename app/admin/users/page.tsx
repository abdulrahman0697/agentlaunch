import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GlobalUsersPage() {
  const [siaAdmins, projectAdmins, participants] = await Promise.all([
    prisma.siaAdmin.findMany({ orderBy: { name: "asc" } }),
    prisma.projectAdmin.findMany({
      orderBy: { name: "asc" },
      include: { project: { select: { shortName: true, clientOrgName: true } } },
    }),
    prisma.participant.findMany({
      orderBy: { name: "asc" },
      include: { project: { select: { shortName: true, clientOrgName: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sia Admin"
        title="All Users"
        description="Every user across every project, in one place."
      />

      <Card className="overflow-hidden">
        <div className="border-b px-5 py-3">
          <h2 className="font-semibold">Sia Admins ({siaAdmins.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-2.5">Name</th>
              <th className="px-5 py-2.5">Email</th>
              <th className="px-5 py-2.5">Title</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {siaAdmins.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-2.5 font-medium">{u.name}</td>
                <td className="px-5 py-2.5 text-slate-600">{u.email}</td>
                <td className="px-5 py-2.5 text-slate-600">{u.title || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b px-5 py-3">
          <h2 className="font-semibold">Project Admins ({projectAdmins.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-2.5">Name</th>
              <th className="px-5 py-2.5">Email</th>
              <th className="px-5 py-2.5">Project</th>
              <th className="px-5 py-2.5">Last login</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {projectAdmins.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-2.5 font-medium">{u.name}</td>
                <td className="px-5 py-2.5 text-slate-600">{u.email}</td>
                <td className="px-5 py-2.5 text-slate-600">
                  {u.project?.shortName || u.project?.clientOrgName}
                </td>
                <td className="px-5 py-2.5 text-xs text-slate-500">
                  {u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b px-5 py-3">
          <h2 className="font-semibold">Participants ({participants.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-2.5">Name</th>
              <th className="px-5 py-2.5">Email</th>
              <th className="px-5 py-2.5">Project</th>
              <th className="px-5 py-2.5">Department</th>
              <th className="px-5 py-2.5">Stage</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {participants.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-2.5 font-medium">{u.name}</td>
                <td className="px-5 py-2.5 text-slate-600">{u.email}</td>
                <td className="px-5 py-2.5 text-slate-600">
                  {u.project?.shortName || u.project?.clientOrgName}
                </td>
                <td className="px-5 py-2.5 text-slate-600">{u.department || "—"}</td>
                <td className="px-5 py-2.5">
                  <Badge>{u.progressStage}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
