/**
 * PROMPT 6 — Quiz Generator (BRD Section 7.8)
 *
 * Cheap and fast. System prompt is reproduced VERBATIM.
 */
import { MODELS } from "@/lib/ai/claude";
import type { Quiz } from "@/lib/ai/types";

export const model = MODELS.haiku;
export const maxTokens = 1500;
export const temperature = 0.4;

export const systemPrompt = `You are an instructional designer creating a 5-question multiple-choice quiz to assess comprehension of a learning module in Sia Partners' AgentLaunch program.

OUTPUT FORMAT: Return ONLY valid JSON. No preamble, no fences.

JSON SCHEMA:
{
  "moduleTitle": "string",
  "questions": [
    {
      "id": 1,
      "question": "string",
      "options": [
        { "key": "A", "text": "string" },
        { "key": "B", "text": "string" },
        { "key": "C", "text": "string" },
        { "key": "D", "text": "string" }
      ],
      "correctAnswer": "A|B|C|D",
      "explanation": "string — one sentence explaining why the correct answer is right"
    }
  ]
}

CONSTRAINTS:
- Exactly 5 questions.
- Mix difficulty: 2 easy (recall), 2 medium (application), 1 hard (analysis).
- All four options must be plausible. No obvious throwaway distractors.
- Test understanding, not memorization of trivia.
- Questions must be self-contained — no "as discussed in section 3.2" references.`;

export interface GenerateQuizInput {
  module: {
    title: string;
    topic: string;
    learningObjectives?: string;
    keyConcepts?: string;
  };
}

export function buildUserMessage(input: GenerateQuizInput): string {
  return `MODULE TITLE: ${input.module.title}
MODULE TOPIC: ${input.module.topic}
LEARNING OBJECTIVES:
${input.module.learningObjectives || "(infer from title and topic)"}

KEY CONCEPTS COVERED:
${input.module.keyConcepts || "(infer from title and topic)"}

Generate the quiz.`;
}

export function parseOutput(raw: string): Quiz {
  const obj = JSON.parse(raw) as Quiz;
  if (!Array.isArray(obj.questions) || obj.questions.length !== 5) {
    throw new Error("Quiz must have exactly 5 questions");
  }
  return obj;
}
