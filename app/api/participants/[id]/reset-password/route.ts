import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/passwords";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["project_admin", "sia_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { password } = await req.json();
  if (!password) return NextResponse.json({ error: "password required" }, { status: 400 });
  const p = await prisma.participant.findUnique({ where: { id: id } });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role === "project_admin" && p.projectId !== session.projectId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.participant.update({
    where: { id: id },
    data: { passwordHash: await hashPassword(password) },
  });
  console.log(`[email-mock] Password reset → ${p.email}: new password "${password}"`);
  return NextResponse.json({ ok: true });
}
