import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

const SCALAR_FIELDS = [
  "name",
  "description",
  "purpose",
  "agentType",
  "framework",
  "llm",
  "memory",
  "guardrails",
  "status",
] as const;

const NUMBER_FIELDS = ["feasibilityScore", "impactScore"] as const;

const JSON_FIELDS = [
  "inputs",
  "tools",
  "outputs",
  "architecture",
  "techStack",
  "kpis",
  "risks",
  "roadmap",
  "roiModel",
] as const;

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  let session;
  try {
    session = await requireSession("participant");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const agent = await prisma.agentSolution.findUnique({
    where: { id: params.id },
    include: { team: true },
  });
  if (!agent || agent.team.projectId !== session.projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (agent.teamId !== session.teamId) {
    return NextResponse.json({ error: "Not your team" }, { status: 403 });
  }
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const k of SCALAR_FIELDS) {
    if (k in body) data[k] = body[k];
  }
  for (const k of NUMBER_FIELDS) {
    if (k in body && typeof body[k] === "number") data[k] = body[k];
  }
  for (const k of JSON_FIELDS) {
    if (k in body) data[k] = JSON.stringify(body[k]);
  }
  await prisma.agentSolution.update({ where: { id: params.id }, data });

  if (body.status === "blueprint" && agent.status === "draft") {
    await prisma.activityLog.create({
      data: {
        projectId: session.projectId as string,
        userId: session.sub,
        userType: "participant",
        userName: session.name,
        action: "participant.blueprint_saved",
        payload: JSON.stringify({ agentId: params.id }),
      },
    });
  }
  return NextResponse.json({ ok: true });
}
