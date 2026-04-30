import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { isClaudeConfigured, generateJson } from "@/lib/ai/claude";
import * as P from "@/lib/ai/prompts/validateRoi";
import { safeJson } from "@/lib/utils";
import type { RoiModel, RoiValidation } from "@/lib/ai/types";

/**
 * BRD Section 7.9 — ROI Sanity Check (PROMPT 7). JSON output.
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
    include: { team: true, challenge: true },
  });
  if (!agent || agent.team.projectId !== session.projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!agent.challenge) return NextResponse.json({ error: "No challenge" }, { status: 400 });

  const roi = safeJson<RoiModel | null>(agent.roiModel || null, null);
  if (!roi) return NextResponse.json({ error: "No ROI model saved yet" }, { status: 400 });

  let validation: RoiValidation | null = null;
  if (isClaudeConfigured()) {
    const userMessage = P.buildUserMessage({
      blueprint: { name: agent.name },
      challenge: { title: agent.challenge.title },
      roi,
    });
    const r = await generateJson<RoiValidation>(
      {
        feature: "validateRoi",
        projectId: session.projectId as string,
        model: P.model,
        systemPrompt: P.systemPrompt,
        userMessage,
        maxTokens: P.maxTokens,
        temperature: P.temperature,
      },
      P.parseOutput,
    );
    if (r.ok && r.data) validation = r.data;
  }
  if (!validation) validation = stubValidation(roi);

  await prisma.agentSolution.update({
    where: { id: agentId },
    data: { roiValidation: JSON.stringify(validation) },
  });
  await prisma.activityLog.create({
    data: {
      projectId: session.projectId as string,
      userId: session.sub,
      userType: "participant",
      userName: session.name,
      action: "participant.roi_validated",
      payload: JSON.stringify({ agentId, verdict: validation.overallVerdict }),
    },
  });
  return NextResponse.json({ validation });
}

function stubValidation(roi: RoiModel): RoiValidation {
  const verdict: RoiValidation["overallVerdict"] = !roi.assumptions
    ? "NEEDS_REFINEMENT"
    : (roi.timeSavedHours || 0) > 5000 && !roi.adoptionCurve
      ? "OVERCLAIMED"
      : "DEFENSIBLE";
  return {
    overallVerdict: verdict,
    credibilityScore: verdict === "DEFENSIBLE" ? 8 : verdict === "NEEDS_REFINEMENT" ? 6 : 4,
    assumptionReview: [
      {
        assumption: roi.assumptions || "(none stated)",
        verdict: roi.assumptions ? "reasonable" : "missing_evidence",
        comment: roi.assumptions
          ? "Stated, but anchor each assumption to a quantitative source."
          : "List each assumption explicitly.",
      },
      {
        assumption: `${roi.timeSavedHours || 0} hours saved per year`,
        verdict: (roi.timeSavedHours || 0) > 8000 ? "aggressive" : "reasonable",
        comment:
          (roi.timeSavedHours || 0) > 8000
            ? "More than 8,000 hours/year is ~4 FTE. Either back this with telemetry or scope it down."
            : "Plausible — make sure your baseline measurement methodology is documented.",
      },
    ],
    missingFactors: [
      "Implementation cost (engineering time + integration)",
      "Ongoing operating cost (LLM API, monitoring)",
      "Change management cost (training, comms, role redesign)",
    ],
    suggestedAdjustments: [
      {
        metric: "Adoption in year 1",
        currentValue: roi.adoptionCurve || "(unstated)",
        suggestedValue: "Start at 30%, ramp to 70% by Q4",
        rationale: "Most internal AI tools see 30-50% adoption in the first 6 months.",
      },
    ],
    questionsTheJuryWillAsk: [
      "What's the all-in cost for the first 12 months including ops?",
      "What's the recovery period if adoption is half what you projected?",
      "How will you measure savings vs. assume them?",
    ],
    strengthenedNarrative: `Frame the savings as a range, not a point. Anchor the lower bound to data you can show today; describe the upper bound as conditional on adoption ≥${roi.adoptionCurve ? "your stated curve" : "70% by Q4"}.`,
  };
}
