import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { SidebarNav } from "@/components/sidebar-nav";
import { LogoutButton } from "@/components/logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  // Login page handles its own layout — only wrap authenticated views.
  if (!session) return <>{children}</>;
  if (session.role !== "sia_admin") redirect("/login");

  return (
    <div className="flex min-h-screen">
      <SidebarNav
        brand={
          <div>
            <p className="text-xs uppercase tracking-wider text-[#C5A572]">Sia Partners</p>
            <p className="mt-1 text-lg font-semibold">AgentLaunch · Admin</p>
          </div>
        }
        items={[
          { href: "/admin/dashboard", label: "Dashboard" },
          { href: "/admin/projects", label: "Projects" },
          { href: "/admin/users", label: "Users" },
          { href: "/admin/analytics", label: "Cross-Project Analytics" },
          { href: "/admin/toolbox", label: "Sia Toolbox" },
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
      <div className="flex-1 bg-slate-50">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
