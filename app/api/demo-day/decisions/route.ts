import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireSession("project_admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { agentId, decision } = await req.json();
  if (!agentId || !decision) {
    return NextResponse.json({ error: "agentId and decision required" }, { status: 400 });
  }
  // Make sure the agent belongs to this project
  const agent = await prisma.agentSolution.findUnique({
    where: { id: agentId },
    include: { team: true },
  });
  if (!agent || agent.team.projectId !== session.projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.agentSolution.update({
    where: { id: agentId },
    data: { demoDecision: decision },
  });
  await prisma.activityLog.create({
    data: {
      projectId: session.projectId as string,
      userId: session.sub,
      userType: "project_admin",
      userName: session.name,
      action: "system.demo_decision",
      payload: JSON.stringify({ agentId, decision }),
    },
  });
  return NextResponse.json({ ok: true });
}
