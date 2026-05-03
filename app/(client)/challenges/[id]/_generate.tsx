"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function GenerateAnalysisButton({
  challengeId,
  hasAnalysis,
}: {
  challengeId: string;
  hasAnalysis: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    setProgress("Calling Claude — analyzing the challenge…");
    const t = setTimeout(
      () => setProgress("Drafting suggested agents and benchmarks…"),
      4000,
    );
    const t2 = setTimeout(
      () => setProgress("Scoring feasibility × impact and selecting toolbox assets…"),
      9000,
    );
    try {
      const res = await fetch(`/api/ai/analyze-challenge`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ challengeId, regenerate: hasAnalysis }),
      });
      clearTimeout(t);
      clearTimeout(t2);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Analysis failed (${res.status})`);
      }
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={go} variant="gold" size="sm" disabled={busy}>
        {busy
          ? "Working…"
          : hasAnalysis
            ? "Regenerate analysis"
            : "Generate AI Analysis"}
      </Button>
      {progress ? <p className="text-xs text-slate-500">{progress}</p> : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
