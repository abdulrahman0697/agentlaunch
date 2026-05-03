import { prisma } from "@/lib/db";
import { verifyPassword } from "./passwords";
import type { SessionPayload } from "./session";

/**
 * Authenticate a Sia Admin (separate auth flow per BRD Section 4).
 */
export async function authenticateSiaAdmin(
  email: string,
  password: string,
): Promise<SessionPayload | null> {
  const user = await prisma.siaAdmin.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!user) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  return {
    sub: user.id,
    role: "sia_admin",
    name: user.name,
    email: user.email,
    projectId: null,
    teamId: null,
  };
}

/**
 * Authenticate a Project Admin OR Participant against the same login form
 * (BRD Section 5/6 — same login URL, routed by role).
 */
export async function authenticateClientUser(
  email: string,
  password: string,
): Promise<SessionPayload | null> {
  const e = email.toLowerCase().trim();
  const admin = await prisma.projectAdmin.findUnique({ where: { email: e } });
  if (admin) {
    const ok = await verifyPassword(password, admin.passwordHash);
    if (!ok) return null;
    await prisma.projectAdmin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });
    return {
      sub: admin.id,
      role: "project_admin",
      name: admin.name,
      email: admin.email,
      projectId: admin.projectId,
      teamId: null,
    };
  }
  const participant = await prisma.participant.findUnique({ where: { email: e } });
  if (participant) {
    const ok = await verifyPassword(password, participant.passwordHash);
    if (!ok) return null;
    await prisma.participant.update({
      where: { id: participant.id },
      data: { lastLoginAt: new Date() },
    });
    return {
      sub: participant.id,
      role: "participant",
      name: participant.name,
      email: participant.email,
      projectId: participant.projectId,
      teamId: participant.teamId ?? null,
    };
  }
  return null;
}
