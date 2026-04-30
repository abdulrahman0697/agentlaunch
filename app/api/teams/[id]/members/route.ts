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
  const { participantId, action } = await req.json();
  const team = await prisma.team.findUnique({ where: { id: params.id } });
  if (!team || team.projectId !== session.projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.participant.update({
    where: { id: participantId },
    data: { teamId: action === "remove" ? null : params.id },
  });
  return NextResponse.json({ ok: true });
}
