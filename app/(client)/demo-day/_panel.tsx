"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Reviewer {
  name: string;
  email: string;
  org?: string;
}

interface AgentRow {
  id: string;
  name: string;
  status: string;
  decision: string | null;
}

interface TeamRow {
  id: string;
  name: string;
  challenge: string | null;
  agents: AgentRow[];
}

export function DemoDayPanel({
  scheduledAt,
  notes,
  reviewers,
  teams,
  pitchOrder,
}: {
  scheduledAt: string | null;
  notes: string;
  reviewers: Reviewer[];
  teams: TeamRow[];
  pitchOrder: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [scheduled, setScheduled] = useState(scheduledAt ? scheduledAt.slice(0, 16) : "");
  const [notesValue, setNotesValue] = useState(notes);
  const [reviewerList, setReviewerList] = useState<Reviewer[]>(reviewers);
  const [revName, setRevName] = useState("");
  const [revEmail, setRevEmail] = useState("");
  const [revOrg, setRevOrg] = useState("");
  const [order, setOrder] = useState<string[]>(pitchOrder.length ? pitchOrder : teams.map((t) => t.id));

  async function save() {
    await fetch("/api/demo-day", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scheduledAt: scheduled || null,
        notes: notesValue,
        reviewers: reviewerList,
        pitchOrder: order,
      }),
    });
    startTransition(() => router.refresh());
  }

  async function setDecision(agentId: string, decision: string) {
    await fetch(`/api/demo-day/decisions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agentId, decision }),
    });
    startTransition(() => router.refresh());
  }

  function move(idx: number, dir: -1 | 1) {
    const next = [...order];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setOrder(next);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="space-y-4 p-6 lg:col-span-2">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs">Scheduled at</Label>
            <Input
              type="datetime-local"
              value={scheduled}
              onChange={(e) => setScheduled(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Internal notes</Label>
            <Input value={notesValue} onChange={(e) => setNotesValue(e.target.value)} />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Reviewers / jury</p>
          <div className="space-y-2">
            {reviewerList.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded border p-2 text-sm">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-slate-500">
                    {r.email} {r.org ? `· ${r.org}` : ""}
                  </p>
                </div>
                <button
                  className="text-xs text-rose-700 hover:underline"
                  onClick={() => setReviewerList((arr) => arr.filter((_, j) => j !== i))}
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="grid gap-2 md:grid-cols-3">
              <Input placeholder="Name" value={revName} onChange={(e) => setRevName(e.target.value)} />
              <Input placeholder="Email" value={revEmail} onChange={(e) => setRevEmail(e.target.value)} />
              <Input placeholder="Org (optional)" value={revOrg} onChange={(e) => setRevOrg(e.target.value)} />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (!revName || !revEmail) return;
                setReviewerList((a) => [...a, { name: revName, email: revEmail, org: revOrg || undefined }]);
                setRevName("");
                setRevEmail("");
                setRevOrg("");
              }}
            >
              + Add reviewer
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Pitch order</p>
          <ol className="space-y-2">
            {order.map((tid, i) => {
              const t = teams.find((x) => x.id === tid);
              if (!t) return null;
              return (
                <li key={tid} className="flex items-center justify-between rounded border p-2 text-sm">
                  <div>
                    <p className="font-medium">
                      {i + 1}. {t.name}
                    </p>
                    <p className="text-xs text-slate-500">{t.challenge || "—"}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => move(i, -1)} className="rounded border px-2 text-xs">↑</button>
                    <button onClick={() => move(i, 1)} className="rounded border px-2 text-xs">↓</button>
                  </div>
                </li>
              );
            })}
            {order.length === 0 ? (
              <li className="text-sm text-slate-500">No teams yet.</li>
            ) : null}
          </ol>
        </div>

        <Button variant="gold" size="sm" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save Demo Day plan"}
        </Button>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="font-semibold">Greenlight decisions</h2>
        <p className="text-xs text-slate-500">
          Capture the jury's call on each agent. This feeds the Scale-Up Roadmap output.
        </p>
        <ul className="space-y-3">
          {teams.flatMap((t) =>
            t.agents.map((a) => (
              <li key={a.id} className="rounded border p-3 text-sm">
                <p className="font-medium">{a.name}</p>
                <p className="text-xs text-slate-500">{t.name} · {a.status.replace("_", " ")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["greenlight", "needs_revision", "no_go"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDecision(a.id, d)}
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        a.decision === d ? "border-slate-900 bg-slate-900 text-white" : "hover:bg-slate-50"
                      }`}
                    >
                      {d.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </li>
            )),
          )}
          {teams.length === 0 ? (
            <li className="text-sm text-slate-500">No teams to decide on yet.</li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}
