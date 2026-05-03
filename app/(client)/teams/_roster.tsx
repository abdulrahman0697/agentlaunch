"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Team {
  id: string;
  name: string;
  challenge: { id: string; title: string; status: string } | null;
  members: Array<{
    id: string;
    name: string;
    department: string | null;
    jobTitle: string | null;
    stage: string;
  }>;
}

interface Participant {
  id: string;
  name: string;
  department: string | null;
  teamId: string | null;
}

export function TeamRoster({
  teams,
  participants,
}: {
  teams: Team[];
  participants: Participant[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  async function createTeam() {
    if (!newTeamName.trim()) return;
    await fetch("/api/teams", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newTeamName }),
    });
    setNewTeamName("");
    setCreating(false);
    startTransition(() => router.refresh());
  }

  async function moveTo(participantId: string, teamId: string | null) {
    await fetch(`/api/teams/${teamId || "_"}/members`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ participantId, action: teamId ? "add" : "remove" }),
    }).catch(() => {});
    startTransition(() => router.refresh());
  }

  async function moveParticipant(participantId: string, teamId: string | null) {
    if (teamId) {
      await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ participantId, action: "add" }),
      });
    } else {
      // remove: pick any team to call /remove on, since the API just nulls teamId
      const tid = teams[0]?.id;
      if (!tid) return;
      await fetch(`/api/teams/${tid}/members`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ participantId, action: "remove" }),
      });
    }
    startTransition(() => router.refresh());
  }

  const unassigned = participants.filter((p) => !p.teamId);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {creating ? (
          <div className="flex gap-2">
            <Input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Team Skyway"
              className="w-56"
            />
            <Button size="sm" variant="gold" onClick={createTeam} disabled={pending}>
              Create
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="gold" onClick={() => setCreating(true)}>
            + New team
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {teams.map((t) => (
          <Card key={t.id} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{t.name}</h2>
                {t.challenge ? (
                  <p className="text-xs text-slate-500">
                    Working on:{" "}
                    <a href={`/challenges/${t.challenge.id}`} className="underline">
                      {t.challenge.title}
                    </a>
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">No challenge assigned yet</p>
                )}
              </div>
              <span className="text-xs text-slate-500">{t.members.length} members</span>
            </div>
            <ul className="mt-4 divide-y">
              {t.members.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-slate-500">
                      {m.jobTitle || "—"}
                      {m.department ? ` · ${m.department}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{m.stage}</Badge>
                    <button
                      className="text-xs text-rose-700 hover:underline"
                      onClick={() => moveParticipant(m.id, null)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
              {t.members.length === 0 ? (
                <li className="py-4 text-sm text-slate-500">No members yet.</li>
              ) : null}
            </ul>
          </Card>
        ))}
        {teams.length === 0 ? (
          <Card className="p-10 text-center text-sm text-slate-500 md:col-span-2">
            No teams yet — create one to start assigning participants.
          </Card>
        ) : null}
      </div>

      <Card className="p-5">
        <h2 className="font-semibold">Unassigned participants ({unassigned.length})</h2>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {unassigned.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded border p-2 text-sm">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-slate-500">{p.department || "—"}</p>
              </div>
              <select
                defaultValue=""
                onChange={(e) => moveParticipant(p.id, e.target.value || null)}
                className="h-9 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="" disabled>
                  Assign to team…
                </option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </li>
          ))}
          {unassigned.length === 0 ? (
            <li className="text-sm text-slate-500">All participants are on a team. ✓</li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}
