import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import type { ChallengeAnalysis } from "@/lib/ai/types";

/**
 * STUB for M4. The real Claude wiring (PROMPT 1, BRD Section 7.3) lands in M6.
 *
 * For M4 we return high-quality canned data so the entire challenge UI
 * (analysis tabs, scatter, benchmarks, toolbox recs) is demonstrable.
 * M6 replaces the body of this handler with a real call to
 * /lib/ai/prompts/analyzeChallenge.ts.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { challengeId, regenerate } = await req.json();
  if (!challengeId) {
    return NextResponse.json({ error: "challengeId required" }, { status: 400 });
  }
  const challenge = await prisma.strategicChallenge.findUnique({
    where: { id: challengeId },
  });
  if (!challenge || challenge.projectId !== session.projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (challenge.aiAnalysis && !regenerate) {
    return NextResponse.json({ ok: true, cached: true });
  }

  const analysis: ChallengeAnalysis = {
    reframedProblem: {
      statement: `The challenge "${challenge.title}" is bottlenecked not by decision complexity but by manual fan-out across siloed data sources and inconsistent rule application. An orchestration agent that ingests the request, runs automated checks, and produces a recommendation can collapse the cycle while preserving human review where it matters.`,
      rootCauseHypotheses: [
        "Decision logic lives in tribal knowledge rather than codified rules.",
        "Required inputs sit in 4+ disconnected systems with no integration layer.",
        "Manual back-and-forth on incomplete submissions creates avoidable wait time.",
      ],
      stakeholderMap: [
        { stakeholder: "Frontline officers", interest: "Faster turnaround without losing rigor", influence: "high" },
        { stakeholder: "Operations leadership", interest: "Throughput and consistency", influence: "high" },
        { stakeholder: "Compliance / Legal", interest: "Auditability and regulatory alignment", influence: "high" },
        { stakeholder: "End customers / applicants", interest: "Real-time status and predictability", influence: "medium" },
      ],
      successCriteria: [
        "Average end-to-end cycle time reduced by ≥60%.",
        "≥80% of routine cases auto-handled with explicit confidence threshold.",
        "Zero increase in regulatory exception rate vs baseline.",
      ],
    },
    benchmarking: {
      similarCases: [
        {
          organization: "Reference Org A (regulator)",
          industry: "Public sector / regulatory",
          approach: "Built an orchestration agent that pulled application data, validated against a rule engine, and routed exceptions to humans.",
          outcome: "Cycle time fell from 9 days to under 1 day for 70% of applications; manual workload halved.",
          relevanceToThisChallenge: "Same fan-out-and-validate pattern; lessons on rule codification carry over.",
        },
        {
          organization: "Reference Org B (financial services)",
          industry: "Banking",
          approach: "Conversational agent for incomplete submissions with retrieval over policy library.",
          outcome: "Re-submission turnaround dropped from days to minutes; auto-approval rate +35%.",
          relevanceToThisChallenge: "Demonstrates the value of a thin conversational layer in front of orchestration.",
        },
        {
          organization: "Reference Org C (utility)",
          industry: "Utilities",
          approach: "Risk-scoring agent that prioritized inspector workload using historical outcomes.",
          outcome: "30% increase in caught high-risk cases without additional headcount.",
          relevanceToThisChallenge: "Shows what a triage agent should look like for the high-impact slice.",
        },
      ],
      industryBestPractices: [
        "Codify the rule engine BEFORE asking an LLM to reason over it.",
        "Always keep a clear human-in-the-loop bypass with audit trail.",
        "Measure against baseline cycle time from week 1 — don't try to retrofit metrics.",
      ],
      commonPitfalls: [
        "Treating the LLM as the system of record instead of as an orchestrator.",
        "No fallback path when external data sources are slow or unavailable.",
        "Underestimating the change-management work for officers whose roles will shift.",
      ],
    },
    suggestedAgents: [
      {
        name: "Triage Agent",
        oneLiner: "Reads each incoming request, runs all automated checks, classifies as auto-approve / needs-review / reject.",
        agentType: "workflow",
        primaryUserRole: "Front-line officer",
        coreCapabilities: [
          "Document parsing",
          "Multi-source data aggregation",
          "Confidence scoring with rationale",
        ],
        requiredDataSources: ["Application intake DB", "Reference rules library"],
        suggestedTechStack: {
          framework: "LangGraph",
          llm: "claude-sonnet-4-6",
          rationale: "LangGraph's stateful workflow fits a multi-step deterministic pipeline; Sonnet balances speed and reasoning.",
        },
        feasibilityScore: 9,
        feasibilityRationale: "Data is available; integration surface is small; rules can be codified inside 2 weeks.",
        impactScore: 8,
        impactRationale: "Cuts cycle time on the routine 70% of cases; frees ~1.5 FTE for higher-value review.",
        estimatedBuildEffort: "4 weeks for a 3-person team",
        risks: ["Edge cases in legacy applications", "Integration auth changes mid-build"],
      },
      {
        name: "Compliance Verification Agent",
        oneLiner: "Cross-references each case against current regulations and flags contradictions in real time.",
        agentType: "autonomous",
        primaryUserRole: "Compliance reviewer",
        coreCapabilities: ["Regulatory retrieval", "Cross-source consistency check", "Exception escalation"],
        requiredDataSources: ["Regulatory corpus", "Internal SOPs", "Decision history"],
        suggestedTechStack: {
          framework: "Claude Agents SDK",
          llm: "claude-opus-4-7",
          rationale: "Reasoning-heavy and compliance-sensitive — Opus's accuracy is worth the latency.",
        },
        feasibilityScore: 7,
        feasibilityRationale: "Requires a clean regulatory corpus and version control to be truly safe.",
        impactScore: 9,
        impactRationale: "Reduces compliance exceptions and the related rework loop.",
        estimatedBuildEffort: "5 weeks for a 3-person team",
        risks: ["Regulatory hallucination if corpus is stale", "Auditing the agent's reasoning"],
      },
      {
        name: "Applicant Communication Agent",
        oneLiner: "Conversational agent that handles incomplete-submission back-and-forth with applicants.",
        agentType: "conversational",
        primaryUserRole: "Applicant (external)",
        coreCapabilities: ["Multi-turn chat", "Form completion guidance", "Status updates"],
        requiredDataSources: ["Application status DB", "FAQ / policy library"],
        suggestedTechStack: {
          framework: "LangChain",
          llm: "claude-haiku-4-5",
          rationale: "High-volume chat with clear scope — Haiku is fast and cheap; LangChain has the cleanest chat-with-tools pattern.",
        },
        feasibilityScore: 8,
        feasibilityRationale: "Scope is bounded; main risk is tone/voice consistency.",
        impactScore: 6,
        impactRationale: "Eliminates the email back-and-forth that adds 2-3 days to the cycle.",
        estimatedBuildEffort: "3 weeks for a 2-person team",
        risks: ["Brand-voice mismatch", "Hallucinated status"],
      },
      {
        name: "Decision Audit Agent",
        oneLiner: "Periodically analyzes past decisions to surface drift, bias, and policy gaps.",
        agentType: "autonomous",
        primaryUserRole: "Operations leadership",
        coreCapabilities: ["Pattern analysis", "Drift detection", "Recommendation drafting"],
        requiredDataSources: ["Decision history", "Outcome data"],
        suggestedTechStack: {
          framework: "CrewAI",
          llm: "claude-sonnet-4-6",
          rationale: "Multi-agent crew matches the analyst+writer pairing this work needs.",
        },
        feasibilityScore: 6,
        feasibilityRationale: "Depends on having clean outcome data — often not the case in legacy systems.",
        impactScore: 7,
        impactRationale: "Higher leadership confidence + clearer policy iteration loop.",
        estimatedBuildEffort: "4 weeks for a 2-person team",
        risks: ["Data quality", "Confusing analytical output with recommendations"],
      },
    ],
    toolboxRecommendations: [
      {
        pillar: "Operating Model",
        asset: "AI Governance Framework",
        whyRelevant: "Defines decision rights and audit trail for the agent's autonomous actions.",
      },
      {
        pillar: "Solutions",
        asset: "Sectorial Use Case Libraries",
        whyRelevant: "Adjacent reference patterns reduce design time on the triage workflow.",
      },
      {
        pillar: "Technology and Data",
        asset: "Benchmark of Market Solutions",
        whyRelevant: "Pre-evaluated comparison of agent frameworks accelerates the framework choice.",
      },
    ],
    executiveSummary: `${challenge.title} is a fan-out-and-validate problem where an agent can absorb the routine 70% of cases and let humans focus on the genuinely complex tail. Three to five candidate agents are buildable inside the 10-week program; the Triage Agent and Compliance Verification Agent are the highest-leverage starting points. Expected outcomes include >60% cycle-time reduction and material FTE re-allocation, contingent on clean upstream data and disciplined rule codification.`,
  };

  await prisma.strategicChallenge.update({
    where: { id: challengeId },
    data: {
      aiAnalysis: JSON.stringify(analysis),
      suggestedAgents: JSON.stringify(analysis.suggestedAgents),
      benchmarkData: JSON.stringify(analysis.benchmarking),
    },
  });
  await prisma.activityLog.create({
    data: {
      projectId: session.projectId as string,
      userId: session.sub,
      userType: session.role,
      userName: session.name,
      action: "project_admin.challenge_analyzed",
      payload: JSON.stringify({ challengeId, regenerated: !!regenerate }),
    },
  });
  // Log to AI cost log so cross-project analytics has a non-empty count
  await prisma.aiCallLog.create({
    data: {
      projectId: session.projectId as string,
      feature: "analyzeChallenge",
      model: "stub",
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      status: "ok",
    },
  });

  return NextResponse.json({ ok: true });
}
