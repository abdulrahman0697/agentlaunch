import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try { await requireSession("sia_admin"); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await prisma.toolboxItem.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
