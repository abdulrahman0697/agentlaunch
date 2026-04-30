import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  let session;
  try {
    session = await requireSession("project_admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { teamId } = await req.json();
  const challenge = await prisma.strategicChallenge.findUnique({
    where: { id: params.id },
  });
  if (!challenge || challenge.projectId !== session.projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Detach any prior team — the relation is owned by Team via challengeId.
  await prisma.team.updateMany({
    where: { challengeId: params.id },
    data: { challengeId: null },
  });

  let newStatus = challenge.status;
  if (teamId) {
    await prisma.team.update({
      where: { id: teamId },
      data: { challengeId: params.id },
    });
    if (challenge.status === "open") newStatus = "claimed";
  } else {
    newStatus = "open";
  }
  await prisma.strategicChallenge.update({
    where: { id: params.id },
    data: { status: newStatus },
  });

  await prisma.activityLog.create({
    data: {
      projectId: session.projectId as string,
      userId: session.sub,
      userType: "project_admin",
      userName: session.name,
      action: teamId ? "project_admin.team_assigned" : "project_admin.team_unassigned",
      payload: JSON.stringify({ challengeId: params.id, teamId }),
    },
  });

  return NextResponse.json({ ok: true });
}
