import { NextRequest, NextResponse } from "next/server";
import { authenticateClientUser } from "@/lib/auth/lookup";
import { setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  const session = await authenticateClientUser(email, password);
  if (!session) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  await setSessionCookie(session);
  await prisma.activityLog
    .create({
      data: {
        projectId: session.projectId ?? null,
        userId: session.sub,
        userType: session.role,
        userName: session.name,
        action: `${session.role}.login`,
        payload: JSON.stringify({ email: session.email }),
      },
    })
    .catch(() => {});
  const redirect =
    session.role === "project_admin" ? "/dashboard" : "/my/dashboard";
  return NextResponse.json({ ok: true, redirect });
}
