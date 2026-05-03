"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AssignTeamPanel({
  challengeId,
  currentTeamId,
  teams,
}: {
  challengeId: string;
  currentTeamId: string | null;
  teams: Array<{ id: string; name: string; members: number; hasChallenge: boolean }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState(currentTeamId || "");
  const [creating, setCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  async function assign() {
    setBusy(true);
    await fetch(`/api/challenges/${challengeId}/assign`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ teamId: picked || null }),
    });
    setBusy(false);
    router.refresh();
  }

  async function createTeam() {
    if (!newTeamName.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/teams`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newTeamName }),
    });
    const j = await res.json();
    setBusy(false);
    if (res.ok && j.id) {
      setPicked(j.id);
      setCreating(false);
      setNewTeamName("");
      router.refresh();
    }
  }

  return (
    <div className="mt-3 space-y-3 text-sm">
      <Label className="text-xs">Team</Label>
      <select
        value={picked}
        onChange={(e) => setPicked(e.target.value)}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">— Unassigned —</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id} disabled={t.hasChallenge && t.id !== currentTeamId}>
            {t.name} ({t.members}){t.hasChallenge && t.id !== currentTeamId ? " · already on a challenge" : ""}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button size="sm" onClick={assign} disabled={busy || picked === (currentTeamId || "")}>
          {busy ? "Saving…" : "Assign"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setCreating((v) => !v)}>
          {creating ? "Cancel" : "+ New team"}
        </Button>
      </div>
      {creating ? (
        <div className="space-y-2 rounded-md border bg-slate-50 p-3">
          <Label className="text-xs">New team name</Label>
          <Input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="Team Skyway" />
          <Button size="sm" variant="gold" onClick={createTeam} disabled={busy || !newTeamName}>
            Create team
          </Button>
        </div>
      ) : null}
    </div>
  );
}
