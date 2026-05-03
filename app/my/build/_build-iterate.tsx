"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BuildIterateTab({
  agentId,
  framework,
  existingScaffold,
  status,
}: {
  agentId: string;
  framework: string;
  existingScaffold: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [scaffold, setScaffold] = useState(existingScaffold);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setScaffold("");
    try {
      const res = await fetch(`/api/ai/scaffold-code`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      if (!res.ok) {
        setScaffold(`Error: ${await res.text()}`);
        return;
      }
      const j = await res.json();
      setScaffold(j.code || "");
    } finally {
      setBusy(false);
      startTransition(() => router.refresh());
    }
  }

  async function markStatus(next: string) {
    await fetch(`/api/my/agent/${agentId}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    startTransition(() => router.refresh());
  }

  function runTest() {
    if (!testInput) return;
    // Simulated test harness: deterministic stub for the prototype.
    setTestOutput(
      `[simulated agent run with framework=${framework}]\n\n` +
        `Step 1 — parse input: "${testInput.slice(0, 80)}…"\n` +
        `Step 2 — call tools (per blueprint).\n` +
        `Step 3 — produce response.\n\n` +
        `Result: The agent would synthesize a recommendation here. ` +
        `In M6, hooks lets you call your real prompt and tools.`,
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-3 p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Code scaffolding</h2>
            <div className="flex gap-2">
              <Button onClick={generate} variant="gold" size="sm" disabled={busy}>
                {busy ? "Generating…" : `Generate ${framework} scaffold`}
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Claude generates a runnable starter project for your chosen framework.
          </p>
          <pre className="max-h-[420px] overflow-auto rounded-md bg-slate-900 p-4 text-xs text-slate-100">
            {scaffold || "// Click 'Generate' to scaffold a starter project."}
          </pre>
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => markStatus("building")}
              className={`rounded border px-2 py-1 ${
                status === "building" ? "bg-slate-900 text-white" : ""
              }`}
            >
              Mark building
            </button>
            <button
              onClick={() => markStatus("testing")}
              className={`rounded border px-2 py-1 ${
                status === "testing" ? "bg-slate-900 text-white" : ""
              }`}
            >
              Mark testing
            </button>
            <button
              onClick={() => markStatus("demo_ready")}
              className={`rounded border px-2 py-1 ${
                status === "demo_ready" ? "bg-emerald-600 text-white" : ""
              }`}
            >
              Mark demo-ready
            </button>
          </div>
        </Card>

        <Card className="space-y-3 p-6">
          <h2 className="font-semibold">Prompt library</h2>
          <p className="text-xs text-slate-500">
            Version your system prompt as you iterate.
          </p>
          <Label className="text-xs">System prompt v1</Label>
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={8}
            placeholder="You are an AI agent that..."
          />
          <Button size="sm" variant="outline">
            Save version
          </Button>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold">Test harness</h2>
        <p className="text-xs text-slate-500">
          Drop a realistic input — the prototype simulates the agent's behavior.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Textarea
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            rows={6}
            placeholder="Paste a sample request the agent would receive…"
          />
          <pre className="overflow-auto rounded-md bg-slate-50 p-3 text-xs">
            {testOutput || "// Run the test to see the simulated behavior."}
          </pre>
        </div>
        <Button onClick={runTest} variant="gold" size="sm" className="mt-3">
          Run simulated test
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold">Iteration log</h2>
        <p className="text-xs text-slate-500">
          Snapshot what changed each week. (Manual entries for the prototype.)
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {[5, 6, 7, 8].map((w) => (
            <li key={w} className="rounded-md border bg-slate-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Week {w} milestone
              </p>
              <p className="mt-1 text-slate-700">
                — log what shipped, what broke, what's next.
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
