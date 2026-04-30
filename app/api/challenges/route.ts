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
  if (!body.title || !body.description) {
    return NextResponse.json({ error: "Title and description required" }, { status: 400 });
  }
  const challenge = await prisma.strategicChallenge.create({
    data: {
      projectId: session.projectId as string,
      title: body.title,
      description: body.description,
      businessContext: body.businessContext || "",
      currentPainPoints: body.currentPainPoints || "",
      desiredOutcome: body.desiredOutcome || "",
      departmentTags: JSON.stringify(body.departmentTags || []),
      priority: body.priority || "medium",
      createdByProjectAdminId: session.sub,
    },
  });
  await prisma.activityLog.create({
    data: {
      projectId: session.projectId as string,
      userId: session.sub,
      userType: "project_admin",
      userName: session.name,
      action: "project_admin.challenge_created",
      payload: JSON.stringify({ challengeId: challenge.id, title: challenge.title }),
    },
  });
  return NextResponse.json({ id: challenge.id });
}
