import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

export async function PUT(req: NextRequest) {
  let session;
  try {
    session = await requireSession("project_admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const data = {
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
    notes: body.notes || null,
    reviewers: JSON.stringify(body.reviewers || []),
    pitchOrder: JSON.stringify(body.pitchOrder || []),
  };
  await prisma.demoDay.upsert({
    where: { projectId: session.projectId as string },
    create: { projectId: session.projectId as string, ...data },
    update: data,
  });
  return NextResponse.json({ ok: true });
}
