import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { SidebarNav } from "@/components/sidebar-nav";
import { LogoutButton } from "@/components/logout-button";

export default async function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "participant") {
    redirect(session.role === "sia_admin" ? "/admin/dashboard" : "/dashboard");
  }
  const project = session.projectId
    ? await prisma.project.findUnique({ where: { id: session.projectId as string } })
    : null;

  const cssVars = {
    "--brand-primary": project?.primaryColor || "#0B1F3A",
    "--brand-secondary": project?.secondaryColor || "#C5A572",
    "--brand-accent": project?.backgroundAccent || "#F5F0EA",
  } as React.CSSProperties;

  return (
    <div className="flex min-h-screen" style={cssVars}>
      <SidebarNav
        brand={
          <div>
            <p className="text-xs uppercase tracking-wider text-white/70">
              {project?.clientOrgName ?? "AgentLaunch"}
            </p>
            <p className="mt-1 text-lg font-semibold">My Workspace</p>
            {project ? (
              <p className="mt-1 text-xs text-white/50">
                Week {project.programWeek} of 10
              </p>
            ) : null}
          </div>
        }
        items={[
          { href: "/my/dashboard", label: "Dashboard" },
          { href: "/my/challenges", label: "Challenges" },
          { href: "/my/build", label: "Build Workspace" },
          { href: "/my/learn", label: "Learning Hub" },
          { href: "/my/resources", label: "Resources & Tools" },
        ]}
        footer={
          <div className="space-y-2 text-xs text-white/60">
            <p className="font-medium text-white">{session.name}</p>
            <p className="truncate">{session.email}</p>
            <LogoutButton
              variant="outline"
              className="mt-2 w-full border-white/20 text-white hover:bg-white/10 hover:text-white"
            />
          </div>
        }
      />
      <div
        className="flex-1"
        style={{ backgroundColor: project?.backgroundAccent || "#F5F0EA" }}
      >
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
