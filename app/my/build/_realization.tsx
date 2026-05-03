"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RoiModel, PitchDeck, RoiValidation } from "@/lib/ai/types";

const SUGGESTED_KPIS = [
  "Cycle time (days)",
  "First-pass auto-approval rate",
  "Inspector hours saved per week",
  "Customer NPS / CSAT",
  "Compliance exception rate",
  "Annualized cost reduction",
  "Adoption rate at 90 days",
];

export function RealizationTab({
  agentId,
  roi,
  kpis,
  risks,
  roadmap,
  existingValidation,
  existingPitch,
}: {
  agentId: string;
  roi: RoiModel | null;
  kpis: string[];
  risks: string[];
  roadmap: { months3: string[]; months6: string[]; months12: string[] };
  existingValidation: string;
  existingPitch: PitchDeck | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  const [timeSaved, setTimeSaved] = useState(roi?.timeSavedHours ?? 0);
  const [hourlyCost, setHourlyCost] = useState(roi?.hourlyCost ?? 75);
  const [costReduced, setCostReduced] = useState(roi?.costReducedAmount ?? 0);
  const [revEnabled, setRevEnabled] = useState(roi?.revenueEnabledAmount ?? 0);
  const [currency, setCurrency] = useState(roi?.currency ?? "USD");
  const [assumptions, setAssumptions] = useState(roi?.assumptions ?? "");
  const [adoption, setAdoption] = useState(roi?.adoptionCurve ?? "");
  const [horizon, setHorizon] = useState(roi?.timeHorizon ?? "12 months");

  const [selectedKpis, setSelectedKpis] = useState<string[]>(kpis);
  const [customKpi, setCustomKpi] = useState("");
  const [riskList, setRiskList] = useState<string[]>(risks);
  const [riskInput, setRiskInput] = useState("");
  const [m3, setM3] = useState((roadmap.months3 || []).join("\n"));
  const [m6, setM6] = useState((roadmap.months6 || []).join("\n"));
  const [m12, setM12] = useState((roadmap.months12 || []).join("\n"));

  const [validation, setValidation] = useState<RoiValidation | null>(
    existingValidation ? safeParse(existingValidation) : null,
  );
  const [pitch, setPitch] = useState<PitchDeck | null>(existingPitch);

  const computedCost = Math.round(timeSaved * hourlyCost);

  function toggleKpi(k: string) {
    setSelectedKpis((arr) =>
      arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k],
    );
  }

  async function save() {
    await fetch(`/api/my/agent/${agentId}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        roiModel: {
          timeSavedHours: timeSaved,
          hourlyCost,
          costReducedAmount: costReduced || computedCost,
          revenueEnabledAmount: revEnabled,
          currency,
          assumptions,
          adoptionCurve: adoption,
          timeHorizon: horizon,
          costsListed: "Implementation, integration, ongoing ops",
        },
        kpis: selectedKpis,
        risks: riskList,
        roadmap: {
          months3: m3.split("\n").map((s) => s.trim()).filter(Boolean),
          months6: m6.split("\n").map((s) => s.trim()).filter(Boolean),
          months12: m12.split("\n").map((s) => s.trim()).filter(Boolean),
        },
      }),
    });
    startTransition(() => router.refresh());
  }

  async function validateRoi() {
    setBusy(true);
    try {
      const res = await fetch(`/api/ai/roi-validate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      const j = await res.json();
      if (res.ok) setValidation(j.validation);
      else alert(j.error || "ROI validation failed");
    } finally {
      setBusy(false);
      startTransition(() => router.refresh());
    }
  }

  async function generatePitch() {
    setBusy(true);
    try {
      const res = await fetch(`/api/ai/generate-pitch`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      const j = await res.json();
      if (res.ok) setPitch(j.deck);
      else alert(j.error || "Pitch generation failed");
    } finally {
      setBusy(false);
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-4 p-6 lg:col-span-2">
          <h2 className="font-semibold">ROI calculator</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Annual time saved (hours)</Label>
              <Input
                type="number"
                value={timeSaved}
                onChange={(e) => setTimeSaved(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hourly fully-loaded cost</Label>
              <Input
                type="number"
                value={hourlyCost}
                onChange={(e) => setHourlyCost(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cost reduced (annual, {currency})</Label>
              <Input
                type="number"
                value={costReduced || computedCost}
                onChange={(e) => setCostReduced(Number(e.target.value))}
              />
              <p className="text-[10px] text-slate-500">
                Auto-calculated from time × hourly cost: {computedCost.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Revenue enabled (annual, {currency})</Label>
              <Input
                type="number"
                value={revEnabled}
                onChange={(e) => setRevEnabled(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Currency</Label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Time horizon</Label>
              <Input value={horizon} onChange={(e) => setHorizon(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Assumptions</Label>
            <Textarea value={assumptions} onChange={(e) => setAssumptions(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Adoption curve</Label>
            <Input value={adoption} onChange={(e) => setAdoption(e.target.value)} placeholder="e.g. 30% Q1, 60% Q2, 90% Q4" />
          </div>
          <div className="flex gap-2">
            <Button variant="gold" size="sm" onClick={save} disabled={pending}>
              Save business case
            </Button>
            <Button variant="outline" size="sm" onClick={validateRoi} disabled={busy}>
              {busy ? "Validating…" : "Sanity-check ROI (Claude)"}
            </Button>
          </div>
        </Card>

        <Card className="space-y-3 p-6">
          <h2 className="font-semibold">KPIs (3-5)</h2>
          <div className="space-y-1">
            {SUGGESTED_KPIS.map((k) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedKpis.includes(k)}
                  onChange={() => toggleKpi(k)}
                />
                {k}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={customKpi}
              onChange={(e) => setCustomKpi(e.target.value)}
              placeholder="Add custom KPI…"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (customKpi.trim()) {
                  setSelectedKpis((a) => [...a, customKpi.trim()]);
                  setCustomKpi("");
                }
              }}
            >
              Add
            </Button>
          </div>
        </Card>
      </div>

      {validation ? (
        <Card className="p-6">
          <h3 className="font-semibold">ROI sanity check</h3>
          <p className="mt-1 text-sm">
            Verdict:{" "}
            <span className="font-semibold">{validation.overallVerdict}</span>{" "}
            · credibility {validation.credibilityScore}/10
          </p>
          {validation.assumptionReview?.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {validation.assumptionReview.map((a, i) => (
                <li key={i} className="rounded border bg-slate-50 p-3">
                  <p className="font-medium">{a.assumption}</p>
                  <p className="text-xs text-slate-500">{a.verdict}</p>
                  <p className="mt-1 text-sm text-slate-700">{a.comment}</p>
                </li>
              ))}
            </ul>
          ) : null}
          {validation.questionsTheJuryWillAsk?.length ? (
            <>
              <p className="mt-3 text-sm font-semibold">Questions the jury will ask</p>
              <ul className="ml-4 list-disc text-sm">
                {validation.questionsTheJuryWillAsk.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold">Risks & dependencies</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {riskList.map((r, i) => (
              <li key={i} className="flex items-center justify-between rounded border p-2">
                <span>{r}</span>
                <button
                  className="text-xs text-rose-700"
                  onClick={() => setRiskList((arr) => arr.filter((_, j) => j !== i))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <Input
              value={riskInput}
              onChange={(e) => setRiskInput(e.target.value)}
              placeholder="e.g. Source system uptime"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (riskInput.trim()) {
                  setRiskList((a) => [...a, riskInput.trim()]);
                  setRiskInput("");
                }
              }}
            >
              Add
            </Button>
          </div>
        </Card>

        <Card className="space-y-3 p-6">
          <h2 className="font-semibold">Scale-up roadmap (3-6-12)</h2>
          <div className="space-y-1">
            <Label className="text-xs">3 months</Label>
            <Textarea value={m3} onChange={(e) => setM3(e.target.value)} rows={3} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">6 months</Label>
            <Textarea value={m6} onChange={(e) => setM6(e.target.value)} rows={3} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">12 months</Label>
            <Textarea value={m12} onChange={(e) => setM12(e.target.value)} rows={3} />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Pitch deck (5 slides for Demo Day)</h2>
          <Button onClick={generatePitch} variant="gold" size="sm" disabled={busy}>
            {busy ? "Generating…" : pitch ? "Regenerate pitch deck" : "Generate pitch deck"}
          </Button>
        </div>
        {pitch ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-md border bg-slate-50 p-4">
              <p className="text-xs uppercase text-slate-500">Title</p>
              <p className="text-xl font-semibold">{pitch.deckTitle}</p>
              <p className="text-sm text-slate-600">{pitch.subtitle}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {pitch.slides.map((s) => (
                <div key={s.slideNumber} className="rounded-md border p-4">
                  <p className="text-xs text-slate-500">Slide {s.slideNumber}</p>
                  <p className="font-semibold">{s.title}</p>
                  <p className="mt-1 text-sm font-medium">{s.headline}</p>
                  <ul className="mt-2 ml-4 list-disc text-xs text-slate-700">
                    {s.bulletPoints.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[10px] uppercase text-slate-500">Visual</p>
                  <p className="text-xs text-slate-600">{s.visualSuggestion}</p>
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer text-slate-500">Speaker notes</summary>
                    <p className="mt-1 text-slate-700">{s.speakerNotes}</p>
                  </details>
                </div>
              ))}
            </div>
            {pitch.anticipatedQuestions?.length ? (
              <div className="rounded-md border p-4">
                <p className="text-sm font-semibold">Anticipated jury questions</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {pitch.anticipatedQuestions.map((q, i) => (
                    <li key={i}>
                      <p className="font-medium">{q.question}</p>
                      <p className="text-xs text-slate-600">{q.suggestedAnswer}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            Save your business case first, then generate — Claude builds the
            5-slide outline from your challenge + blueprint + ROI + KPIs.
          </p>
        )}
      </Card>
    </div>
  );
}

function safeParse(raw: string): RoiValidation | null {
  try {
    return JSON.parse(raw) as RoiValidation;
  } catch {
    return null;
  }
}
