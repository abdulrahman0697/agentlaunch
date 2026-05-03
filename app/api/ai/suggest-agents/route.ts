import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { generateJson, isClaudeConfigured } from "@/lib/ai/claude";
import * as P from "@/lib/ai/prompts/suggestAgents";
import { safeJson } from "@/lib/utils";
import type { AgentSuggestions } from "@/lib/ai/prompts/suggestAgents";
import type { ChallengeAnalysis } from "@/lib/ai/types";

/**
 * Suggests 5 candidate agents for a participant's claimed challenge,
 * each with measurable expected outcomes and real-world benchmarks
 * (with reference URLs). Used by the "Suggest agents with AI" button on
 * the Build Workspace · Discovery & Scoping tab.
 *
 * Falls back to a structured stub when ANTHROPIC_API_KEY is unset so the
 * demo still runs end-to-end.
 */
export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireSession("participant");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { challengeId } = await req.json().catch(() => ({}));
  if (!challengeId) {
    return NextResponse.json({ error: "challengeId required" }, { status: 400 });
  }

  const challenge = await prisma.strategicChallenge.findUnique({
    where: { id: String(challengeId) },
    include: { project: true },
  });
  if (!challenge || challenge.projectId !== session.projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const tags = safeJson<string[]>(challenge.departmentTags, []);
  const priorAnalysis = safeJson<ChallengeAnalysis | null>(challenge.aiAnalysis, null);
  const priorSummary = priorAnalysis
    ? [
        priorAnalysis.reframedProblem?.statement,
        priorAnalysis.executiveSummary,
      ]
        .filter(Boolean)
        .join("\n\n")
    : undefined;

  let suggestions: AgentSuggestions | null = null;
  if (isClaudeConfigured()) {
    const userMessage = P.buildUserMessage({
      clientOrgName: challenge.project.clientOrgName,
      challenge: {
        title: challenge.title,
        description: challenge.description,
        businessContext: challenge.businessContext,
        currentPainPoints: challenge.currentPainPoints,
        desiredOutcome: challenge.desiredOutcome,
        departmentTags: tags,
        priority: challenge.priority,
      },
      priorAnalysisSummary: priorSummary,
    });
    const r = await generateJson<AgentSuggestions>(
      {
        feature: "suggestAgents",
        projectId: session.projectId as string,
        model: P.model,
        systemPrompt: P.systemPrompt,
        userMessage,
        maxTokens: P.maxTokens,
        temperature: P.temperature,
      },
      P.parseOutput,
    );
    if (r.ok && r.data) suggestions = r.data;
  }
  if (!suggestions) suggestions = stubSuggestions(challenge.title);

  return NextResponse.json({ suggestions: suggestions.suggestions });
}

function stubSuggestions(title: string): AgentSuggestions {
  const benchmarks = (q1: string, q2: string, q3: string) => [
    {
      title: q1,
      organization: "Reference org",
      metric: "Cycle time reduced by ~60%",
      url: `https://www.google.com/search?q=${encodeURIComponent(q1)}`,
      source: "Google search",
    },
    {
      title: q2,
      organization: "Reference org",
      metric: "Auto-handle rate +35%",
      url: `https://www.google.com/search?q=${encodeURIComponent(q2)}`,
      source: "Google search",
    },
    {
      title: q3,
      organization: "Reference org",
      metric: "1.5+ FTE freed",
      url: `https://www.google.com/search?q=${encodeURIComponent(q3)}`,
      source: "Google search",
    },
  ];

  return {
    suggestions: [
      {
        name: "Triage & Routing Agent",
        oneLiner: "Reads each incoming request, runs automated checks, classifies as auto-approve / needs-review / reject.",
        agentType: "workflow",
        purpose: `Automate the triage step of "${title}" so routine cases route themselves and human reviewers focus on the complex tail.`,
        description: `A stateful workflow agent that ingests each new request, validates required fields against the rule library, pulls supporting data from the systems of record, and produces a recommendation with confidence and rationale. Front-line officers see the agent's recommendation in their existing queue tool and approve, reject, or escalate. Scope is limited to the routine 70% of cases — anything novel is deliberately deferred to a human.`,
        primaryUserRole: "Front-line officer",
        coreCapabilities: [
          "Document parsing & field extraction",
          "Rule-engine validation with rationale",
          "Multi-source data aggregation",
          "Confidence scoring with explainability",
        ],
        expectedOutcomes: [
          "Average end-to-end cycle time reduced by ≥60% on routine cases",
          "≥80% of routine cases auto-handled at ≥0.9 confidence threshold",
          "1.5+ FTE freed for the complex tail",
          "Zero increase in regulatory exception rate vs baseline",
        ],
        inputs: ["Application intake DB", "Document attachments", "Reference rules library"],
        tools: ["Internal CRM / case-management API", "Document OCR service", "Rule engine"],
        outputs: ["Recommendation (approve / review / reject)", "Confidence score with rationale", "Audit log entry"],
        framework: "LangGraph",
        llm: "claude-sonnet-4-6",
        feasibilityScore: 9,
        impactScore: 8,
        benchmarks: benchmarks(
          "Singapore IRAS GST automated assessment case study",
          "JPMorgan COIN contract intelligence platform",
          "Klarna AI assistant 2.3 million conversations Q1 2024",
        ),
      },
      {
        name: "Applicant Communication Agent",
        oneLiner: "Conversational front-door that handles incomplete-submission back-and-forth with applicants 24/7.",
        agentType: "conversational",
        purpose: `Replace the email ping-pong loop on incomplete submissions with a multi-turn agent that guides applicants to a complete submission in one session.`,
        description: `A conversational agent embedded in the applicant portal and reachable by email reply. It diagnoses what's missing, explains why it's required in plain language, accepts uploads, and only escalates when the applicant explicitly asks for a human. Brand voice is enforced via a style guide. Status questions hit the case API and respond with the actual status — no hallucinated commitments.`,
        primaryUserRole: "External applicant",
        coreCapabilities: [
          "Multi-turn dialogue with memory",
          "Form-completion guidance",
          "Document upload & validation",
          "Status lookup against case API",
        ],
        expectedOutcomes: [
          "Resubmission turnaround reduced from days to minutes",
          "Self-service completion rate ≥70% before any human involvement",
          "30% drop in inbound status-check emails",
          "NPS lift of +15 vs the email-only baseline",
        ],
        inputs: ["Applicant portal sessions", "Case status API", "FAQ / policy library"],
        tools: ["Case management API", "Document upload service", "Email gateway"],
        outputs: ["Completed application packet", "Conversation transcript for audit"],
        framework: "LangChain",
        llm: "claude-haiku-4-5",
        feasibilityScore: 8,
        impactScore: 6,
        benchmarks: benchmarks(
          "Klarna AI assistant customer service case study",
          "Bank of America Erica virtual assistant adoption",
          "Air India Maharaja AI agent results",
        ),
      },
      {
        name: "Compliance Verification Agent",
        oneLiner: "Cross-references each case against current regulations and flags contradictions in real time.",
        agentType: "autonomous",
        purpose: `Catch regulatory exceptions BEFORE a case is closed by continuously checking decisions against the live regulatory corpus.`,
        description: `An autonomous agent that runs after a recommendation is drafted but before it is committed. It retrieves relevant regulatory clauses, checks the proposed decision against them, and either co-signs (with cited clauses) or escalates with a specific objection. The retrieval layer is version-controlled to prevent drift.`,
        primaryUserRole: "Compliance reviewer",
        coreCapabilities: [
          "Regulatory retrieval with citations",
          "Cross-source consistency checking",
          "Exception explanation & escalation",
        ],
        expectedOutcomes: [
          "Compliance exception rate reduced by ≥40%",
          "Audit prep time cut by ~50% via pre-attached citations",
          "100% of decisions carry a traceable regulatory reference",
        ],
        inputs: ["Regulatory corpus (versioned)", "Internal SOPs", "Decision history"],
        tools: ["Vector store over regulatory corpus", "Decision-record API"],
        outputs: ["Co-signed decision with citations", "Escalation packet for compliance"],
        framework: "Claude Agents SDK",
        llm: "claude-opus-4-7",
        feasibilityScore: 7,
        impactScore: 9,
        benchmarks: benchmarks(
          "Anthropic legal research compliance case studies",
          "Thomson Reuters CoCounsel legal AI assistant",
          "Allen and Overy Harvey AI deployment results",
        ),
      },
      {
        name: "Decision Audit & Drift Monitor",
        oneLiner: "Periodically analyzes past decisions to surface drift, bias, and policy gaps.",
        agentType: "autonomous",
        purpose: `Give leadership a continuously refreshed view of decision quality so policy iteration is driven by data, not anecdote.`,
        description: `Runs weekly across the full decision history. Detects drift in approval rates by segment, surfaces patterns of inconsistent reasoning across reviewers, and drafts a short briefing leadership can read in 5 minutes. Output is a recommendation, not an action — a human decides whether to update the rules.`,
        primaryUserRole: "Operations leadership",
        coreCapabilities: [
          "Pattern analysis on decision logs",
          "Drift detection by cohort",
          "Briefing generation with charts",
        ],
        expectedOutcomes: [
          "Weekly briefing replaces a monthly 4-hour analyst exercise",
          "≥3 actionable policy gaps surfaced per quarter",
          "Drift detected within 7 days vs. 90+ day discovery latency today",
        ],
        inputs: ["Decision history table", "Outcome / appeal data", "Reviewer ID metadata"],
        tools: ["Analytics warehouse query layer", "Charting service"],
        outputs: ["Weekly leadership briefing (Markdown + PDF)"],
        framework: "CrewAI",
        llm: "claude-sonnet-4-6",
        feasibilityScore: 6,
        impactScore: 7,
        benchmarks: benchmarks(
          "Capital One model risk monitoring AI case",
          "ZestFinance fair lending drift detection",
          "Sia Partners responsible AI playbook",
        ),
      },
      {
        name: "Reviewer Co-Pilot",
        oneLiner: "Sits inside the reviewer's existing tool and drafts the recommendation while the human stays in control.",
        agentType: "hybrid",
        purpose: `Cut review time without removing human judgment by drafting the recommendation, the rationale, and the citation pack for every case.`,
        description: `A side-panel agent that activates when a reviewer opens a case. It reads the file, drafts the recommendation, attaches the supporting citations, and pre-fills the reviewer's notes field. The reviewer accepts, edits, or rejects in one click. The agent learns from edits to improve future drafts.`,
        primaryUserRole: "Senior reviewer",
        coreCapabilities: [
          "Case summarization",
          "Recommendation drafting with rationale",
          "Citation pack assembly",
          "Edit-feedback capture",
        ],
        expectedOutcomes: [
          "Average review time reduced by 40% per case",
          "Reviewer note quality (peer-rated) up 1+ point on 5-point scale",
          "Onboarding time for new reviewers cut by ~30%",
        ],
        inputs: ["Case file", "Reference rules library", "Reviewer's prior decisions"],
        tools: ["Browser extension hooked into review tool", "Document parser"],
        outputs: ["Drafted recommendation", "Pre-filled notes", "Citation pack"],
        framework: "Claude Agents SDK",
        llm: "claude-sonnet-4-6",
        feasibilityScore: 8,
        impactScore: 8,
        benchmarks: benchmarks(
          "GitHub Copilot enterprise productivity study",
          "Microsoft 365 Copilot case studies",
          "Goldman Sachs developer productivity AI",
        ),
      },
    ],
  };
}
