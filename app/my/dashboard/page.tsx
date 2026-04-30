import Link from "next/link";
import { prisma } from "@/lib/db";
import { getParticipantSession } from "@/lib/auth/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { phaseForWeek, PHASES, PHASE_LABEL } from "@/lib/program";
import { safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

const WEEKLY_TASKS: Record<string, string[]> = {
  discovery: [
    "Read the auto-generated problem brief",
    "Refine your team's concept brief",
    "Pick a candidate agent from the analysis",
  ],
  design: [
    "Draft the agent blueprint (inputs / tools / outputs / memory / guardrails)",
    "Submit blueprint for AI review",
    "Pick a framework with rationale",
  ],
  build: [
    "Generate the code scaffolding for your framework",
    "Run the test harness with one realistic input",
    "Write down what broke and iterate",
  ],
  realization: [
    "Build the ROI model and run sanity check",
    "Define 3-5 KPIs",
    "Generate the pitch deck outline",
  ],
  completed: ["Demo Day prep — rehearse the 10-minute pitch"],
};

export default async function ParticipantDashboard() {
  const session = await getParticipantSession();
  const [project, participant, team] = await Promise.all([
    prisma.project.findUnique({ where: { id: session.projectId } }),
    prisma.participant.findUnique({
      where: { id: session.sub },
      include: { progress: true },
    }),
    session.teamId
      ? prisma.team.findUnique({
          where: { id: session.teamId },
          include: {
            members: true,
            challenge: true,
            agents: true,
          },
        })
      : null,
  ]);
  if (!project || !participant) return null;

  const phase = phaseForWeek(project.programWeek);
  const certs = safeJson<string[]>(participant.certificationsEarned, []);
  const completedModules = participant.progress.filter((p) => p.completedAt).length;
  const learningStreakHours = participant.progress.reduce(
    (sum, p) => sum + Math.round((p.scorePercent || 0) / 10),
    0,
  );
  const tasks = WEEKLY_TASKS[phase] || [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Week ${project.programWeek} of 10 · ${PHASE_LABEL[phase]}`}
        title={`Hi ${participant.name.split(" ")[0]}, you're in ${PHASE_LABEL[phase]}.`}
        description={
          team?.challenge
            ? `Your team ${team.name} is working on "${team.challenge.title}".`
            : team
              ? `Your team ${team.name} hasn't claimed a challenge yet.`
              : "You haven't joined a team yet — your project admin will assign you."
        }
        actions={
          team ? (
            <Link href="/my/build">
              <Button variant="gold">Open Build Workspace →</Button>
            </Link>
          ) : (
            <Link href="/my/challenges">
              <Button variant="gold">Browse challenges</Button>
            </Link>
          )
        }
      />

      <Card className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Your progress
          </h2>
          <span className="text-xs text-slate-500">
            {participant.progressStage}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {PHASES.map((p, i) => {
            const stages: string[] = ["discovery", "design", "build", "realization"];
            const userIdx = stages.indexOf(participant.progressStage);
            const isAtOrPast = userIdx >= 0 && i <= userIdx;
            return (
              <div
                key={p}
                className={`flex-1 rounded-md px-3 py-2 text-center text-xs font-medium ${
                  p === phase
                    ? "text-white"
                    : isAtOrPast
                      ? "bg-slate-200 text-slate-700"
                      : "bg-slate-100 text-slate-400"
                }`}
                style={p === phase ? { background: project.primaryColor } : undefined}
              >
                {PHASE_LABEL[p]}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <h2 className="mb-3 font-semibold">My Team</h2>
          {team ? (
            <>
              <p className="text-lg font-medium">{team.name}</p>
              <p className="text-sm text-slate-500">{team.members.length} teammates</p>
              {team.challenge ? (
                <Link
                  href={`/my/build`}
                  className="mt-2 block rounded-md border bg-slate-50 p-3 text-sm hover:bg-slate-100"
                >
                  <p className="font-medium">{team.challenge.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    <Badge variant={team.challenge.status}>
                      {team.challenge.status.replace("_", " ")}
                    </Badge>
                  </p>
                </Link>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Pick a challenge to start →{" "}
                  <Link href="/my/challenges" className="underline">
                    Browse
                  </Link>
                </p>
              )}
              <ul className="mt-4 space-y-1 text-xs text-slate-600">
                {team.members.slice(0, 6).map((m) => (
                  <li key={m.id}>· {m.name}</li>
                ))}
                {team.members.length > 6 ? <li>· +{team.members.length - 6} more</li> : null}
              </ul>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              You haven't been assigned to a team yet.
            </p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-3 font-semibold">This week's tasks</h2>
          <ul className="space-y-2 text-sm">
            {tasks.map((t, i) => (
              <li key={i} className="flex items-start gap-2">
                <input type="checkbox" className="mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="mb-3 font-semibold">Learning</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-slate-500">Modules done</p>
              <p className="text-2xl font-semibold">{completedModules}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Hours invested</p>
              <p className="text-2xl font-semibold">{learningStreakHours}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Certifications</p>
              <p className="text-2xl font-semibold">{certs.length}</p>
            </div>
          </div>
          <Link href="/my/learn">
            <Button size="sm" variant="outline" className="mt-4 w-full">
              Open Learning Hub
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
