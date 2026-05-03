"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { ChallengeAnalysis } from "@/lib/ai/types";
import type { SuggestedAgent } from "@/lib/ai/prompts/suggestAgents";

export function DiscoveryTab({
  agentId,
  challengeId,
  challengeTitle,
  analysis,
  name,
  purpose,
  description,
}: {
  agentId: string;
  challengeId: string;
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

  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedAgent[] | null>(null);
  const [suggestErr, setSuggestErr] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);
  const [appliedMsg, setAppliedMsg] = useState<string | null>(null);

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

  async function runSuggest() {
    setSuggesting(true);
    setSuggestErr(null);
    setAppliedMsg(null);
    try {
      const res = await fetch("/api/ai/suggest-agents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setSuggestErr(j.error || "Failed to suggest agents.");
        setSuggesting(false);
        return;
      }
      const j = await res.json();
      setSuggestions(j.suggestions || []);
      setSelectedIdx(null);
    } catch {
      setSuggestErr("Network error — please try again.");
    } finally {
      setSuggesting(false);
    }
  }

  async function applySelection() {
    if (selectedIdx == null || !suggestions) return;
    const s = suggestions[selectedIdx];
    setApplying(true);
    setAppliedMsg(null);
    const res = await fetch(`/api/my/agent/${agentId}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: s.name,
        purpose: s.purpose,
        description: s.description,
        agentType: s.agentType,
        framework: s.framework,
        llm: s.llm,
        inputs: s.inputs,
        tools: s.tools,
        outputs: s.outputs,
        feasibilityScore: s.feasibilityScore,
        impactScore: s.impactScore,
      }),
    });
    setApplying(false);
    if (res.ok) {
      setN(s.name);
      setP(s.purpose);
      setD(s.description);
      setAppliedMsg(`Applied "${s.name}" — your brief and blueprint inputs are filled in.`);
      startTransition(() => router.refresh());
    } else {
      setAppliedMsg("Could not apply selection. Please try again.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card className="space-y-4 p-6">
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

        <Card className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                AI-suggested agents
              </p>
              <h3 className="mt-1 text-base font-semibold">
                Let AI propose 5 candidate agents for this challenge
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Each suggestion includes expected outcomes and real-world
                benchmarks with reference links. Select one to auto-fill your
                concept brief and blueprint inputs.
              </p>
            </div>
            <Button variant="gold" size="sm" onClick={runSuggest} disabled={suggesting}>
              {suggesting
                ? "Thinking…"
                : suggestions
                  ? "Regenerate suggestions"
                  : "✨ Suggest agents with AI"}
            </Button>
          </div>

          {suggestErr ? (
            <p className="rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {suggestErr}
            </p>
          ) : null}

          {suggestions && suggestions.length > 0 ? (
            <div className="space-y-3">
              {suggestions.map((s, idx) => {
                const selected = selectedIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedIdx(idx)}
                    className={`w-full rounded-lg border p-4 text-left transition ${
                      selected
                        ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-xs text-slate-600">{s.oneLiner}</p>
                      </div>
                      <div className="flex gap-1">
                        <Badge variant="outline">{s.agentType}</Badge>
                        <Badge variant="outline">Feas {s.feasibilityScore}</Badge>
                        <Badge variant="outline">Impact {s.impactScore}</Badge>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Expected outcomes
                        </p>
                        <ul className="mt-1 ml-4 list-disc space-y-0.5 text-xs text-slate-700">
                          {s.expectedOutcomes.map((o, i) => (
                            <li key={i}>{o}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Real-world benchmarks
                        </p>
                        <ul className="mt-1 space-y-1 text-xs">
                          {s.benchmarks.map((b, i) => (
                            <li key={i}>
                              <a
                                href={b.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-slate-800 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-600"
                                onClick={(ev) => ev.stopPropagation()}
                              >
                                {b.title}
                              </a>{" "}
                              <span className="text-slate-500">
                                — {b.organization} · {b.metric}
                              </span>
                              <span className="ml-1 text-[10px] uppercase tracking-wider text-slate-400">
                                {b.source}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Stack:
                      </span>
                      <Badge variant="outline">{s.framework}</Badge>
                      <Badge variant="outline">{s.llm}</Badge>
                    </div>
                  </button>
                );
              })}

              <div className="flex flex-wrap items-center gap-3 border-t pt-3">
                <Button
                  variant="gold"
                  size="sm"
                  onClick={applySelection}
                  disabled={selectedIdx == null || applying}
                >
                  {applying ? "Applying…" : "Use selected agent to fill my brief"}
                </Button>
                {appliedMsg ? (
                  <span className="text-xs text-emerald-700">{appliedMsg}</span>
                ) : null}
                {selectedIdx == null ? (
                  <span className="text-xs text-slate-500">
                    Pick a card above to enable.
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          {!suggestions && !suggestErr && !suggesting ? (
            <p className="text-xs text-slate-500">
              Click <span className="font-medium">✨ Suggest agents with AI</span>{" "}
              to get 5 distinct candidates with measurable outcomes and
              benchmark references.
            </p>
          ) : null}
        </Card>
      </div>

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
