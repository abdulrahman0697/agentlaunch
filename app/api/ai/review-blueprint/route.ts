import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { isClaudeConfigured, streamText } from "@/lib/ai/claude";
import * as P from "@/lib/ai/prompts/reviewBlueprint";
import { safeJson } from "@/lib/utils";

/**
 * BRD Section 7.4 — Agent Blueprint Reviewer (PROMPT 2). Streams markdown.
 * Falls back to a stub when ANTHROPIC_API_KEY is unset.
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
    include: {
      team: { include: { project: true, members: true } },
      challenge: true,
    },
  });
  if (!agent || agent.team.projectId !== session.projectId) {
    return new Response("Not found", { status: 404 });
  }
  if (!agent.challenge) return new Response("No challenge", { status: 400 });

  const tools = safeJson<string[]>(agent.tools, []);
  const inputs = safeJson<string[]>(agent.inputs, []);
  const outputs = safeJson<string[]>(agent.outputs, []);
  const userMessage = P.buildUserMessage({
    challenge: {
      title: agent.challenge.title,
      description: agent.challenge.description,
      desiredOutcome: agent.challenge.desiredOutcome,
    },
    blueprint: {
      name: agent.name,
      purpose: agent.purpose,
      inputs: inputs.join("\n- ") || "(none)",
      tools: tools.join("\n- ") || "(none)",
      outputs: outputs.join("\n- ") || "(none)",
      memory: agent.memory || "(none)",
      guardrails: agent.guardrails || "(none)",
      framework: agent.framework,
      llm: agent.llm,
    },
    team: { memberCount: agent.team.members.length },
    weeksRemaining: Math.max(0, 10 - agent.team.project.programWeek),
  });

  const encoder = new TextEncoder();

  if (isClaudeConfigured()) {
    const r = await streamText({
      feature: "reviewBlueprint",
      projectId: session.projectId as string,
      model: P.model,
      systemPrompt: P.systemPrompt,
      userMessage,
      maxTokens: P.maxTokens,
      temperature: P.temperature,
    });
    if (r.ok) {
      const projectId = session.projectId as string;
      const sub = session.sub;
      const name = session.name;
      const agentId = agent.id;
      const currentStatus = agent.status;
      let acc = "";
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of r.stream) {
              acc += chunk;
              controller.enqueue(encoder.encode(chunk));
            }
          } catch {
            controller.enqueue(
              encoder.encode("\n\n_(review truncated — stream timed out; partial review saved)_"),
            );
          }
          controller.close();
          await r.done();
          await persist(agentId, currentStatus, acc, projectId, sub, name);
        },
      });
      return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8" } });
    }
  }

  // Fallback stub.
  const text = stubReview(
    agent.name,
    agent.framework,
    agent.challenge?.title,
    tools,
    agent.memory,
    agent.guardrails,
  );
  await persist(
    agent.id,
    agent.status,
    text,
    session.projectId as string,
    session.sub,
    session.name,
  );
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of text.split(/(?<=\n)/)) {
        controller.enqueue(encoder.encode(chunk));
        await new Promise((r) => setTimeout(r, 25));
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8" } });
}

async function persist(
  agentId: string,
  currentStatus: string,
  text: string,
  projectId: string,
  userId: string,
  userName: string,
) {
  await prisma.agentSolution.update({
    where: { id: agentId },
    data: {
      blueprintReview: text,
      status: currentStatus === "draft" ? "blueprint" : currentStatus,
    },
  });
  await prisma.activityLog.create({
    data: {
      projectId,
      userId,
      userType: "participant",
      userName,
      action: "participant.blueprint_reviewed",
      payload: JSON.stringify({ agentId }),
    },
  });
}

function stubReview(
  name: string,
  framework: string,
  challengeTitle: string | undefined,
  tools: string[],
  memory: string,
  guardrails: string,
): string {
  const verdict = guardrails && tools.length >= 2 ? "READY TO BUILD" : "NEEDS REVISION";
  return `## Overall Assessment

This blueprint addresses "${challengeTitle || "the challenge"}" with a ${framework} agent. ${
    verdict === "READY TO BUILD"
      ? "The scope is reasonable, the tool set is coherent, and the guardrails are explicit. You can start coding."
      : "The scope and instrumentation need tightening before you start coding — see below."
  }

Verdict: **${verdict}**

## What's Working Well
- Choice of ${framework} fits the workflow shape implied by your inputs.
- Tool selection (${tools.slice(0, 3).join(", ") || "—"}) covers the obvious calls.
- ${guardrails ? "You've thought about guardrails up front." : "Clear separation of inputs and outputs."}

## What Needs Work
- **Scope**: Be ruthless about narrowing for week 4 — pick the 70% case and ignore the rest.
- **Tool descriptions**: Each tool needs a concrete description and example input.
- **Memory & state**: ${memory ? "Spell out lifecycle: when does state get cleared?" : "Memory is empty — define what (if anything) the agent remembers across runs."}
- **Failure modes**: What does the agent do when an upstream API is down or slow?

## Critical Risks
- LLM hallucination at high autonomy levels — keep a confidence threshold for human handoff.
- Data freshness can silently degrade quality.

## Recommended Next Steps
1. Write a one-page system prompt explicitly anchoring the agent's role.
2. Add at least one example invocation in your blueprint (input → expected behavior).
3. Define a simple eval: 10 representative inputs you'll regress against.
4. Add a "fall back to human" tool with a clear trigger.
5. Cut the scope by 20% and re-read — usually still too broad.

## Sia Engineer's Take

Solid bones. Tighten scope first, write the prompt next, then code. You're closer than you think — focus the next two days on the system prompt and the eval set, and you'll be coding by Friday.
`;
}
