import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { safeJson } from "@/lib/utils";
import type { RoiModel, RoiValidation } from "@/lib/ai/types";

/**
 * STUB for M5. PROMPT 7 (Section 7.9) — ROI Sanity Check.
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
    include: { team: true },
  });
  if (!agent || agent.team.projectId !== session.projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const roi = safeJson<RoiModel | null>(agent.roiModel || null, null);
  if (!roi) {
    return NextResponse.json({ error: "No ROI model saved yet" }, { status: 400 });
  }

  const verdict: RoiValidation["overallVerdict"] =
    !roi.assumptions
      ? "NEEDS_REFINEMENT"
      : (roi.timeSavedHours || 0) > 5000 && !roi.adoptionCurve
        ? "OVERCLAIMED"
        : "DEFENSIBLE";

  const validation: RoiValidation = {
    overallVerdict: verdict,
    credibilityScore: verdict === "DEFENSIBLE" ? 8 : verdict === "NEEDS_REFINEMENT" ? 6 : 4,
    assumptionReview: [
      {
        assumption: roi.assumptions || "(none stated)",
        verdict: roi.assumptions ? "reasonable" : "missing_evidence",
        comment: roi.assumptions
          ? "Stated, but anchor each one to a quantitative source — historical data, vendor benchmark, or a back-of-envelope you can defend on slide."
          : "List each assumption explicitly. The CFO will ask 'where does that number come from?'",
      },
      {
        assumption: `${roi.timeSavedHours || 0} hours saved per year`,
        verdict: (roi.timeSavedHours || 0) > 8000 ? "aggressive" : "reasonable",
        comment:
          (roi.timeSavedHours || 0) > 8000
            ? "More than 8,000 hours/year is the equivalent of ~4 FTE. Either back this with current process telemetry or scope it down."
            : "Plausible — make sure your baseline measurement methodology is documented.",
      },
    ],
    missingFactors: [
      "Implementation cost (engineering time + integration)",
      "Ongoing operating cost (LLM API, monitoring, maintenance)",
      "Change management cost (training, comms, role redesign)",
    ],
    suggestedAdjustments: [
      {
        metric: "Adoption in year 1",
        currentValue: roi.adoptionCurve || "(unstated)",
        suggestedValue: "Start at 30%, ramp to 70% by Q4",
        rationale:
          "Most internal AI tools see 30-50% adoption in the first 6 months. Modeling 90% from day one will not survive scrutiny.",
      },
    ],
    questionsTheJuryWillAsk: [
      "What's the all-in cost for the first 12 months including ops?",
      "What's the recovery period if adoption is half what you projected?",
      "How will you measure savings vs. assume them?",
    ],
    strengthenedNarrative: `Frame the savings as a range, not a point. Anchor the lower bound to data you can show today; describe the upper bound as conditional on adoption ≥${roi.adoptionCurve ? "your stated curve" : "70% by Q4"}. Then close with the recovery period — that's the number CFOs anchor on.`,
  };

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
      payload: JSON.stringify({ agentId, verdict }),
    },
  });
  await prisma.aiCallLog.create({
    data: {
      projectId: session.projectId as string,
      feature: "validateRoi",
      model: "stub",
      status: "ok",
    },
  });
  return NextResponse.json({ validation });
}
