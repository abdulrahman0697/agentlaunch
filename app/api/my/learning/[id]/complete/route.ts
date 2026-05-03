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
  await prisma.participantProgress.upsert({
    where: {
      participantId_resourceId: {
        participantId: session.sub,
        resourceId: id,
      },
    },
    update: { completedAt: new Date() },
    create: {
      participantId: session.sub,
      resourceId: id,
      completedAt: new Date(),
    },
  });
  return NextResponse.json({ ok: true });
}
