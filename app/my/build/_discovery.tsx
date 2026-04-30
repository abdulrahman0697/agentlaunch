"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ChallengeAnalysis } from "@/lib/ai/types";

export function DiscoveryTab({
  agentId,
  challengeTitle,
  analysis,
  name,
  purpose,
  description,
}: {
  agentId: string;
  challengeTitle: string;
  analysis: ChallengeAnalysis | null;
  name: string;
  purpose: string;
  description: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [n, setN] = useState(name);
  const [p, setP] = useState(purpose);
  const [d, setD] = useState(description);
  const [saved, setSaved] = useState<string | null>(null);

  async function save() {
    setSaved(null);
    await fetch(`/api/my/agent/${agentId}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: n, purpose: p, description: d }),
    });
    setSaved("Saved.");
    startTransition(() => router.refresh());
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="space-y-4 p-6 lg:col-span-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Auto-generated problem brief
          </p>
          <h2 className="mt-1 text-lg font-semibold">{challengeTitle}</h2>
          {analysis ? (
            <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
              {analysis.reframedProblem.statement}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              The challenge analysis isn't ready yet — your project admin will
              run it shortly.
            </p>
          )}
          {analysis ? (
            <>
              <p className="mt-4 text-sm font-semibold text-slate-700">
                Success criteria
              </p>
              <ul className="mt-1 ml-4 list-disc text-sm text-slate-700">
                {analysis.reframedProblem.successCriteria.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
        <div className="space-y-3 border-t pt-4">
          <p className="text-sm font-semibold">One-page concept brief</p>
          <div className="space-y-2">
            <Label className="text-xs">Agent name</Label>
            <Input value={n} onChange={(e) => setN(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Agent purpose (one sentence)</Label>
            <Input value={p} onChange={(e) => setP(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Description / scope notes</Label>
            <Textarea value={d} onChange={(e) => setD(e.target.value)} rows={5} />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="gold" size="sm" onClick={save} disabled={pending}>
              {pending ? "Saving…" : "Save brief"}
            </Button>
            {saved ? <span className="text-xs text-emerald-700">{saved}</span> : null}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="p-6">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            From the AI analysis
          </p>
          {analysis ? (
            <ul className="mt-3 space-y-2 text-sm">
              {analysis.suggestedAgents.map((a) => (
                <li key={a.name} className="rounded border bg-slate-50 p-2">
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs text-slate-500">{a.oneLiner}</p>
                  <p className="mt-1 text-xs">
                    Feas {a.feasibilityScore} · Impact {a.impactScore}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No analysis yet.</p>
          )}
        </Card>
        <Card className="p-6">
          <p className="text-sm font-semibold">Coach hint</p>
          <p className="mt-2 text-xs text-slate-500">
            Use the AI Coach (bottom-right) to refine your scope. Ask it
            "what should I cut from my brief?"
          </p>
        </Card>
      </div>
    </div>
  );
}
