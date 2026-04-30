import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try { await requireSession("sia_admin"); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { projectId, enabled } = await req.json();
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });
  if (enabled) {
    await prisma.projectToolboxItem.upsert({
      where: {
        projectId_toolboxItemId: { projectId, toolboxItemId: params.id },
      },
      update: { enabled: true },
      create: { projectId, toolboxItemId: params.id, enabled: true },
    });
  } else {
    await prisma.projectToolboxItem.deleteMany({
      where: { projectId, toolboxItemId: params.id },
    });
  }
  return NextResponse.json({ ok: true });
}
