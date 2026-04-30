/**
 * Pre-generated AI analyses + blueprints for the seed (BRD Section 9.8).
 *
 * Each seed challenge that should arrive on first load with "AI analysis
 * complete" gets an entry here. The Section 9 demo flow specifies which
 * stay open for live demo (QCAA Challenge 5, MWAN Challenge 3) — those
 * are NOT included here.
 */
import type { ChallengeAnalysis, RoiModel, PitchDeck } from "@/lib/ai/types";
import dronePermit from "./drone-permit.json";

export interface SeedAnalysisRecord {
  challengeKey: string;
  analysis: ChallengeAnalysis;
}

// Used directly for QCAA Challenge 1 (the most polished, lead demo).
export const dronePermitAnalysis = dronePermit as ChallengeAnalysis;

// Smaller analyses for the remaining seeded challenges. Same JSON shape
// as PROMPT 1 output. Keeping them inline (not separate files) since
// they're shorter than the lead demo.
export function makeAnalysis(
  title: string,
  agents: Array<{
    name: string;
    oneLiner: string;
    framework: ChallengeAnalysis["suggestedAgents"][number]["suggestedTechStack"]["framework"];
    llm: string;
    feas: number;
    impact: number;
    capabilities: string[];
    dataSources: string[];
    risks: string[];
  }>,
  benchmark: { org: string; outcome: string; relevance: string },
  toolbox: Array<{ pillar: ChallengeAnalysis["toolboxRecommendations"][number]["pillar"]; asset: string; why: string }>,
): ChallengeAnalysis {
  return {
    reframedProblem: {
      statement: `${title} is a high-volume, repeatable workflow where humans currently do work that pattern-matches against rules and policies. An orchestration agent that runs the deterministic checks and escalates only the genuinely ambiguous cases can collapse cycle time and improve consistency without removing the human from the loop.`,
      rootCauseHypotheses: [
        "Decision logic lives in tribal knowledge rather than a codified rule set.",
        "Required inputs sit across disconnected systems with no integration layer.",
        "Volume has grown faster than capacity; no automation between intake and decision.",
      ],
      stakeholderMap: [
        { stakeholder: "Front-line officers", interest: "Faster turnaround without losing rigor", influence: "high" },
        { stakeholder: "Operations leadership", interest: "Throughput and consistency", influence: "high" },
        { stakeholder: "Compliance / Legal", interest: "Auditability and regulatory alignment", influence: "high" },
        { stakeholder: "External stakeholders / applicants", interest: "Predictability and status visibility", influence: "medium" },
      ],
      successCriteria: [
        "Average cycle time reduced by ≥60% on the routine slice.",
        "≥80% of routine cases auto-handled with explicit confidence threshold.",
        "Zero increase in regulatory exception rate vs baseline.",
      ],
    },
    benchmarking: {
      similarCases: [
        {
          organization: benchmark.org,
          industry: "Public sector / regulated",
          approach: "Built an orchestration agent that pulled application data, validated against a rule engine, and routed exceptions to humans.",
          outcome: benchmark.outcome,
          relevanceToThisChallenge: benchmark.relevance,
        },
        {
          organization: "Reference Org B (financial services)",
          industry: "Banking",
          approach: "Conversational agent for incomplete submissions with retrieval over policy library.",
          outcome: "Re-submission turnaround dropped from days to minutes; auto-approval rate +35%.",
          relevanceToThisChallenge: "Demonstrates value of a thin conversational layer in front of orchestration.",
        },
        {
          organization: "Reference Org C (utility)",
          industry: "Utilities",
          approach: "Risk-scoring agent that prioritized inspector workload using historical outcomes.",
          outcome: "30% increase in caught high-risk cases without additional headcount.",
          relevanceToThisChallenge: "Shows the triage-agent shape for the high-impact slice.",
        },
      ],
      industryBestPractices: [
        "Codify the rule engine BEFORE asking an LLM to reason over it.",
        "Always preserve a clear human-in-the-loop bypass with audit trail.",
        "Measure cycle time from week 1 against the pre-launch baseline.",
      ],
      commonPitfalls: [
        "Treating the LLM as the system of record instead of as orchestrator.",
        "No graceful fallback when external data sources are slow or unavailable.",
        "Underestimating change-management for officers whose roles will shift.",
      ],
    },
    suggestedAgents: agents.map((a) => ({
      name: a.name,
      oneLiner: a.oneLiner,
      agentType: "workflow",
      primaryUserRole: "Front-line officer",
      coreCapabilities: a.capabilities,
      requiredDataSources: a.dataSources,
      suggestedTechStack: { framework: a.framework, llm: a.llm, rationale: `${a.framework} fits the workflow shape and ${a.llm} balances quality and latency for this scope.` },
      feasibilityScore: a.feas,
      feasibilityRationale: a.feas >= 7 ? "Data availability and integration surface are manageable inside the 10-week window." : "Requires upstream data cleanup and policy codification before serious build can start.",
      impactScore: a.impact,
      impactRationale: a.impact >= 7 ? "Large fraction of routine workload absorbed; meaningful FTE re-allocation projected." : "Targeted improvement on a specific bottleneck; impact bounded by adjacent process steps.",
      estimatedBuildEffort: "4 weeks for a 3-person team",
      risks: a.risks,
    })),
    toolboxRecommendations: toolbox.map((t) => ({ pillar: t.pillar, asset: t.asset, whyRelevant: t.why })),
    executiveSummary: `${title} is a high-leverage opportunity where an agent can absorb the routine majority of cases and let humans focus on the genuinely complex tail. ${agents.length} candidate agents are buildable inside the 10-week program. Expected outcomes include >60% cycle-time reduction and material capacity re-allocation, contingent on clean upstream data and disciplined rule codification.`,
  };
}

export const sampleRoi: RoiModel = {
  timeSavedHours: 4200,
  hourlyCost: 75,
  costReducedAmount: 315000,
  revenueEnabledAmount: 50000,
  currency: "USD",
  costsListed: "Engineering build (~$60K), integration (~$25K), ongoing ops (~$30K/yr including LLM API).",
  assumptions: "60% adoption Q1 ramping to 85% by Q4; routine cases represent 70% of volume; baseline cycle time 9 days.",
  adoptionCurve: "30% → 50% → 70% → 85% by quarter end",
  timeHorizon: "12 months",
};

export const samplePitchDeck = (
  clientOrg: string,
  agentName: string,
  challengeTitle: string,
  framework: string,
  roi: RoiModel,
): PitchDeck => ({
  deckTitle: `${agentName}: ship a ${(roi.timeSavedHours || 0).toLocaleString()}-hour saving`,
  subtitle: `Solving ${challengeTitle} with an agent we built in 10 weeks`,
  slides: [
    { slideNumber: 1, title: "The Problem", headline: `${clientOrg} is losing time and accuracy on ${challengeTitle}.`, bulletPoints: ["Today's process takes 9 days vs the 2-day SLA.", "Volume is rising faster than capacity.", "Stakeholders have escalated to ministerial level."], visualSuggestion: "Before/after process map showing the bottleneck.", speakerNotes: "Open by quantifying the pain in their language: cycle time, backlog, complaints. Don't lead with AI." },
    { slideNumber: 2, title: "Our Solution", headline: `${agentName} orchestrates the ${framework} pipeline so people work on the hard 30%.`, bulletPoints: [`Built on ${framework}.`, "Connects the data sources we already have.", "Routes anything outside policy to a human reviewer."], visualSuggestion: "Architecture diagram with agent in the middle, tools fanning out.", speakerNotes: "One sentence on the architecture. Spend the time on what the agent will and won't do." },
    { slideNumber: 3, title: "Live Demo", headline: "Watch it process a real case in under a minute.", bulletPoints: ["We show one routine case (auto-handled).", "We show one edge case (handed to a human with rationale).", "We pause for the inevitable 'what if it gets it wrong' question."], visualSuggestion: "Live screen — fall back to a 90-second recording if network is risky.", speakerNotes: "One presenter drives, one watches the audience for the next question." },
    { slideNumber: 4, title: "Business Impact", headline: `${(roi.timeSavedHours || 0).toLocaleString()} hours/year saved · ${(roi.costReducedAmount || 0).toLocaleString()} ${roi.currency} cost reduced`, bulletPoints: [`${(roi.timeSavedHours || 0).toLocaleString()} hours redirected to higher-value work`, `${(roi.costReducedAmount || 0).toLocaleString()} ${roi.currency} annualized cost reduction`, "Cycle time falls from 9 days to under 2"], visualSuggestion: "Side-by-side: today's metrics vs projected after rollout.", speakerNotes: "Lead with the headline number. Anchor any large number with a stated assumption." },
    { slideNumber: 5, title: "What We're Asking For", headline: "Greenlight a 90-day production pilot.", bulletPoints: ["Two product engineers seconded for 90 days.", "Sponsorship to engage the source-system owners.", "Stage gates: working pilot at 30 days, 50% rollout at 60, full at 90."], visualSuggestion: "Roadmap timeline with three milestones.", speakerNotes: "Make the ask specific. Don't end with 'questions?' — end with the ask." },
  ],
  anticipatedQuestions: [
    { question: "What happens when the agent gets it wrong?", suggestedAnswer: "Every action above a confidence threshold is logged for human review; below it the agent escalates with the full chain of reasoning. Complete audit trail." },
    { question: "Why build vs buy?", suggestedAnswer: "We benchmarked three vendors. None of them know our policies or our data shape. Build cost is recovered in <8 months at projected savings." },
    { question: "Who owns this in production?", suggestedAnswer: "Operations team owns outcomes; IT owns the agent. We've drafted a RACI." },
  ],
  presenterTips: [
    "Lead with business outcome, not technology.",
    "Demo crisply — pre-record a backup.",
    "Close with the ask, not 'questions?'.",
  ],
});
