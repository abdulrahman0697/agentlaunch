import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  let session;
  try {
    session = await requireSession("participant");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { score, answers } = await req.json();
  await prisma.quizAttempt.create({
    data: {
      participantId: session.sub,
      resourceId: params.id,
      scorePercent: Math.max(0, Math.min(100, Math.round(score))),
      answers: JSON.stringify(answers || {}),
    },
  });
  await prisma.participantProgress.upsert({
    where: {
      participantId_resourceId: {
        participantId: session.sub,
        resourceId: params.id,
      },
    },
    update: { completedAt: new Date(), scorePercent: score },
    create: {
      participantId: session.sub,
      resourceId: params.id,
      completedAt: new Date(),
      scorePercent: score,
    },
  });
  await prisma.activityLog.create({
    data: {
      projectId: session.projectId as string,
      userId: session.sub,
      userType: "participant",
      userName: session.name,
      action: "participant.quiz_completed",
      payload: JSON.stringify({ resourceId: params.id, score }),
    },
  });
  return NextResponse.json({ ok: true });
}
