import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProjectsListPage() {
  const projects = await prisma.project.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      _count: {
        select: { participants: true, challenges: true, teams: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sia Admin"
        title="All Projects"
        description="Every client engagement on the platform — past, present, and pipeline."
        actions={
          <Link href="/admin/projects/new">
            <Button variant="gold">+ New Project</Button>
          </Link>
        }
      />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Project</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Start</th>
              <th className="px-5 py-3">End</th>
              <th className="px-5 py-3">Week</th>
              <th className="px-5 py-3">Cohort</th>
              <th className="px-5 py-3">Teams</th>
              <th className="px-5 py-3">Challenges</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {projects.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded text-xs font-semibold text-white"
                      style={{ background: p.primaryColor }}
                    >
                      {(p.shortName || p.clientOrgName).slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <Link
                        href={`/admin/projects/${p.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-slate-500">{p.clientOrgName}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <Badge variant={p.status}>{p.status}</Badge>
                </td>
                <td className="px-5 py-3 text-xs text-slate-600">
                  {formatDate(p.startDate)}
                </td>
                <td className="px-5 py-3 text-xs text-slate-600">
                  {formatDate(p.endDate)}
                </td>
                <td className="px-5 py-3 text-slate-600">{p.programWeek}/10</td>
                <td className="px-5 py-3 text-slate-600">
                  {p._count.participants}/{p.cohortSize}
                </td>
                <td className="px-5 py-3 text-slate-600">{p._count.teams}</td>
                <td className="px-5 py-3 text-slate-600">
                  {p._count.challenges}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/admin/projects/${p.id}`}
                    className="text-xs font-medium text-slate-700 hover:underline"
                  >
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
            {projects.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-sm text-slate-500">
                  No projects yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
