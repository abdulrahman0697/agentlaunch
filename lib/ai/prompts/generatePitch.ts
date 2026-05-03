/**
 * PROMPT 4 — Pitch Deck Generator (BRD Section 7.6)
 *
 * JSON output. System prompt is reproduced VERBATIM.
 */
import { MODELS } from "@/lib/ai/claude";
import type { PitchDeck, RoiModel } from "@/lib/ai/types";

export const model = MODELS.opus;
export const maxTokens = 3000;
export const temperature = 0.6;

export const systemPrompt = `You are a Senior Partner at Sia Partners writing a leadership pitch deck for an AI agent that a client team has built during the AgentLaunch program. The audience is a senior executive jury — C-suite, board members, business unit heads. They have 10 minutes for the pitch and 5 minutes for Q&A. They will make a greenlight/no-go decision on the spot.

Your job is to produce a tight, confident 5-slide deck outline that helps the team win the greenlight.

Pitch principles:
- Lead with business outcome, not technology
- Quantify everything that can be quantified
- Address the obvious objections before they're asked
- Make the ask crystal clear
- Avoid AI jargon unless absolutely necessary

OUTPUT FORMAT: Return ONLY a valid JSON object. No preamble, no markdown.

JSON SCHEMA:
{
  "deckTitle": "string — punchy 6-10 word title",
  "subtitle": "string — one-line tagline",
  "slides": [
    {
      "slideNumber": 1,
      "title": "The Problem",
      "headline": "string — the bold one-line takeaway for this slide",
      "bulletPoints": ["string", "string", "string"],
      "visualSuggestion": "string — what visual or chart to put on this slide",
      "speakerNotes": "string — 2-3 sentences the presenter will say"
    },
    {
      "slideNumber": 2,
      "title": "Our Solution",
      "headline": "string",
      "bulletPoints": ["string", "string", "string"],
      "visualSuggestion": "string — typically an architecture diagram or agent flow",
      "speakerNotes": "string"
    },
    {
      "slideNumber": 3,
      "title": "Live Demo",
      "headline": "string",
      "bulletPoints": ["string — what we will show", "string — what to look for", "string — expected reaction"],
      "visualSuggestion": "string — screenshot or live agent",
      "speakerNotes": "string — choreography of the demo"
    },
    {
      "slideNumber": 4,
      "title": "Business Impact",
      "headline": "string — lead with the headline ROI number",
      "bulletPoints": ["string — quantified time savings", "string — quantified cost or revenue impact", "string — strategic value beyond the numbers"],
      "visualSuggestion": "string — typically a before/after or ROI chart",
      "speakerNotes": "string"
    },
    {
      "slideNumber": 5,
      "title": "What We're Asking For",
      "headline": "string — the specific ask",
      "bulletPoints": ["string — resources needed", "string — timeline to scale", "string — first three milestones"],
      "visualSuggestion": "string — typically a roadmap timeline",
      "speakerNotes": "string"
    }
  ],
  "anticipatedQuestions": [
    { "question": "string — likely jury question", "suggestedAnswer": "string — 2-3 sentence answer" }
  ],
  "presenterTips": ["string", "string", "string"]
}

CONSTRAINTS:
- 5 slides exactly. Do not add or remove slides.
- Each headline must be a complete sentence with a verb. No phrases.
- Every bullet point must be specific to this team's actual work — do not write generic content.
- Anticipate 3-5 likely questions, focusing on the toughest ones (cost, risk, timeline, why-not-buy-vs-build, who owns it post-launch).
- Speaker notes are conversational, not formal.`;

export interface GeneratePitchInput {
  project: { clientOrgName: string };
  team: { name: string };
  challenge: { title: string; description: string };
  blueprint: { name: string; purpose: string; framework: string };
  roi: RoiModel;
  kpis: string[] | string;
  risks: string[] | string;
  roadmap: string;
}

export function buildUserMessage(input: GeneratePitchInput): string {
  const kpis = Array.isArray(input.kpis) ? input.kpis.join("\n- ") : input.kpis;
  const risks = Array.isArray(input.risks) ? input.risks.join("\n- ") : input.risks;
  return `TEAM SUBMISSION FOR DEMO DAY PITCH:

Client Organization: ${input.project.clientOrgName}
Team: ${input.team.name}

ORIGINAL CHALLENGE:
${input.challenge.title}
${input.challenge.description}

AGENT BUILT:
Name: ${input.blueprint.name}
What it does: ${input.blueprint.purpose}
Framework: ${input.blueprint.framework}

ROI MODEL:
- Annual time saved: ${input.roi.timeSavedHours ?? 0} hours
- Annual cost reduced: ${input.roi.costReducedAmount ?? 0} ${input.roi.currency || "USD"}
- Annual revenue enabled: ${input.roi.revenueEnabledAmount ?? 0} ${input.roi.currency || "USD"}
- Assumptions: ${input.roi.assumptions || "(not stated)"}

KPIs DEFINED:
- ${kpis}

KEY RISKS IDENTIFIED:
- ${risks}

SCALE-UP ROADMAP (3-6-12 months):
${input.roadmap}

Generate the pitch deck.`;
}

export function parseOutput(raw: string): PitchDeck {
  const obj = JSON.parse(raw) as PitchDeck;
  if (!obj.slides || obj.slides.length !== 5) {
    throw new Error("Pitch deck must have exactly 5 slides");
  }
  return obj;
}
