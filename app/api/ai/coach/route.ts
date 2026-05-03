import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { isClaudeConfigured, streamText } from "@/lib/ai/claude";
import * as P from "@/lib/ai/prompts/coachChat";
import { phaseForWeek, PHASE_LABEL } from "@/lib/program";
import { safeJson } from "@/lib/utils";

/**
 * BRD Section 7.7 — AI Coach (PROMPT 5). Streams sonnet responses with a
 * dynamic context block embedded in the system prompt.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { message, currentPage } = await req.json().catch(() => ({}));
  if (!message) return new Response("message required", { status: 400 });

  if (session.role === "participant") {
    await prisma.coachMessage
      .create({ data: { participantId: session.sub, role: "user", content: String(message) } })
      .catch(() => {});
  }

  // Build the dynamic context block from the participant's current state.
  let contextSystemPrompt = "";
  let projectId: string | null = null;
  if (session.role === "participant") {
    const participant = await prisma.participant.findUnique({
      where: { id: session.sub },
      include: {
        project: true,
        team: {
          include: {
            members: true,
            challenge: true,
            agents: true,
          },
        },
      },
    });
    if (!participant) return new Response("Participant not found", { status: 404 });
    projectId = participant.projectId;
    const phase = phaseForWeek(participant.project.programWeek);
    const agent = participant.team?.agents?.[0];
    const tools = safeJson<string[]>(agent?.tools || null, []);
    const blueprintSummary = agent
      ? `${agent.name} — ${agent.framework} on ${agent.llm}. Tools: ${tools.join(", ") || "(none)"}. Status: ${agent.status}.`
      : null;
    const recent = await prisma.activityLog.findMany({
      where: { projectId: participant.projectId, userId: participant.id },
      orderBy: { timestamp: "desc" },
      take: 3,
    });
    contextSystemPrompt = P.systemPromptFor({
      userName: participant.name,
      jobTitle: participant.jobTitle,
      clientOrgName: participant.project.clientOrgName,
      programWeek: participant.project.programWeek,
      phase: PHASE_LABEL[phase],
      teamName: participant.team?.name ?? null,
      teamMemberCount: participant.team?.members.length ?? 0,
      challengeTitle: participant.team?.challenge?.title ?? null,
      challengeDescription: participant.team?.challenge?.description ?? null,
      blueprintSummary,
      currentPage: currentPage || null,
      recentActions: recent.map((r) => r.action),
    });
  } else {
    contextSystemPrompt = P.systemPromptFor({
      userName: session.name,
      clientOrgName: "(internal)",
      programWeek: 1,
      phase: "Discovery",
    });
  }

  const encoder = new TextEncoder();

  if (isClaudeConfigured()) {
    const r = await streamText({
      feature: "coachChat",
      projectId,
      model: P.model,
      systemPrompt: contextSystemPrompt,
      userMessage: P.buildUserMessage(String(message)),
      maxTokens: P.maxTokens,
      temperature: P.temperature,
    });
    if (r.ok) {
      let acc = "";
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of r.stream) {
              acc += chunk;
              controller.enqueue(encoder.encode(chunk));
            }
          } catch {
            // Anthropic stream idle-timeout / network blip — keep the
            // partial response visible and signal a soft truncation to
            // the participant.
            controller.enqueue(
              encoder.encode("\n\n_(coach reply truncated — stream timed out, partial response shown)_"),
            );
          }
          controller.close();
          await r.done();
          await persistAssistant(session, acc, projectId);
        },
      });
      return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8" } });
    }
  }

  // Fallback canonical reply
  const reply = canonicalCoachReply(String(message), currentPage);
  await persistAssistant(session, reply, projectId);
  const stream = new ReadableStream({
    async start(controller) {
      const words = reply.split(/(\s+)/);
      for (const w of words) {
        controller.enqueue(encoder.encode(w));
        await new Promise((r) => setTimeout(r, 20));
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8" } });
}

async function persistAssistant(
  session: { sub: string; role: string; name: string; projectId?: unknown },
  content: string,
  projectId: string | null,
) {
  if (session.role === "participant") {
    await prisma.coachMessage
      .create({ data: { participantId: session.sub, role: "assistant", content } })
      .catch(() => {});
    await prisma.activityLog
      .create({
        data: {
          projectId: (session.projectId as string | undefined) ?? projectId ?? null,
          userId: session.sub,
          userType: "participant",
          userName: session.name,
          action: "participant.coach_message",
          payload: JSON.stringify({ chars: content.length }),
        },
      })
      .catch(() => {});
  }
}

function canonicalCoachReply(msg: string, page?: string | null): string {
  const lower = msg.toLowerCase();
  if (lower.includes("guardrail") || lower.includes("restricted") || lower.includes("safety")) {
    return [
      "Good instinct to think about guardrails before you ship.",
      "Three concrete patterns work well in practice:",
      "",
      "1. **Allowlist tools.** The agent can only call functions you registered.",
      "2. **Confidence threshold.** Every action above threshold is logged for human review; below it the agent escalates.",
      "3. **Out-of-policy classifier.** A small fast model inspects each input before the main agent ever sees it.",
      "",
      "For your case specifically: tag the no-fly-zone check as a *required* tool — the agent cannot conclude without calling it.",
    ].join("\n");
  }
  if (lower.includes("scope") || lower.includes("narrow") || lower.includes("cut")) {
    return "Pick the 70% case — the routine one — and ignore the rest for now. Anything that needs human judgment, escalate. You'll add the harder slices in version 2.";
  }
  if (lower.includes("framework")) {
    return "Pick whichever framework you can debug fastest. LangGraph for stateful workflows; Claude Agents SDK for single-entrypoint tool use; CrewAI for genuine multi-agent.";
  }
  if (lower.includes("roi") || lower.includes("business case") || lower.includes("savings")) {
    return "Anchor every number to an assumption you can show on slide. CFOs eat soft numbers for breakfast.";
  }
  if (lower.includes("prompt")) {
    return "The system prompt is the agent's job description. State the role, the tools, what to do when uncertain, and what *never* to do. Keep it boring.";
  }
  return [
    `Here's how I'd think about that.${page ? ` (You're on **${page}**.)` : ""}`,
    "",
    "First, what does success look like for *this* week — not the whole program. Be specific.",
    "Second, what's the smallest thing you could ship by Friday that proves the idea? Build that.",
    "Third, what's the one assumption that, if wrong, kills the project? Test it first.",
  ].join("\n");
}
