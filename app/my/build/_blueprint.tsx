"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ChallengeAnalysis } from "@/lib/ai/types";

const FRAMEWORKS = [
  "LangChain",
  "LangGraph",
  "Claude Agents SDK",
  "CrewAI",
  "AutoGen",
  "Langflow",
];

const COMMON_TOOLS = [
  "Web search",
  "Database query",
  "Email send",
  "Calendar",
  "Code execution",
  "Document parsing",
  "Custom API call",
];

export function BlueprintTab({
  agentId,
  framework,
  llm,
  purpose,
  inputs,
  tools,
  outputs,
  memory,
  guardrails,
  status,
  existingReview,
  analysis,
}: {
  agentId: string;
  framework: string;
  llm: string;
  purpose: string;
  inputs: string[];
  tools: string[];
  outputs: string[];
  memory: string;
  guardrails: string;
  status: string;
  existingReview: string;
  analysis: ChallengeAnalysis | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [fw, setFw] = useState(framework);
  const [model, setModel] = useState(llm);
  const [purp, setPurp] = useState(purpose);
  const [inp, setInp] = useState(inputs.join("\n"));
  const [out, setOut] = useState(outputs.join("\n"));
  const [mem, setMem] = useState(memory);
  const [guard, setGuard] = useState(guardrails);
  const [selectedTools, setSelectedTools] = useState<string[]>(tools);
  const [customTool, setCustomTool] = useState("");
  const [review, setReview] = useState(existingReview);
  const [reviewing, setReviewing] = useState(false);

  function toggleTool(t: string) {
    setSelectedTools((arr) => (arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]));
  }

  async function save() {
    await fetch(`/api/my/agent/${agentId}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        framework: fw,
        llm: model,
        purpose: purp,
        inputs: inp.split("\n").map((s) => s.trim()).filter(Boolean),
        outputs: out.split("\n").map((s) => s.trim()).filter(Boolean),
        memory: mem,
        guardrails: guard,
        tools: selectedTools,
        status: status === "draft" ? "blueprint" : status,
      }),
    });
    startTransition(() => router.refresh());
  }

  async function reviewBlueprint() {
    setReviewing(true);
    setBusy(true);
    setReview("");
    try {
      const res = await fetch(`/api/ai/review-blueprint`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      if (!res.ok) {
        setReview(`Error: ${await res.text()}`);
        return;
      }
      // Streamed plain text — read and append progressively.
      const reader = res.body?.getReader();
      if (!reader) {
        const txt = await res.text();
        setReview(txt);
        return;
      }
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setReview(acc);
      }
    } finally {
      setBusy(false);
      setReviewing(false);
      startTransition(() => router.refresh());
    }
  }

  // Recommend framework based on suggestedAgents in analysis
  const recommendedFramework = analysis?.suggestedAgents[0]?.suggestedTechStack.framework;
  const recommendedRationale = analysis?.suggestedAgents[0]?.suggestedTechStack.rationale;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="space-y-4 p-6 lg:col-span-2">
        <h2 className="font-semibold">Agent blueprint</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs">Framework</Label>
            <select
              value={fw}
              onChange={(e) => setFw(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {FRAMEWORKS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">LLM</Label>
            <Input value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Purpose</Label>
          <Input value={purp} onChange={(e) => setPurp(e.target.value)} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs">Inputs / data sources (one per line)</Label>
            <Textarea value={inp} onChange={(e) => setInp(e.target.value)} rows={5} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Outputs / actions (one per line)</Label>
            <Textarea value={out} onChange={(e) => setOut(e.target.value)} rows={5} />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Tools the agent can call</Label>
          <div className="flex flex-wrap gap-2">
            {COMMON_TOOLS.map((t) => (
              <label
                key={t}
                className={`flex cursor-pointer items-center gap-2 rounded border px-2 py-1 text-xs ${
                  selectedTools.includes(t) ? "border-slate-900 bg-slate-900 text-white" : ""
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={selectedTools.includes(t)}
                  onChange={() => toggleTool(t)}
                />
                {t}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={customTool}
              onChange={(e) => setCustomTool(e.target.value)}
              placeholder="Add custom tool…"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                if (customTool.trim()) {
                  setSelectedTools((a) => [...a, customTool.trim()]);
                  setCustomTool("");
                }
              }}
            >
              Add
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs">Memory & state</Label>
            <Textarea value={mem} onChange={(e) => setMem(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Guardrails</Label>
            <Textarea value={guard} onChange={(e) => setGuard(e.target.value)} rows={3} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={save} variant="gold" size="sm" disabled={pending}>
            Save blueprint
          </Button>
          <Button onClick={reviewBlueprint} variant="outline" size="sm" disabled={busy}>
            {reviewing ? "Reviewing…" : "Review my blueprint"}
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        {recommendedFramework ? (
          <Card className="p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Recommended framework
            </p>
            <p className="mt-1 text-base font-semibold">{recommendedFramework}</p>
            {recommendedRationale ? (
              <p className="mt-1 text-xs text-slate-600">{recommendedRationale}</p>
            ) : null}
          </Card>
        ) : null}
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            AI review
          </p>
          {review ? (
            <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-800">{review}</pre>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              Click "Review my blueprint" — Claude (Principal AI Engineer
              persona) will critique scope, architecture, prompts, guardrails
              and buildability.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
