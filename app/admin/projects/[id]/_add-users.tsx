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
  const [adminCsvMsg, setAdminCsvMsg] = useState<string | null>(null);
  const [participantMsg, setParticipantMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // ---- Admin: single add ----------------------------------------------
  async function addAdmin(e: React.FormEvent<HTMLFormElement>, mode: "add" | "invite") {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setAdminMsg(null);
    const fd = new FormData(form);
    const res = await fetch(`/api/admin/projects/${projectId}/admins`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode,
        email: fd.get("email"),
        name: fd.get("name"),
        jobTitle: fd.get("jobTitle"),
        department: fd.get("department"),
        password: fd.get("password"),
      }),
    });
    setBusy(false);
    if (res.ok) {
      setAdminMsg(
        mode === "invite"
          ? "Invitation sent (mocked email — see server console)."
          : "Project Admin added.",
      );
      form.reset();
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setAdminMsg(j.error || "Failed to add admin.");
    }
  }

  // ---- Admin: CSV bulk -------------------------------------------------
  async function uploadAdminCsv(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setAdminCsvMsg(null);
    const fd = new FormData(form);
    const res = await fetch(`/api/admin/projects/${projectId}/admins`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "csv",
        csv: fd.get("csv"),
        defaultPassword: fd.get("defaultPassword"),
      }),
    });
    setBusy(false);
    const j = await res.json();
    if (res.ok) {
      setAdminCsvMsg(`Imported ${j.added} admin(s). ${j.skipped} skipped.`);
      form.reset();
      router.refresh();
    } else {
      setAdminCsvMsg(j.error || "Failed.");
    }
  }

  // ---- Participants: single + CSV (unchanged) --------------------------
  async function addOneParticipant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setParticipantMsg(null);
    const fd = new FormData(form);
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
      form.reset();
      router.refresh();
    } else {
      setParticipantMsg(j.error || "Failed.");
    }
  }

  async function uploadParticipantCsv(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setParticipantMsg(null);
    const fd = new FormData(form);
    const res = await fetch(`/api/admin/projects/${projectId}/participants`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "csv",
        csv: fd.get("csv"),
        defaultPassword: fd.get("defaultPassword"),
      }),
    });
    setBusy(false);
    const j = await res.json();
    if (res.ok) {
      setParticipantMsg(`Imported ${j.added} participant(s). ${j.skipped} skipped.`);
      form.reset();
      router.refresh();
    } else {
      setParticipantMsg(j.error || "Failed.");
    }
  }

  return (
    <Card className="space-y-8 p-6">
      <h2 className="font-semibold">Add users</h2>

      {/* ===================== PROJECT ADMINS ============================ */}
      <section className="space-y-4">
        <p className="text-sm font-medium text-slate-800">Project Admins</p>

        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
            Add manually
          </p>
          <form onSubmit={(e) => addAdmin(e, "add")} className="grid gap-3 md:grid-cols-2">
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
              <Label className="text-xs">Password</Label>
              <Input name="password" type="text" defaultValue="changeme123" required />
              <p className="text-xs text-slate-500">
                Account is created immediately. Use the "Invite" button instead if
                you also want the mocked invitation log.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:col-span-2">
              <Button type="submit" variant="gold" size="sm" disabled={busy}>
                {busy ? "Working…" : "Add admin"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={(e) => {
                  const form = (e.currentTarget as HTMLButtonElement).form;
                  if (form) {
                    addAdmin(
                      { preventDefault() {}, currentTarget: form } as unknown as React.FormEvent<HTMLFormElement>,
                      "invite",
                    );
                  }
                }}
              >
                Invite (mock email)
              </Button>
              {adminMsg ? <span className="text-xs text-slate-600">{adminMsg}</span> : null}
            </div>
          </form>
        </div>

        <div className="border-t pt-4">
          <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
            Bulk CSV import (admins)
          </p>
          <form onSubmit={uploadAdminCsv} className="space-y-3">
            <p className="text-xs text-slate-500">
              Columns: <code>email,name,department,jobTitle</code> (header row optional).
              One Project Admin per line.
            </p>
            <Textarea
              name="csv"
              rows={5}
              placeholder={
                "email,name,department,jobTitle\n" +
                "sara@org.com,Sara Al-Mansoori,Office of the President,Director of Strategy\n" +
                "ali@org.com,Ali Al-Dosari,Operations,Operations Lead"
              }
              required
            />
            <div className="space-y-1">
              <Label className="text-xs">Default password (applies to all rows)</Label>
              <Input name="defaultPassword" defaultValue="changeme123" required />
            </div>
            <Button type="submit" size="sm" variant="gold" disabled={busy}>
              Import admins CSV
            </Button>
            {adminCsvMsg ? (
              <p className="text-xs text-slate-600">{adminCsvMsg}</p>
            ) : null}
          </form>
        </div>
      </section>

      {/* ===================== PARTICIPANTS ============================== */}
      <section className="space-y-4 border-t pt-6">
        <p className="text-sm font-medium text-slate-800">Participants</p>

        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
            Add a single participant
          </p>
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

        <div className="border-t pt-4">
          <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
            Bulk CSV import (participants)
          </p>
          <form onSubmit={uploadParticipantCsv} className="space-y-3">
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
      </section>
    </Card>
  );
}
