import { NextRequest, NextResponse } from "next/server";
import { authenticateSiaAdmin } from "@/lib/auth/lookup";
import { setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  const session = await authenticateSiaAdmin(email, password);
  if (!session) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  await setSessionCookie(session);
  await prisma.activityLog
    .create({
      data: {
        userId: session.sub,
        userType: "sia_admin",
        userName: session.name,
        action: "sia_admin.login",
        payload: JSON.stringify({ email: session.email }),
      },
    })
    .catch(() => {});
  return NextResponse.json({ ok: true, redirect: "/admin/dashboard" });
}
