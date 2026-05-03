import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { body } = await req.json();
  if (!body) return NextResponse.json({ error: "body required" }, { status: 400 });

  const challenge = await prisma.strategicChallenge.findUnique({
    where: { id: id },
  });
  if (!challenge || challenge.projectId !== session.projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const comment = await prisma.challengeComment.create({
    data: {
      challengeId: id,
      authorName: session.name,
      authorRole: session.role,
      body,
    },
  });
  return NextResponse.json({ id: comment.id });
}
