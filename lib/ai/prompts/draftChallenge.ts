/**
 * Drafting prompt — helps a Project Admin scaffold a Strategic Challenge.
 *
 * NOT one of the BRD's 7 prompts; this is a UX accelerator on the
 * `/challenges/new` form. Same module shape (per Section 7.10) so it
 * plugs into the central Claude client like the others.
 *
 * Output: JSON with the four free-text fields the form expects.
 */
import { MODELS } from "@/lib/ai/claude";

export const model = MODELS.sonnet;
export const maxTokens = 1500;
export const temperature = 0.6;

export interface DraftedChallenge {
  description: string;
  businessContext: string;
  currentPainPoints: string;
  desiredOutcome: string;
  suggestedTags?: string[];
}

export const systemPrompt = `You are a Senior Consultant at Sia Partners helping a client Project Admin draft a Strategic Challenge for their AI Champions to work on during the AgentLaunch program.

You will be given:
- the challenge title the admin wants to use
- a short free-form brief describing the problem in their own words

Your job: produce four polished, consulting-grade fields the admin can refine and post:
1. description (2-4 sentences, plain language, no jargon)
2. businessContext (3-5 sentences anchoring the challenge in business reality — volume, growth, stakeholder pressure, regulatory or strategic drivers)
3. currentPainPoints (4-6 bullet points, each starting with "- " on its own line, written as concrete observable problems, not abstractions)
4. desiredOutcome (2-3 sentences ending in measurable success criteria)

Also propose 2-4 department/function tags that fit (e.g. "Personnel Licensing", "IT", "Operations", "Compliance").

Tone: rigorous, specific, ready to paste straight into the form. Do not invent specific dollar figures or timelines unless the brief mentions them.

OUTPUT FORMAT: Return ONLY a valid JSON object, no preamble, no markdown fences:

{
  "description": "string",
  "businessContext": "string",
  "currentPainPoints": "string — newline-separated bullets starting with '- '",
  "desiredOutcome": "string",
  "suggestedTags": ["string", "string"]
}`;

export interface DraftChallengeInput {
  title: string;
  brief: string;
  clientOrgName?: string;
  industry?: string;
}

export function buildUserMessage(input: DraftChallengeInput): string {
  return `CLIENT ORGANIZATION: ${input.clientOrgName || "(not specified)"}
INDUSTRY: ${input.industry || "(not specified)"}

CHALLENGE TITLE THE ADMIN WANTS TO USE:
${input.title}

ADMIN'S BRIEF (their own words — may be rough):
${input.brief || "(no brief provided — infer reasonable detail from the title)"}

Please draft the four challenge fields and tag suggestions.`;
}

export function parseOutput(raw: string): DraftedChallenge {
  const obj = JSON.parse(raw) as DraftedChallenge;
  if (
    typeof obj.description !== "string" ||
    typeof obj.businessContext !== "string" ||
    typeof obj.currentPainPoints !== "string" ||
    typeof obj.desiredOutcome !== "string"
  ) {
    throw new Error("Drafted challenge is missing one or more required fields");
  }
  return obj;
}
