"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddUsersPanel({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [adminMsg, setAdminMsg] = useState<string | null>(null);
  const [participantMsg, setParticipantMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function inviteAdmin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/projects/${projectId}/admins`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        name: fd.get("name"),
        jobTitle: fd.get("jobTitle"),
        department: fd.get("department"),
        password: fd.get("password"),
      }),
    });
    setBusy(false);
    if (res.ok) {
      setAdminMsg("Project Admin invited. (Email send is mocked — see server console.)");
      (e.currentTarget as HTMLFormElement).reset();
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setAdminMsg(j.error || "Failed to invite admin.");
    }
  }

  async function addOneParticipant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/projects/${projectId}/participants`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "single",
        email: fd.get("email"),
        name: fd.get("name"),
        department: fd.get("department"),
        jobTitle: fd.get("jobTitle"),
        password: fd.get("password"),
      }),
    });
    setBusy(false);
    const j = await res.json();
    if (res.ok) {
      setParticipantMsg(`Added ${j.added} participant(s).`);
      (e.currentTarget as HTMLFormElement).reset();
      router.refresh();
    } else {
      setParticipantMsg(j.error || "Failed.");
    }
  }

  async function uploadCsv(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const csv = fd.get("csv");
    const defaultPassword = fd.get("defaultPassword");
    const res = await fetch(`/api/admin/projects/${projectId}/participants`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "csv", csv, defaultPassword }),
    });
    setBusy(false);
    const j = await res.json();
    if (res.ok) {
      setParticipantMsg(`Imported ${j.added} participant(s). ${j.skipped} skipped.`);
      (e.currentTarget as HTMLFormElement).reset();
      router.refresh();
    } else {
      setParticipantMsg(j.error || "Failed.");
    }
  }

  return (
    <Card className="space-y-6 p-6">
      <h2 className="font-semibold">Add users</h2>

      <div>
        <p className="mb-2 text-sm font-medium">Invite a Project Admin</p>
        <form onSubmit={inviteAdmin} className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Email</Label>
            <Input name="email" type="email" required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input name="name" required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Job title</Label>
            <Input name="jobTitle" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Department</Label>
            <Input name="department" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Temporary password</Label>
            <Input name="password" type="text" defaultValue="changeme123" required />
            <p className="text-xs text-slate-500">
              Email send is mocked — log appears in the server console.
            </p>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" variant="gold" size="sm" disabled={busy}>
              {busy ? "Sending…" : "Send invitation"}
            </Button>
            {adminMsg ? <span className="ml-3 text-xs text-slate-600">{adminMsg}</span> : null}
          </div>
        </form>
      </div>

      <div className="border-t pt-6">
        <p className="mb-2 text-sm font-medium">Add a single participant</p>
        <form onSubmit={addOneParticipant} className="grid gap-3 md:grid-cols-2">
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
            <Input name="password" type="text" defaultValue="changeme123" required />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" size="sm" disabled={busy}>Add participant</Button>
          </div>
        </form>
      </div>

      <div className="border-t pt-6">
        <p className="mb-2 text-sm font-medium">Bulk CSV import</p>
        <form onSubmit={uploadCsv} className="space-y-3">
          <p className="text-xs text-slate-500">
            Columns: <code>email,name,department,jobTitle</code> (header row optional).
            One participant per line.
          </p>
          <Textarea
            name="csv"
            rows={6}
            placeholder={
              "email,name,department,jobTitle\n" +
              "ahmed@org.com,Ahmed Al-Kuwari,Air Navigation Services,Senior ATC\n" +
              "fatima@org.com,Fatima Al-Thani,Safety,Inspector"
            }
            required
          />
          <div className="space-y-1">
            <Label className="text-xs">Default password (applies to all rows)</Label>
            <Input name="defaultPassword" defaultValue="changeme123" required />
          </div>
          <Button type="submit" size="sm" disabled={busy}>Import CSV</Button>
        </form>
        {participantMsg ? (
          <p className="mt-2 text-xs text-slate-600">{participantMsg}</p>
        ) : null}
      </div>
    </Card>
  );
}
