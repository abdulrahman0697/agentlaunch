import { getSession } from "@/lib/auth/session";

export default async function SiaAdminDashboardPlaceholder() {
  const session = await getSession();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-500">Sia Admin</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome back, {session?.name?.split(" ")[0] ?? "Admin"}.
        </h1>
        <p className="mt-1 text-slate-600">
          Cross-project console — full dashboard ships in M3.
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        Dashboard contents coming in <strong>Milestone 3</strong> (Sia Admin
        end-to-end).
      </div>
    </div>
  );
}
