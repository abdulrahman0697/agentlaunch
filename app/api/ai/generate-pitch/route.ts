import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { safeJson } from "@/lib/utils";
import type { PitchDeck, RoiModel } from "@/lib/ai/types";

/**
 * STUB for M5. PROMPT 4 (Section 7.6) — Pitch Deck Generator.
 * M6 swaps in the real Claude call.
 */
export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireSession("participant");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { agentId } = await req.json();
  const agent = await prisma.agentSolution.findUnique({
    where: { id: agentId },
    include: { team: { include: { project: true } }, challenge: true },
  });
  if (!agent || agent.team.projectId !== session.projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const roi = safeJson<RoiModel | null>(agent.roiModel || null, null);
  const kpis = safeJson<string[]>(agent.kpis, []);

  const deck: PitchDeck = {
    deckTitle: `${agent.name}: ship a ${roi?.timeSavedHours || 0}-hour saving`,
    subtitle: `Solving ${agent.challenge?.title || "the challenge"} with an agent we built in 10 weeks`,
    slides: [
      {
        slideNumber: 1,
        title: "The Problem",
        headline: `${agent.team.project.clientOrgName} is losing time and accuracy on ${agent.challenge?.title || "this process"}.`,
        bulletPoints: [
          "Today's process takes too long and varies by reviewer.",
          "Volume is rising; capacity isn't.",
          "Stakeholders have escalated dissatisfaction.",
        ],
        visualSuggestion: "Before/after process map showing the bottleneck.",
        speakerNotes:
          "Open by quantifying the pain in their language: cycle time, backlog, complaints. Don't lead with AI.",
      },
      {
        slideNumber: 2,
        title: "Our Solution",
        headline: `${agent.name} orchestrates the ${agent.framework} pipeline so people work on the hard 30%.`,
        bulletPoints: [
          `Built on ${agent.framework} and ${agent.llm}.`,
          "Connects the data sources you already have.",
          "Routes anything outside policy to a human reviewer.",
        ],
        visualSuggestion: "Architecture diagram with agent in the middle, tools fanning out.",
        speakerNotes:
          "One sentence on the architecture. Spend the time on what the agent will and won't do.",
      },
      {
        slideNumber: 3,
        title: "Live Demo",
        headline: "Watch it process a real case in under a minute.",
        bulletPoints: [
          "We show one routine case (auto-handled).",
          "We show one edge case (handed to a human with rationale).",
          "We pause for the inevitable 'what if it gets it wrong' question.",
        ],
        visualSuggestion: "Live screen — fall back to a 90-second recording if network is risky.",
        speakerNotes:
          "Choreography matters. One presenter drives, one watches the audience and is ready to take questions.",
      },
      {
        slideNumber: 4,
        title: "Business Impact",
        headline: `${(roi?.timeSavedHours || 0).toLocaleString()} hours/year saved · ${
          roi?.costReducedAmount
            ? `${(roi.costReducedAmount).toLocaleString()} ${roi.currency || "USD"} cost reduced`
            : "cost reduced"
        }`,
        bulletPoints: [
          `${(roi?.timeSavedHours || 0).toLocaleString()} hours redirected to higher-value work`,
          roi?.costReducedAmount
            ? `${(roi.costReducedAmount).toLocaleString()} ${roi.currency || "USD"} annualized cost reduction`
            : "Material annualized cost reduction",
          `KPIs we'll watch: ${(kpis.slice(0, 3).join(", ") || "cycle time, accuracy, adoption")}`,
        ],
        visualSuggestion: "Side-by-side: today's metrics vs projected after rollout.",
        speakerNotes:
          "Lead with the headline number. Anchor any large number with a stated assumption.",
      },
      {
        slideNumber: 5,
        title: "What We're Asking For",
        headline: "Greenlight a 90-day production pilot.",
        bulletPoints: [
          "Two product engineers seconded for 90 days.",
          "Sponsorship to engage the 3 source-system owners.",
          "Stage gates: working pilot at 30 days, 50% rollout at 60, full rollout at 90.",
        ],
        visualSuggestion: "Roadmap timeline with three milestones.",
        speakerNotes:
          "Make the ask specific. Don't end with 'questions?' — end with the ask.",
      },
    ],
    anticipatedQuestions: [
      {
        question: "What happens when the agent gets it wrong?",
        suggestedAnswer:
          "Every action above a confidence threshold is logged for human review; below it the agent escalates. We have a complete audit trail.",
      },
      {
        question: "Why build vs buy?",
        suggestedAnswer:
          "We benchmarked three vendors. None of them know our policies or our data shape. The build cost is recovered in <8 months at projected savings.",
      },
      {
        question: "Who owns this in production?",
        suggestedAnswer:
          "The operations team owns outcomes; IT owns the agent. We've drafted a RACI and it's in the appendix.",
      },
    ],
    presenterTips: [
      "Lead with business outcome, not technology.",
      "Demo crisply — pre-record a backup.",
      "Close with the ask, not 'questions?'.",
    ],
  };

  await prisma.agentSolution.update({
    where: { id: agentId },
    data: { pitchDeck: JSON.stringify(deck), status: "demo_ready" },
  });
  await prisma.activityLog.create({
    data: {
      projectId: session.projectId as string,
      userId: session.sub,
      userType: "participant",
      userName: session.name,
      action: "participant.pitch_generated",
      payload: JSON.stringify({ agentId }),
    },
  });
  await prisma.aiCallLog.create({
    data: {
      projectId: session.projectId as string,
      feature: "generatePitch",
      model: "stub",
      status: "ok",
    },
  });
  return NextResponse.json({ deck });
}
