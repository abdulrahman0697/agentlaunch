import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { isClaudeConfigured, generateJson } from "@/lib/ai/claude";
import * as P from "@/lib/ai/prompts/draftChallenge";
import type { DraftedChallenge } from "@/lib/ai/prompts/draftChallenge";

/**
 * Drafts the four free-text fields of a Strategic Challenge from a title +
 * a short brief — used by the "✨ Draft with AI" button on /challenges/new.
 *
 * Falls back to a structured stub when ANTHROPIC_API_KEY isn't configured
 * so the demo runs in either mode.
 */
export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireSession("project_admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { title, brief } = await req.json().catch(() => ({}));
  if (!title || typeof title !== "string" || title.trim().length < 3) {
    return NextResponse.json(
      { error: "Title is required (3+ characters)" },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: session.projectId as string },
    select: { clientOrgName: true },
  });

  let draft: DraftedChallenge | null = null;
  if (isClaudeConfigured()) {
    const userMessage = P.buildUserMessage({
      title: String(title),
      brief: String(brief || ""),
      clientOrgName: project?.clientOrgName,
    });
    const r = await generateJson<DraftedChallenge>(
      {
        feature: "draftChallenge",
        projectId: session.projectId as string,
        model: P.model,
        systemPrompt: P.systemPrompt,
        userMessage,
        maxTokens: P.maxTokens,
        temperature: P.temperature,
      },
      P.parseOutput,
    );
    if (r.ok && r.data) draft = r.data;
  }
  if (!draft) draft = stubDraft(String(title), String(brief || ""));

  return NextResponse.json({ draft });
}

function stubDraft(title: string, brief: string): DraftedChallenge {
  const briefSnippet = brief
    ? brief.split(/\s+/).slice(0, 30).join(" ") + (brief.split(/\s+/).length > 30 ? "…" : "")
    : "";
  return {
    description: `${title} addresses a recurring business workflow that today depends on manual coordination across multiple systems and individual judgment. The volume and complexity have grown faster than the current process can absorb, creating measurable cycle-time pressure and inconsistent outcomes that an agentic-AI orchestrator could meaningfully improve.${briefSnippet ? `\n\nContext from the admin: ${briefSnippet}` : ""}`,
    businessContext: `This work sits at the intersection of operations and stakeholder service, and is increasingly visible to leadership. Volume has grown materially over the last 12-24 months while team capacity has stayed flat. Stakeholders — both internal and external — have escalated the cycle-time and consistency issues, and there is now leadership willingness to invest in a structural fix rather than another round of process tuning.`,
    currentPainPoints: [
      "- Cycle time is measured in days when the published expectation is hours",
      "- Decisions vary across reviewers because the rules live in tribal knowledge",
      "- Required inputs sit across 4+ disconnected systems with no integration layer",
      "- Manual back-and-forth on incomplete submissions adds preventable wait time",
      "- No analytics on rejection patterns, root causes, or reviewer load",
    ].join("\n"),
    desiredOutcome: `Reduce average end-to-end cycle time by ≥60% on the routine majority of cases, achieve consistent rule application across reviewers, and free skilled capacity for the genuinely complex tail. Success is measured by cycle time, auto-handled rate, and zero increase in regulatory or quality exceptions vs the pre-launch baseline.`,
    suggestedTags: ["Operations", "Compliance", "IT"],
  };
}
