import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { isClaudeConfigured, generateJson } from "@/lib/ai/claude";
import * as P from "@/lib/ai/prompts/generatePitch";
import { safeJson } from "@/lib/utils";
import type { PitchDeck, RoiModel } from "@/lib/ai/types";

/**
 * BRD Section 7.6 — Pitch Deck Generator (PROMPT 4). JSON output.
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
  if (!agent.challenge) return NextResponse.json({ error: "No challenge" }, { status: 400 });

  const roi = safeJson<RoiModel>(agent.roiModel || null, {});
  const kpis = safeJson<string[]>(agent.kpis, []);
  const risks = safeJson<string[]>(agent.risks, []);
  const roadmap = safeJson<{ months3: string[]; months6: string[]; months12: string[] }>(
    agent.roadmap,
    { months3: [], months6: [], months12: [] },
  );
  const roadmapText = `3 months: ${roadmap.months3.join("; ") || "(none)"}\n6 months: ${roadmap.months6.join("; ") || "(none)"}\n12 months: ${roadmap.months12.join("; ") || "(none)"}`;

  let deck: PitchDeck | null = null;
  if (isClaudeConfigured()) {
    const userMessage = P.buildUserMessage({
      project: { clientOrgName: agent.team.project.clientOrgName },
      team: { name: agent.team.name },
      challenge: { title: agent.challenge.title, description: agent.challenge.description },
      blueprint: { name: agent.name, purpose: agent.purpose, framework: agent.framework },
      roi,
      kpis,
      risks,
      roadmap: roadmapText,
    });
    const r = await generateJson<PitchDeck>(
      {
        feature: "generatePitch",
        projectId: session.projectId as string,
        model: P.model,
        systemPrompt: P.systemPrompt,
        userMessage,
        maxTokens: P.maxTokens,
        temperature: P.temperature,
      },
      P.parseOutput,
    );
    if (r.ok && r.data) deck = r.data;
  }
  if (!deck) deck = stubDeck(agent, roi, kpis);

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
  return NextResponse.json({ deck });
}

function stubDeck(
  agent: { name: string; framework: string; llm: string; team: { project: { clientOrgName: string } }; challenge: { title: string } | null },
  roi: RoiModel,
  kpis: string[],
): PitchDeck {
  return {
    deckTitle: `${agent.name}: ship a ${roi.timeSavedHours || 0}-hour saving`,
    subtitle: `Solving ${agent.challenge?.title || "the challenge"} with an agent we built in 10 weeks`,
    slides: [
      { slideNumber: 1, title: "The Problem", headline: `${agent.team.project.clientOrgName} is losing time and accuracy on ${agent.challenge?.title || "this process"}.`, bulletPoints: ["Today's process takes too long and varies by reviewer.", "Volume is rising; capacity isn't.", "Stakeholders have escalated dissatisfaction."], visualSuggestion: "Before/after process map showing the bottleneck.", speakerNotes: "Open by quantifying the pain in their language: cycle time, backlog, complaints. Don't lead with AI." },
      { slideNumber: 2, title: "Our Solution", headline: `${agent.name} orchestrates the ${agent.framework} pipeline so people work on the hard 30%.`, bulletPoints: [`Built on ${agent.framework} and ${agent.llm}.`, "Connects the data sources you already have.", "Routes anything outside policy to a human reviewer."], visualSuggestion: "Architecture diagram with agent in the middle, tools fanning out.", speakerNotes: "One sentence on the architecture. Spend the time on what the agent will and won't do." },
      { slideNumber: 3, title: "Live Demo", headline: "Watch it process a real case in under a minute.", bulletPoints: ["We show one routine case (auto-handled).", "We show one edge case (handed to a human with rationale).", "We pause for the inevitable 'what if it gets it wrong' question."], visualSuggestion: "Live screen — fall back to a 90-second recording if network is risky.", speakerNotes: "One presenter drives, one watches the audience and is ready to take questions." },
      { slideNumber: 4, title: "Business Impact", headline: `${(roi.timeSavedHours || 0).toLocaleString()} hours/year saved · ${roi.costReducedAmount ? `${(roi.costReducedAmount).toLocaleString()} ${roi.currency || "USD"} cost reduced` : "cost reduced"}`, bulletPoints: [`${(roi.timeSavedHours || 0).toLocaleString()} hours redirected to higher-value work`, roi.costReducedAmount ? `${(roi.costReducedAmount).toLocaleString()} ${roi.currency || "USD"} annualized cost reduction` : "Material annualized cost reduction", `KPIs we'll watch: ${kpis.slice(0, 3).join(", ") || "cycle time, accuracy, adoption"}`], visualSuggestion: "Side-by-side: today's metrics vs projected after rollout.", speakerNotes: "Lead with the headline number. Anchor any large number with a stated assumption." },
      { slideNumber: 5, title: "What We're Asking For", headline: "Greenlight a 90-day production pilot.", bulletPoints: ["Two product engineers seconded for 90 days.", "Sponsorship to engage the 3 source-system owners.", "Stage gates: working pilot at 30 days, 50% rollout at 60, full rollout at 90."], visualSuggestion: "Roadmap timeline with three milestones.", speakerNotes: "Make the ask specific. Don't end with 'questions?' — end with the ask." },
    ],
    anticipatedQuestions: [
      { question: "What happens when the agent gets it wrong?", suggestedAnswer: "Every action above a confidence threshold is logged for human review; below it the agent escalates. We have a complete audit trail." },
      { question: "Why build vs buy?", suggestedAnswer: "We benchmarked three vendors. None of them know our policies or our data shape. The build cost is recovered in <8 months at projected savings." },
      { question: "Who owns this in production?", suggestedAnswer: "Operations team owns outcomes; IT owns the agent. We've drafted a RACI." },
    ],
    presenterTips: [
      "Lead with business outcome, not technology.",
      "Demo crisply — pre-record a backup.",
      "Close with the ask, not 'questions?'.",
    ],
  };
}
