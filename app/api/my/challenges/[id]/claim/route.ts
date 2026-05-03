import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let session;
  try {
    session = await requireSession("participant");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.teamId) {
    return NextResponse.json({ error: "You're not on a team yet" }, { status: 400 });
  }
  const challenge = await prisma.strategicChallenge.findUnique({
    where: { id: id },
  });
  if (!challenge || challenge.projectId !== session.projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (challenge.status !== "open") {
    return NextResponse.json({ error: "Already claimed" }, { status: 409 });
  }
  const team = await prisma.team.findUnique({ where: { id: session.teamId as string } });
  if (!team || team.projectId !== session.projectId) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }
  if (team.challengeId) {
    return NextResponse.json({ error: "Your team already has a challenge" }, { status: 409 });
  }
  await prisma.team.update({
    where: { id: session.teamId as string },
    data: { challengeId: id },
  });
  await prisma.strategicChallenge.update({
    where: { id: id },
    data: { status: "claimed" },
  });
  await prisma.activityLog.create({
    data: {
      projectId: session.projectId as string,
      userId: session.sub,
      userType: "participant",
      userName: session.name,
      action: "participant.challenge_claimed",
      payload: JSON.stringify({ challengeId: id, teamId: session.teamId }),
    },
  });
  return NextResponse.json({ ok: true });
}
