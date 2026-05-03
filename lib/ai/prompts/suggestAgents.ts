/**
 * Agent suggestion prompt — used by the participant on the Build Workspace
 * "Discovery & Scoping" tab. Reviews the challenge, proposes 5 candidate
 * agents, expected outcomes, and real-world benchmarks (with links).
 *
 * NOT one of the BRD's 7 prompts. Same module shape (per Section 7.10) so
 * it plugs into the central Claude client like the others.
 */
import { MODELS } from "@/lib/ai/claude";

export const model = MODELS.opus;
export const maxTokens = 4500;
export const temperature = 0.6;

export interface BenchmarkRef {
  title: string;
  organization: string;
  metric: string;
  url: string;
  source: string;
}

export interface SuggestedAgent {
  name: string;
  oneLiner: string;
  agentType: "workflow" | "conversational" | "autonomous" | "hybrid";
  purpose: string;
  description: string;
  primaryUserRole: string;
  coreCapabilities: string[];
  expectedOutcomes: string[];
  inputs: string[];
  tools: string[];
  outputs: string[];
  framework: "LangChain" | "LangGraph" | "Claude Agents SDK" | "CrewAI" | "AutoGen" | "Langflow";
  llm: string;
  feasibilityScore: number;
  impactScore: number;
  benchmarks: BenchmarkRef[];
}

export interface AgentSuggestions {
  suggestions: SuggestedAgent[];
}

export const systemPrompt = `You are a Senior AI Strategy Consultant at Sia Partners helping a participant in the AgentLaunch program scope an agentic AI solution for a real client challenge.

You will be given the challenge brief and any prior analysis. Your job: produce exactly 5 distinct candidate agents the participant could build, each with measurable expected outcomes and 2-3 real-world benchmarks (with reference links).

DESIGN RULES
- Suggest exactly 5 agents. Each must be MEANINGFULLY DIFFERENT in approach (e.g. triage workflow vs conversational front-door vs autonomous monitor vs human-in-the-loop reviewer vs analytics agent). Not five flavors of the same idea.
- Be realistic about feasibility within a 10-week build window with a 3-person team and limited integration time.
- Anchor each agent to the actual challenge — no boilerplate.
- Frameworks: pick from LangChain, LangGraph, Claude Agents SDK, CrewAI, AutoGen, Langflow. Match the framework to the agent shape.
- LLM: pick from claude-opus-4-7, claude-sonnet-4-6, claude-haiku-4-5. Justify implicitly via the rationale baked into purpose/description.

EXPECTED OUTCOMES
- 3-5 outcomes per agent.
- Each one must be specific and measurable (cycle-time delta, % auto-handled, FTE freed, error-rate reduction, NPS lift, cost saved).
- Tied to THIS challenge's success criteria, not generic.

BENCHMARKS (CRITICAL — be honest)
- 2-3 real-world references per agent.
- Prefer well-known case studies, vendor-published wins, regulator reports, McKinsey/BCG/Deloitte/Sia thought-leadership, peer-reviewed papers, and reputable news outlets.
- Each must include: title, organization, the headline metric, a source label, and a URL the participant can open.
- DO NOT FABRICATE URLS. If you are not confident the URL is real and reachable, write "https://www.google.com/search?q=" followed by a URL-encoded specific search query that will surface the case study (e.g. "https://www.google.com/search?q=Klarna+AI+assistant+case+study"). This way the link always works even if you don't know the exact source URL by heart.
- If the case is genuinely well-known and the URL is stable (vendor case study, public regulator publication), provide it directly.

OUTPUT FORMAT — return ONLY valid JSON, no preamble, no markdown fences:
{
  "suggestions": [
    {
      "name": "string — short descriptive name",
      "oneLiner": "string — one sentence explaining what it does",
      "agentType": "workflow|conversational|autonomous|hybrid",
      "purpose": "string — one sentence to drop straight into the form's 'Agent purpose' field",
      "description": "string — 3-5 sentences for the form's 'Description / scope notes' field; covers what it does, who uses it, and the boundary of the scope",
      "primaryUserRole": "string — who interacts with it",
      "coreCapabilities": ["string", "string", "string"],
      "expectedOutcomes": ["string — measurable outcome 1", "string — measurable outcome 2"],
      "inputs": ["string — data source / signal"],
      "tools": ["string — concrete tool / API / system"],
      "outputs": ["string — artifact produced"],
      "framework": "LangChain|LangGraph|Claude Agents SDK|CrewAI|AutoGen|Langflow",
      "llm": "claude-opus-4-7|claude-sonnet-4-6|claude-haiku-4-5",
      "feasibilityScore": 1-10 integer,
      "impactScore": 1-10 integer,
      "benchmarks": [
        {
          "title": "string — short title of the case",
          "organization": "string — who did it",
          "metric": "string — headline measurable result",
          "url": "string — direct URL or google-search fallback per rules above",
          "source": "string — e.g. 'Anthropic case study', 'McKinsey insights', 'TechCrunch', 'Gartner', 'Klarna investor letter'"
        }
      ]
    }
  ]
}`;

export interface SuggestAgentsInput {
  clientOrgName: string;
  industry?: string;
  region?: string;
  challenge: {
    title: string;
    description: string;
    businessContext: string;
    currentPainPoints: string;
    desiredOutcome: string;
    departmentTags: string[] | string;
    priority: string;
  };
  priorAnalysisSummary?: string;
}

export function buildUserMessage(input: SuggestAgentsInput): string {
  const tags = Array.isArray(input.challenge.departmentTags)
    ? input.challenge.departmentTags.join(", ")
    : input.challenge.departmentTags;
  return `CLIENT ORGANIZATION CONTEXT:
- Organization: ${input.clientOrgName}
- Industry/Sector: ${input.industry || "(not specified)"}
- Region: ${input.region || "(not specified)"}

STRATEGIC CHALLENGE:

Title: ${input.challenge.title}

Description: ${input.challenge.description}

Business Context: ${input.challenge.businessContext}

Current Pain Points: ${input.challenge.currentPainPoints}

Desired Outcome: ${input.challenge.desiredOutcome}

Department/Function: ${tags}
Priority: ${input.challenge.priority}

${input.priorAnalysisSummary ? `PRIOR ANALYSIS SUMMARY (for context — do not repeat verbatim):\n${input.priorAnalysisSummary}\n\n` : ""}Produce exactly 5 candidate agents per the schema and rules.`;
}

export function parseOutput(raw: string): AgentSuggestions {
  const obj = JSON.parse(raw) as AgentSuggestions;
  if (!Array.isArray(obj.suggestions) || obj.suggestions.length === 0) {
    throw new Error("Suggestions array is missing or empty");
  }
  for (const s of obj.suggestions) {
    if (!s.name || !s.purpose || !s.description) {
      throw new Error("Suggested agent is missing name/purpose/description");
    }
    if (!Array.isArray(s.expectedOutcomes) || !Array.isArray(s.benchmarks)) {
      throw new Error("Suggested agent is missing expectedOutcomes/benchmarks");
    }
  }
  return obj;
}
