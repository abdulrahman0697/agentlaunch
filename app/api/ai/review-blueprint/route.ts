import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { safeJson } from "@/lib/utils";

/**
 * STUB for M5. PROMPT 2 (Section 7.4) — Agent Blueprint Reviewer.
 * M6 replaces this with the real streaming Claude call.
 *
 * Returns a streamed plain-text markdown response so the UI's
 * progressive rendering works exactly as it will with real Claude.
 */
export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireSession("participant");
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
  const { agentId } = await req.json().catch(() => ({}));
  if (!agentId) return new Response("agentId required", { status: 400 });

  const agent = await prisma.agentSolution.findUnique({
    where: { id: agentId },
    include: { team: true, challenge: true },
  });
  if (!agent || agent.team.projectId !== session.projectId) {
    return new Response("Not found", { status: 404 });
  }

  const tools = safeJson<string[]>(agent.tools, []);
  const inputs = safeJson<string[]>(agent.inputs, []);
  const verdict =
    agent.purpose && tools.length >= 2 && agent.guardrails
      ? "READY TO BUILD"
      : "NEEDS REVISION";

  const text = `## Overall Assessment

This blueprint addresses "${agent.challenge?.title || "the challenge"}" with a ${agent.framework} agent. ${
    verdict === "READY TO BUILD"
      ? "The scope is reasonable, the tool set is coherent, and the guardrails are explicit. You can start coding."
      : "The scope and instrumentation need tightening before you start coding — see below."
  }

Verdict: **${verdict}**

## What's Working Well
- Choice of ${agent.framework} fits the workflow shape implied by your inputs.
- Tool selection (${tools.slice(0, 3).join(", ") || "—"}) covers the obvious calls.
- ${
    agent.guardrails
      ? "You've thought about guardrails up front."
      : "Clear separation of inputs and outputs."
  }

## What Needs Work
- **Scope**: Be ruthless about narrowing for week 4 — pick the 70% case and ignore the rest.
- **Tool descriptions**: Each tool needs a concrete description and example input — the model can't reason over names alone.
- **Memory & state**: ${
    agent.memory
      ? "Spell out lifecycle: when does state get cleared?"
      : "Memory is currently empty — define what (if anything) the agent remembers across runs."
  }
- **Failure modes**: What does the agent do when an upstream API is down or slow?

## Critical Risks
- ${inputs.length > 0 ? `Data freshness on ${inputs[0]}` : "No data sources listed"} could silently degrade quality.
- LLM hallucination at high autonomy levels — keep a confidence threshold for human handoff.

## Recommended Next Steps
1. Write a one-page system prompt explicitly anchoring the agent's role.
2. Add at least one example invocation in your blueprint (input → expected behavior).
3. Define a simple eval: 10 representative inputs you'll regress against.
4. Add a "fall back to human" tool with a clear trigger.
5. Cut the scope by 20% and re-read — usually still too broad.

## Sia Engineer's Take

Solid bones. The shape is right and the framework choice is defensible. Most blueprints at this stage are guilty of two sins: trying to do too much in one agent, and skimping on the failure-mode work. Tighten scope first, write the prompt next, then code. You're closer than you think — focus the next two days on the system prompt and the eval set, and you'll be coding by Friday.
`;

  await prisma.agentSolution.update({
    where: { id: agentId },
    data: { blueprintReview: text, status: agent.status === "draft" ? "blueprint" : agent.status },
  });
  await prisma.activityLog.create({
    data: {
      projectId: session.projectId as string,
      userId: session.sub,
      userType: "participant",
      userName: session.name,
      action: "participant.blueprint_reviewed",
      payload: JSON.stringify({ agentId, verdict }),
    },
  });
  await prisma.aiCallLog.create({
    data: {
      projectId: session.projectId as string,
      feature: "reviewBlueprint",
      model: "stub",
      status: "ok",
    },
  });

  // Stream the text in chunks so the UI's reader path is exercised.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const chunks = text.split(/(?<=\n)/);
      for (const c of chunks) {
        controller.enqueue(encoder.encode(c));
        await new Promise((r) => setTimeout(r, 25));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
