import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await getSession();
  if (session) {
    await prisma.activityLog
      .create({
        data: {
          projectId: (session.projectId as string) || null,
          userId: session.sub,
          userType: session.role,
          userName: session.name,
          action: `${session.role}.logout`,
          payload: "{}",
        },
      })
      .catch(() => {});
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
