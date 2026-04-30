import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/passwords";

export async function POST(
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
  if (!body.email || !body.name || !body.password) {
    return NextResponse.json({ error: "Email, name, password required" }, { status: 400 });
  }
  const exists = await prisma.projectAdmin.findUnique({
    where: { email: String(body.email).toLowerCase() },
  });
  if (exists) {
    return NextResponse.json({ error: "Email already used" }, { status: 409 });
  }
  const admin = await prisma.projectAdmin.create({
    data: {
      email: String(body.email).toLowerCase(),
      name: body.name,
      jobTitle: body.jobTitle || null,
      department: body.department || null,
      passwordHash: await hashPassword(body.password),
      projectId: params.id,
    },
  });
  // Mock email send (Section 11 — print to console).
  console.log(
    `[email-mock] Project Admin invitation → ${admin.email}: temporary password "${body.password}"`,
  );
  await prisma.activityLog.create({
    data: {
      projectId: params.id,
      userId: session.sub,
      userType: "sia_admin",
      userName: session.name,
      action: "sia_admin.project_admin_invited",
      payload: JSON.stringify({ email: admin.email, name: admin.name }),
    },
  });
  return NextResponse.json({ id: admin.id });
}
