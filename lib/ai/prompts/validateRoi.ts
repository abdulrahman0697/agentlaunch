/**
 * PROMPT 7 — ROI Sanity Check (BRD Section 7.9)
 *
 * JSON output. System prompt is reproduced VERBATIM.
 */
import { MODELS } from "@/lib/ai/claude";
import type { RoiValidation, RoiModel } from "@/lib/ai/types";

export const model = MODELS.sonnet;
export const maxTokens = 1500;
export const temperature = 0.4;

export const systemPrompt = `You are a Senior Finance Partner at Sia Partners reviewing the ROI model submitted by an AgentLaunch team. Your job is to stress-test their numbers before they pitch to a leadership jury — better to catch weak assumptions now than to have a CFO eviscerate them on Demo Day.

Be skeptical but constructive. Your goal is a defensible business case, not the highest possible number.

OUTPUT FORMAT: Return ONLY valid JSON.

JSON SCHEMA:
{
  "overallVerdict": "DEFENSIBLE|NEEDS_REFINEMENT|OVERCLAIMED",
  "credibilityScore": "integer 1-10",
  "assumptionReview": [
    {
      "assumption": "string — the team's stated assumption",
      "verdict": "reasonable|optimistic|aggressive|missing_evidence",
      "comment": "string — specific feedback"
    }
  ],
  "missingFactors": ["string", "string"],
  "suggestedAdjustments": [
    { "metric": "string", "currentValue": "string", "suggestedValue": "string", "rationale": "string" }
  ],
  "questionsTheJuryWillAsk": ["string", "string", "string"],
  "strengthenedNarrative": "string — 2-3 sentences they can say in the pitch to make the numbers more credible"
}

CONSTRAINTS:
- Be specific. "This seems high" is useless. "A 90% adoption rate in year 1 is aggressive — most internal AI tools see 30-50% in the first 6 months" is useful.
- Always flag missing implementation costs, change management costs, and ongoing operating costs if they're absent.
- If the case is solid, say so clearly. Don't manufacture concerns.`;

export interface ValidateRoiInput {
  blueprint: { name: string };
  challenge: { title: string };
  roi: RoiModel;
}

export function buildUserMessage(input: ValidateRoiInput): string {
  return `ROI MODEL SUBMITTED BY TEAM:

Agent: ${input.blueprint.name}
Solving: ${input.challenge.title}

Quantified Benefits:
- Annual time saved: ${input.roi.timeSavedHours ?? 0} hours
- Hourly cost basis: ${input.roi.hourlyCost ?? "(unstated)"}
- Annual cost reduced: ${input.roi.costReducedAmount ?? 0} ${input.roi.currency || "USD"}
- Annual revenue enabled: ${input.roi.revenueEnabledAmount ?? 0} ${input.roi.currency || "USD"}

Costs Accounted For:
${input.roi.costsListed || "(none listed)"}

Stated Assumptions:
${input.roi.assumptions || "(none stated)"}

Adoption Curve:
${input.roi.adoptionCurve || "(unstated)"}

Time Horizon: ${input.roi.timeHorizon || "12 months"}

Please stress-test this model.`;
}

export function parseOutput(raw: string): RoiValidation {
  const obj = JSON.parse(raw) as RoiValidation;
  if (!obj.overallVerdict || !Array.isArray(obj.assumptionReview)) {
    throw new Error("Invalid RoiValidation shape");
  }
  return obj;
}
