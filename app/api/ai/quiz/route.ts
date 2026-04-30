import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { isClaudeConfigured, generateJson } from "@/lib/ai/claude";
import * as P from "@/lib/ai/prompts/generateQuiz";
import type { Quiz } from "@/lib/ai/types";

/**
 * BRD Section 7.8 — Quiz Generator (PROMPT 6). Cached on resource row.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { resourceId } = await req.json();
  if (!resourceId) return NextResponse.json({ error: "resourceId required" }, { status: 400 });

  const resource = await prisma.learningResource.findUnique({ where: { id: resourceId } });
  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (resource.cachedQuiz) {
    return NextResponse.json({ quiz: JSON.parse(resource.cachedQuiz) as Quiz, cached: true });
  }

  let quiz: Quiz | null = null;
  if (isClaudeConfigured()) {
    const userMessage = P.buildUserMessage({
      module: { title: resource.title, topic: resource.topic },
    });
    const r = await generateJson<Quiz>(
      {
        feature: "generateQuiz",
        projectId: (session.projectId as string) || null,
        model: P.model,
        systemPrompt: P.systemPrompt,
        userMessage,
        maxTokens: P.maxTokens,
        temperature: P.temperature,
      },
      P.parseOutput,
    );
    if (r.ok && r.data) quiz = r.data;
  }
  if (!quiz) quiz = stubQuiz(resource.title, resource.topic);

  await prisma.learningResource.update({
    where: { id: resourceId },
    data: { cachedQuiz: JSON.stringify(quiz) },
  });
  return NextResponse.json({ quiz });
}

function stubQuiz(title: string, topic: string): Quiz {
  return {
    moduleTitle: title,
    questions: [
      { id: 1, question: `Which best describes "agentic AI" as covered in "${title}"?`, options: [{ key: "A", text: "Any system that uses an LLM" }, { key: "B", text: "An LLM that can plan, invoke tools, and act over multiple steps" }, { key: "C", text: "A chatbot with no tool use" }, { key: "D", text: "A scheduled cron job" }], correctAnswer: "B", explanation: "Agentic systems plan and act; chatbots without tool use don't qualify." },
      { id: 2, question: "Which of these is a tool (in the agent-building sense)?", options: [{ key: "A", text: "A function the LLM can call to fetch external data or take an action" }, { key: "B", text: "The LLM's hidden state vector" }, { key: "C", text: "A persona description" }, { key: "D", text: "A logging library" }], correctAnswer: "A", explanation: "Tools are callable functions the agent can invoke during reasoning." },
      { id: 3, question: `For a high-stakes ${topic.toLowerCase()} use case, the best first guardrail is:`, options: [{ key: "A", text: "Increase model temperature" }, { key: "B", text: "Reduce system prompt length" }, { key: "C", text: "Require human review above a confidence threshold" }, { key: "D", text: "Disable logging" }], correctAnswer: "C", explanation: "Confidence-thresholded human review is the canonical safety pattern." },
      { id: 4, question: "When is multi-agent justified over single-agent?", options: [{ key: "A", text: "Always — multi-agent is more impressive" }, { key: "B", text: "When tasks genuinely require parallel specialization with shared coordination" }, { key: "C", text: "When you have a small dataset" }, { key: "D", text: "Only when prompted to" }], correctAnswer: "B", explanation: "Multi-agent is justified by genuine specialization and coordination needs, not novelty." },
      { id: 5, question: "Strongest signal that an agent's scope is too broad?", options: [{ key: "A", text: "It produces long answers" }, { key: "B", text: "It calls tools occasionally" }, { key: "C", text: "It hallucinates capabilities it doesn't have" }, { key: "D", text: "It runs slowly on first call" }], correctAnswer: "C", explanation: "Scope creep manifests as the agent claiming abilities it cannot actually execute." },
    ],
  };
}
