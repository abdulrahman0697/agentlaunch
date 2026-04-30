import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  let session;
  try {
    session = await requireSession("sia_admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const key of [
    "name",
    "clientOrgName",
    "shortName",
    "description",
    "welcomeMessage",
    "logoUrl",
    "primaryColor",
    "secondaryColor",
    "backgroundAccent",
    "status",
  ]) {
    if (key in body) data[key] = body[key];
  }
  if (typeof body.cohortSize === "number") data.cohortSize = body.cohortSize;
  if (typeof body.programWeek === "number") data.programWeek = body.programWeek;
  if (typeof body.certificationsEnabled === "boolean")
    data.certificationsEnabled = body.certificationsEnabled;
  if (body.startDate) data.startDate = new Date(body.startDate);
  if (body.endDate) data.endDate = new Date(body.endDate);

  const updated = await prisma.project.update({
    where: { id: params.id },
    data,
  });

  if (typeof body.programWeek === "number") {
    await prisma.activityLog.create({
      data: {
        projectId: updated.id,
        userId: session.sub,
        userType: "sia_admin",
        userName: session.name,
        action: "sia_admin.week_advanced",
        payload: JSON.stringify({ programWeek: body.programWeek }),
      },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  let session;
  try {
    session = await requireSession("sia_admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Soft-delete by archiving (per BRD Section 4.2 — soft delete with confirm modal).
  const updated = await prisma.project.update({
    where: { id: params.id },
    data: { status: "archived" },
  });
  await prisma.activityLog.create({
    data: {
      projectId: updated.id,
      userId: session.sub,
      userType: "sia_admin",
      userName: session.name,
      action: "sia_admin.project_archived",
      payload: "{}",
    },
  });
  return NextResponse.json({ ok: true });
}
