/**
 * Shared types for Claude prompt I/O — organized per BRD Section 7.
 * Each prompt file in /lib/ai/prompts/ uses these as its parsed-output type.
 */

// PROMPT 1 — Strategic Challenge Analyzer
export interface ChallengeAnalysis {
  reframedProblem: {
    statement: string;
    rootCauseHypotheses: string[];
    stakeholderMap: Array<{
      stakeholder: string;
      interest: string;
      influence: "high" | "medium" | "low";
    }>;
    successCriteria: string[];
  };
  benchmarking: {
    similarCases: Array<{
      organization: string;
      industry: string;
      approach: string;
      outcome: string;
      relevanceToThisChallenge: string;
    }>;
    industryBestPractices: string[];
    commonPitfalls: string[];
  };
  suggestedAgents: Array<{
    name: string;
    oneLiner: string;
    agentType: "workflow" | "conversational" | "autonomous" | "hybrid";
    primaryUserRole: string;
    coreCapabilities: string[];
    requiredDataSources: string[];
    suggestedTechStack: {
      framework:
        | "LangChain"
        | "LangGraph"
        | "Claude Agents SDK"
        | "CrewAI"
        | "AutoGen"
        | "Langflow";
      llm: string;
      rationale: string;
    };
    feasibilityScore: number;
    feasibilityRationale: string;
    impactScore: number;
    impactRationale: string;
    estimatedBuildEffort: string;
    risks: string[];
  }>;
  toolboxRecommendations: Array<{
    pillar:
      | "Strategy"
      | "Operating Model"
      | "Solutions"
      | "Skills"
      | "Technology and Data"
      | "Culture";
    asset: string;
    whyRelevant: string;
  }>;
  executiveSummary: string;
}

// PROMPT 4 — Pitch Deck Generator
export interface PitchDeck {
  deckTitle: string;
  subtitle: string;
  slides: Array<{
    slideNumber: number;
    title: string;
    headline: string;
    bulletPoints: string[];
    visualSuggestion: string;
    speakerNotes: string;
  }>;
  anticipatedQuestions: Array<{ question: string; suggestedAnswer: string }>;
  presenterTips: string[];
}

// PROMPT 6 — Quiz
export interface Quiz {
  moduleTitle: string;
  questions: Array<{
    id: number;
    question: string;
    options: Array<{ key: "A" | "B" | "C" | "D"; text: string }>;
    correctAnswer: "A" | "B" | "C" | "D";
    explanation: string;
  }>;
}

// PROMPT 7 — ROI sanity check
export interface RoiValidation {
  overallVerdict: "DEFENSIBLE" | "NEEDS_REFINEMENT" | "OVERCLAIMED";
  credibilityScore: number;
  assumptionReview: Array<{
    assumption: string;
    verdict: "reasonable" | "optimistic" | "aggressive" | "missing_evidence";
    comment: string;
  }>;
  missingFactors: string[];
  suggestedAdjustments: Array<{
    metric: string;
    currentValue: string;
    suggestedValue: string;
    rationale: string;
  }>;
  questionsTheJuryWillAsk: string[];
  strengthenedNarrative: string;
}

// Inputs for blueprint review (PROMPT 2) and code scaffolding (PROMPT 3)
export interface BlueprintInput {
  name: string;
  purpose: string;
  inputs: string;
  tools: string;
  outputs: string;
  memory: string;
  guardrails: string;
  framework: string;
  llm: string;
  agentType?: string;
}

// AI Coach context (PROMPT 5)
export interface CoachContext {
  userName: string;
  jobTitle?: string | null;
  clientOrgName: string;
  programWeek: number;
  phase: string;
  teamName?: string | null;
  teamMemberCount?: number;
  challengeTitle?: string | null;
  challengeDescription?: string | null;
  blueprintSummary?: string | null;
  currentPage?: string | null;
  recentActions?: string[];
}

// ROI-model shape used throughout the platform.
export interface RoiModel {
  timeSavedHours?: number;
  hourlyCost?: number;
  costReducedAmount?: number;
  revenueEnabledAmount?: number;
  currency?: string;
  costsListed?: string;
  assumptions?: string;
  adoptionCurve?: string;
  timeHorizon?: string;
}
