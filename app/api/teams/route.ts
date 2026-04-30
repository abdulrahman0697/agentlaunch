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
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const team = await prisma.team.create({
    data: {
      name: body.name,
      projectId: session.projectId as string,
    },
  });
  await prisma.activityLog.create({
    data: {
      projectId: session.projectId as string,
      userId: session.sub,
      userType: "project_admin",
      userName: session.name,
      action: "project_admin.team_created",
      payload: JSON.stringify({ teamId: team.id, name: team.name }),
    },
  });
  return NextResponse.json({ id: team.id });
}
