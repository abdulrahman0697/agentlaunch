"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Row {
  id: string;
  email: string;
  name: string;
  department: string | null;
  jobTitle: string | null;
}

export function ParticipantManager({ participants }: { participants: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function addOne(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/participants", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        name: fd.get("name"),
        department: fd.get("department"),
        jobTitle: fd.get("jobTitle"),
        password: fd.get("password"),
      }),
    });
    setBusy(false);
    if (res.ok) {
      setMsg("Added.");
      setAdding(false);
      (e.currentTarget as HTMLFormElement).reset();
      startTransition(() => router.refresh());
    } else {
      const j = await res.json().catch(() => ({}));
      setMsg(j.error || "Failed.");
    }
  }

  async function resetPassword(id: string) {
    const newPassword = prompt("Set a new temporary password for this user:");
    if (!newPassword) return;
    await fetch(`/api/participants/${id}/reset-password`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    alert("Password reset. (Email send is mocked — see server console.)");
  }

  async function remove(id: string) {
    if (!confirm("Remove this participant? Their progress will be deleted.")) return;
    await fetch(`/api/participants/${id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Participants ({participants.length})</h2>
        <Button size="sm" variant="gold" onClick={() => setAdding((v) => !v)}>
          {adding ? "Cancel" : "+ Add participant"}
        </Button>
      </div>

      {adding ? (
        <form onSubmit={addOne} className="mt-4 grid gap-3 rounded-md border bg-slate-50 p-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Email</Label>
            <Input name="email" type="email" required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input name="name" required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Department</Label>
            <Input name="department" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Job title</Label>
            <Input name="jobTitle" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Temporary password</Label>
            <Input name="password" defaultValue="changeme123" required />
          </div>
          <div className="md:col-span-2 flex gap-2">
            <Button type="submit" size="sm" variant="gold" disabled={busy}>
              {busy ? "Adding…" : "Add"}
            </Button>
            {msg ? <span className="text-xs text-slate-600">{msg}</span> : null}
          </div>
        </form>
      ) : null}

      <table className="mt-4 w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="py-2">Name</th>
            <th className="py-2">Email</th>
            <th className="py-2">Department</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {participants.map((p) => (
            <tr key={p.id}>
              <td className="py-2">{p.name}</td>
              <td className="py-2 text-slate-500">{p.email}</td>
              <td className="py-2 text-slate-500">{p.department || "—"}</td>
              <td className="py-2 text-right">
                <button
                  onClick={() => resetPassword(p.id)}
                  className="text-xs text-slate-700 hover:underline"
                >
                  Reset password
                </button>{" "}
                ·{" "}
                <button
                  onClick={() => remove(p.id)}
                  className="text-xs text-rose-700 hover:underline"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
          {participants.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-4 text-sm text-slate-500">
                No participants yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </Card>
  );
}
