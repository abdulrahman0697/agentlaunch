import { prisma } from "@/lib/db";
import { getProjectAdminSession } from "@/lib/auth/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamRoster } from "./_roster";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const session = await getProjectAdminSession();
  const [teams, participants] = await Promise.all([
    prisma.team.findMany({
      where: { projectId: session.projectId },
      include: {
        members: { orderBy: { name: "asc" } },
        challenge: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.participant.findMany({
      where: { projectId: session.projectId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        department: true,
        teamId: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Project Admin"
        title="Teams & Participants"
        description="Each team works on one strategic challenge. Drag-free assignment via the dropdowns below."
      />
      <TeamRoster
        teams={teams.map((t) => ({
          id: t.id,
          name: t.name,
          challenge: t.challenge ? { id: t.challenge.id, title: t.challenge.title, status: t.challenge.status } : null,
          members: t.members.map((m) => ({
            id: m.id,
            name: m.name,
            department: m.department,
            jobTitle: m.jobTitle,
            stage: m.progressStage,
          })),
        }))}
        participants={participants.map((p) => ({
          id: p.id,
          name: p.name,
          department: p.department,
          teamId: p.teamId,
        }))}
      />
    </div>
  );
}
