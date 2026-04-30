import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "./session";

export async function getSiaAdminSession() {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  if (s.role !== "sia_admin") redirect("/login");
  return s;
}

export async function getProjectAdminSession(): Promise<
  SessionPayload & { projectId: string }
> {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role !== "project_admin") {
    redirect(s.role === "sia_admin" ? "/admin/dashboard" : "/my/dashboard");
  }
  if (!s.projectId) redirect("/login");
  return { ...s, projectId: s.projectId as string };
}

export async function getParticipantSession(): Promise<
  SessionPayload & { projectId: string; teamId: string | null }
> {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role !== "participant") {
    redirect(s.role === "sia_admin" ? "/admin/dashboard" : "/dashboard");
  }
  if (!s.projectId) redirect("/login");
  return {
    ...s,
    projectId: s.projectId as string,
    teamId: (s.teamId as string | null) ?? null,
  };
}
