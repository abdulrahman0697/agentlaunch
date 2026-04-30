import { getSession } from "@/lib/auth/session";

export default async function ProjectAdminDashboardPlaceholder() {
  const session = await getSession();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-500">
          Project Admin
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Welcome, {session?.name?.split(" ")[0] ?? "there"}.
        </h1>
        <p className="mt-1 text-slate-600">
          Full project dashboard ships in M4.
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        Dashboard contents coming in <strong>Milestone 4</strong> (Project Admin
        end-to-end).
      </div>
    </div>
  );
}
