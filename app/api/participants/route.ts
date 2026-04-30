import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/passwords";

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireSession("project_admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.email || !body.name || !body.password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const e = String(body.email).toLowerCase();
  const exists = await prisma.participant.findUnique({ where: { email: e } });
  if (exists) return NextResponse.json({ error: "Email already used" }, { status: 409 });
  const p = await prisma.participant.create({
    data: {
      email: e,
      name: body.name,
      department: body.department || null,
      jobTitle: body.jobTitle || null,
      passwordHash: await hashPassword(body.password),
      projectId: session.projectId as string,
    },
  });
  return NextResponse.json({ id: p.id });
}
