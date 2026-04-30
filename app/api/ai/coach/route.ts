import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

/**
 * STUB for M5. PROMPT 5 (Section 7.7) — AI Coach.
 * M6 swaps in the real streaming Claude call (sonnet-4-6).
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { message, currentPage } = await req.json().catch(() => ({}));
  if (!message) return new Response("message required", { status: 400 });

  // Persist user message + (will persist assistant after streaming).
  if (session.role === "participant") {
    await prisma.coachMessage
      .create({
        data: { participantId: session.sub, role: "user", content: String(message) },
      })
      .catch(() => {});
  }

  const reply = canonicalCoachReply(String(message), currentPage);

  if (session.role === "participant") {
    await prisma.coachMessage
      .create({
        data: { participantId: session.sub, role: "assistant", content: reply },
      })
      .catch(() => {});
    await prisma.activityLog.create({
      data: {
        projectId: session.projectId as string,
        userId: session.sub,
        userType: "participant",
        userName: session.name,
        action: "participant.coach_message",
        payload: JSON.stringify({ chars: reply.length }),
      },
    }).catch(() => {});
    await prisma.aiCallLog.create({
      data: {
        projectId: session.projectId as string,
        feature: "coachChat",
        model: "stub",
        status: "ok",
      },
    }).catch(() => {});
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Stream word by word so the UI feels live.
      const words = reply.split(/(\s+)/);
      for (const w of words) {
        controller.enqueue(encoder.encode(w));
        await new Promise((r) => setTimeout(r, 20));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

function canonicalCoachReply(msg: string, page?: string | null): string {
  const lower = msg.toLowerCase();
  if (lower.includes("guardrail") || lower.includes("restricted") || lower.includes("safety")) {
    return [
      "Good instinct to think about guardrails before you ship.",
      "Three concrete patterns work well in practice:",
      "",
      "1. **Allowlist tools.** The agent can only call functions you registered. No 'execute arbitrary code'.",
      "2. **Confidence threshold.** Every action above threshold is logged for human review; below it the agent escalates with the full chain of reasoning.",
      "3. **Out-of-policy classifier.** A small fast model (Haiku) inspects each input before the main agent ever sees it. Reject the obviously bad stuff cheaply.",
      "",
      "For your case specifically: tag the no-fly-zone check as a *required* tool — the agent cannot conclude without calling it — and write an eval where the input pretends to be in a restricted zone. If the agent ever returns 'approve' on that eval, your guardrails aren't tight enough.",
    ].join("\n");
  }
  if (lower.includes("scope") || lower.includes("narrow") || lower.includes("cut")) {
    return "Scope is where most teams sink. Pick the 70% case — the routine one — and ignore the rest for now. Anything that needs a human's judgment, escalate. You'll add the harder slices in version 2. Right now, narrower is faster to ship and easier to defend.";
  }
  if (lower.includes("framework")) {
    return "Pick whichever framework you can debug fastest. LangGraph is great for stateful workflows; Claude Agents SDK is great when you want a single entrypoint with tool use. CrewAI shines for genuinely multi-agent setups — but be honest, do you really need multi-agent in week 4? Probably not.";
  }
  if (lower.includes("roi") || lower.includes("business case") || lower.includes("savings")) {
    return "Anchor every number to an assumption you can show on slide. 'We save 400 hours' becomes 'we save 400 hours assuming 50% adoption in year 1, based on baseline cycle time of 9 days from the operations dashboard'. CFOs eat soft numbers for breakfast.";
  }
  if (lower.includes("prompt")) {
    return "The system prompt is the agent's job description. State the role, the tools, what to do when uncertain, and what *never* to do. Keep it boring. Save flair for the user-facing output.";
  }
  return [
    `Here's how I'd think about that.${page ? ` (You're on **${page}**.)` : ""}`,
    "",
    "First, what does success look like for *this* week — not the whole program. Be specific.",
    "Second, what's the smallest thing you could ship by Friday that proves the idea? Build that.",
    "Third, what's the one assumption that, if wrong, kills the project? Test it first.",
    "",
    "Tell me which of those three you want to go deeper on and I'll help you draft it.",
  ].join("\n");
}
