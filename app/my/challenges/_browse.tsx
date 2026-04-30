"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Row {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  tags: string[];
  teamName: string | null;
  teamId: string | null;
  hasAnalysis: boolean;
  agentCount: number;
  avgFeas: number | null;
  avgImpact: number | null;
}

export function ChallengeBrowse({
  rows,
  myTeamId,
}: {
  rows: Row[];
  myTeamId: string | null;
}) {
  const [q, setQ] = useState("");
  const [priority, setPriority] = useState<"all" | "high" | "medium" | "low">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "claimed">("all");
  const [department, setDepartment] = useState("all");

  const allDepts = Array.from(new Set(rows.flatMap((r) => r.tags))).sort();

  const filtered = rows.filter((r) => {
    if (q && !(`${r.title} ${r.description}`.toLowerCase().includes(q.toLowerCase()))) return false;
    if (priority !== "all" && r.priority !== priority) return false;
    if (statusFilter === "open" && r.status !== "open") return false;
    if (statusFilter === "claimed" && r.status === "open") return false;
    if (department !== "all" && !r.tags.includes(department)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-end gap-4 p-4">
        <div className="flex-1 min-w-[220px] space-y-1">
          <p className="text-xs uppercase tracking-wider text-slate-500">Search</p>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Drone, knowledge, complaint…" />
        </div>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-slate-500">Priority</p>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as typeof priority)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-slate-500">Status</p>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All</option>
            <option value="open">Open (claim-able)</option>
            <option value="claimed">Claimed</option>
          </select>
        </div>
        {allDepts.length > 0 ? (
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-slate-500">Department</p>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All</option>
              {allDepts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        ) : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((r) => (
          <Card key={r.id} className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/my/challenges/${r.id}`} className="flex-1">
                <h2 className="text-lg font-semibold hover:underline">{r.title}</h2>
              </Link>
              <Badge variant={r.priority}>{r.priority}</Badge>
            </div>
            <p className="line-clamp-3 text-sm text-slate-600">{r.description}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant={r.status}>{r.status.replace("_", " ")}</Badge>
              {r.hasAnalysis ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                  {r.agentCount} suggested agents
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                  Awaiting AI analysis
                </span>
              )}
              {r.teamName ? (
                <span className="text-slate-500">
                  · {r.teamName}{r.teamId === myTeamId ? " (yours)" : ""}
                </span>
              ) : null}
            </div>
            {r.avgFeas != null && r.avgImpact != null ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded bg-slate-50 p-2">
                  <p className="text-slate-500">Avg feasibility</p>
                  <p className="text-base font-semibold">{r.avgFeas}/10</p>
                </div>
                <div className="rounded bg-slate-50 p-2">
                  <p className="text-slate-500">Avg impact</p>
                  <p className="text-base font-semibold">{r.avgImpact}/10</p>
                </div>
              </div>
            ) : null}
          </Card>
        ))}
        {filtered.length === 0 ? (
          <Card className="p-10 text-center text-sm text-slate-500 md:col-span-2">
            No challenges match your filters.
          </Card>
        ) : null}
      </div>
    </div>
  );
}
