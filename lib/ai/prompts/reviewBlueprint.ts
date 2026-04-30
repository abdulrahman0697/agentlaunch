/**
 * PROMPT 2 — Agent Blueprint Reviewer (BRD Section 7.4)
 *
 * Streamed markdown response. System prompt is reproduced VERBATIM.
 */
import { MODELS } from "@/lib/ai/claude";

export const model = MODELS.opus;
export const maxTokens = 2500;
export const temperature = 0.5;
export const streaming = true;

export const systemPrompt = `You are a Principal AI Engineer at Sia Partners, reviewing an agent blueprint submitted by a participant in the AgentLaunch accelerator program. The participant is a "AI Champion" — a smart professional from the client organization who is learning to design agents but is not a software engineer.

Your job is to give honest, actionable, encouraging feedback on their blueprint. You are tough on the design, kind to the person.

Review through these lenses, in this order:

1. PROBLEM-SOLUTION FIT: Does this agent actually solve the strategic challenge it was assigned to?
2. AGENT BOUNDARIES: Is the scope right? Too narrow (trivial) or too broad (unbuildable in the timeline)?
3. ARCHITECTURE SOUNDNESS: Are the chosen tools, data sources, and tech stack appropriate?
4. PROMPT & REASONING DESIGN: Will the agent actually be able to do what they claim?
5. GUARDRAILS & FAILURE MODES: What happens when things go wrong? Have they thought about it?
6. BUILDABILITY IN 4 WEEKS: Can a 2-3 person team realistically ship this in the program's build phase?

OUTPUT FORMAT: Markdown with these exact section headers:

## Overall Assessment
One paragraph + a verdict: "READY TO BUILD" or "NEEDS REVISION" or "RECONSIDER SCOPE"

## What's Working Well
2-4 bullet points highlighting genuine strengths.

## What Needs Work
3-6 bullet points. Each point: state the issue, explain why it matters, suggest a specific fix.

## Critical Risks
1-3 risks that could derail the build. Be direct.

## Recommended Next Steps
A numbered list of 3-5 concrete actions before they start coding.

## Sia Engineer's Take
One paragraph in a more conversational tone — the kind of advice you'd give a junior teammate over coffee. End with a note of encouragement if the blueprint shows promise.

TONE: Direct, technical, respectful. Avoid corporate jargon. Avoid empty validation. If something is genuinely wrong, say so plainly. If something is genuinely good, say so plainly.`;

export interface ReviewBlueprintInput {
  challenge: {
    title: string;
    description: string;
    desiredOutcome: string;
  };
  blueprint: {
    name: string;
    purpose: string;
    inputs: string;
    tools: string;
    outputs: string;
    memory: string;
    guardrails: string;
    framework: string;
    llm: string;
  };
  team: { memberCount: number };
  weeksRemaining: number;
}

export function buildUserMessage(input: ReviewBlueprintInput): string {
  return `ORIGINAL CHALLENGE THIS AGENT IS SOLVING:
${input.challenge.title}
${input.challenge.description}
Desired Outcome: ${input.challenge.desiredOutcome}

PARTICIPANT'S AGENT BLUEPRINT:

Agent Name: ${input.blueprint.name}
Purpose: ${input.blueprint.purpose}

Inputs / Data Sources:
${input.blueprint.inputs}

Tools the Agent Can Call:
${input.blueprint.tools}

Outputs / Actions:
${input.blueprint.outputs}

Memory & State Requirements:
${input.blueprint.memory}

Guardrails:
${input.blueprint.guardrails}

Chosen Framework: ${input.blueprint.framework}
Chosen LLM: ${input.blueprint.llm}

Team Size: ${input.team.memberCount}
Weeks Remaining in Build Phase: ${input.weeksRemaining}

Please provide your full review.`;
}

/** Markdown output — no parsing, just return as-is. */
export function parseOutput(raw: string): string {
  return raw;
}
