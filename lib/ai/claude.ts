/**
 * Centralized Anthropic Claude client wrapper.
 *
 * Implements the architecture rules from BRD Section 7.1:
 * - Env var: ANTHROPIC_API_KEY
 * - Default models per Section 7.1 (overridable via env)
 * - Structured-JSON helper for all features that need a JSON response
 * - Streaming helper for chat (AI Coach, blueprint review)
 * - Token cap enforcement (passed by each prompt module)
 * - Caching: caller is responsible for DB lookup; this client never caches
 * - Error handling: every call returns either {ok:true,...} or
 *   {ok:false, error}, never throws to the route handler
 * - Cost logging: writes one AiCallLog row per call
 */
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";

export const MODELS = {
  // Defaults per BRD Section 7.1 (Section 7.2 model table). The BRD names
  // them as "claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5";
  // the Anthropic API uses date-stamped IDs for haiku — we keep the BRD
  // names as env-overridable defaults but resolve haiku to the real ID
  // so a live ANTHROPIC_API_KEY won't 400 on us.
  opus: process.env.CLAUDE_MODEL_OPUS || "claude-opus-4-7",
  sonnet: process.env.CLAUDE_MODEL_SONNET || "claude-sonnet-4-6",
  haiku: process.env.CLAUDE_MODEL_HAIKU || "claude-haiku-4-5-20251001",
} as const;

let _client: Anthropic | null = null;
function client(): Anthropic | null {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  _client = new Anthropic({ apiKey: key });
  return _client;
}

export function isClaudeConfigured(): boolean {
  const k = process.env.ANTHROPIC_API_KEY;
  if (!k) return false;
  // Reject obvious placeholders ("sk-ant-...") — those would fail with 401
  // and we'd rather route to the stub than half-stream a broken reply.
  if (k.includes("...") || k.length < 20) return false;
  return true;
}

// Pricing (USD per 1M tokens) — best-effort estimates used for the
// cross-project cost log. Values are approximate; tune as needed.
const PRICING: Record<string, { in: number; out: number }> = {
  "claude-opus-4-7": { in: 15, out: 75 },
  "claude-sonnet-4-6": { in: 3, out: 15 },
  "claude-haiku-4-5": { in: 0.8, out: 4 },
};

function estimateCost(model: string, inputTok: number, outputTok: number): number {
  const p =
    PRICING[model] ||
    Object.entries(PRICING).find(([k]) => model.startsWith(k.split("-").slice(0, 3).join("-")))?.[1] ||
    { in: 5, out: 15 };
  return (inputTok * p.in + outputTok * p.out) / 1_000_000;
}

export interface JsonCallInput {
  feature: string;
  projectId?: string | null;
  model: string;
  systemPrompt: string;
  userMessage: string;
  maxTokens: number;
  temperature: number;
}

export interface JsonCallResult<T> {
  ok: boolean;
  data?: T;
  raw?: string;
  error?: string;
}

/**
 * Run a JSON-output completion. Caller passes the parsed-output type.
 * Returns parsed JSON on success; on failure returns raw text + error so
 * the route can show a friendly error and log raw response (Section 7.1
 * "log the raw response to the activity log for debugging").
 */
export async function generateJson<T>(
  input: JsonCallInput,
  parse: (raw: string) => T,
): Promise<JsonCallResult<T>> {
  const c = client();
  if (!c) return { ok: false, error: "ANTHROPIC_API_KEY not configured" };
  try {
    const msg = await c.messages.create({
      model: input.model,
      max_tokens: input.maxTokens,
      temperature: input.temperature,
      system: input.systemPrompt,
      messages: [{ role: "user", content: input.userMessage }],
    });
    const raw = textFromMessage(msg);
    const inTok = msg.usage?.input_tokens ?? 0;
    const outTok = msg.usage?.output_tokens ?? 0;
    await logCall(input, "ok", inTok, outTok);
    try {
      const cleaned = stripCodeFences(raw);
      const data = parse(cleaned);
      return { ok: true, data, raw };
    } catch (e) {
      await prisma.activityLog
        .create({
          data: {
            projectId: input.projectId ?? null,
            userType: "system",
            action: "ai.parse_error",
            payload: JSON.stringify({
              feature: input.feature,
              error: (e as Error).message,
              rawSnippet: raw.slice(0, 800),
            }),
          },
        })
        .catch(() => {});
      return { ok: false, error: "Could not parse AI output", raw };
    }
  } catch (e) {
    const msg = errorMessage(e);
    await logCall(input, "error", 0, 0, msg);
    return { ok: false, error: msg };
  }
}

/**
 * Run a streaming completion. Returns an async iterator of text chunks
 * plus a `done()` finalizer that runs after the stream closes — used to
 * log usage. The caller is expected to write chunks to the response body
 * as they arrive.
 */
export async function streamText(input: JsonCallInput): Promise<
  | { ok: true; stream: AsyncGenerator<string>; done: () => Promise<void> }
  | { ok: false; error: string }
> {
  const c = client();
  if (!c) return { ok: false, error: "ANTHROPIC_API_KEY not configured" };
  try {
    const stream = c.messages.stream({
      model: input.model,
      max_tokens: input.maxTokens,
      temperature: input.temperature,
      system: input.systemPrompt,
      messages: [{ role: "user", content: input.userMessage }],
    });
    let inTok = 0;
    let outTok = 0;

    // Peek the first event to surface auth / model-not-found / rate-limit
    // errors BEFORE the route writes the streamed response. If the first
    // event throws, we return {ok:false} so the route falls back to its
    // stub instead of half-streaming a broken reply.
    const sIter = stream[Symbol.asyncIterator]();
    let first: IteratorResult<Anthropic.MessageStreamEvent>;
    try {
      first = await sIter.next();
    } catch (e) {
      const msg = errorMessage(e);
      await logCall(input, "error", 0, 0, msg);
      return { ok: false, error: msg };
    }
    if (first.done) {
      return { ok: false, error: "Empty stream from Anthropic API" };
    }

    function record(event: Anthropic.MessageStreamEvent): string | null {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        return event.delta.text;
      }
      if (event.type === "message_delta" && event.usage) {
        outTok += event.usage.output_tokens || 0;
      }
      if (event.type === "message_start" && event.message.usage) {
        inTok = event.message.usage.input_tokens || 0;
      }
      return null;
    }

    async function* iter() {
      const t0 = record(first.value);
      if (t0) yield t0;
      try {
        while (true) {
          const r = await sIter.next();
          if (r.done) break;
          const t = record(r.value);
          if (t) yield t;
        }
      } catch (e) {
        // Stream interrupted mid-flight — log and stop yielding.
        await logCall(input, "error", inTok, outTok, errorMessage(e));
      }
    }
    return {
      ok: true,
      stream: iter(),
      done: async () => {
        await logCall(input, "ok", inTok, outTok);
      },
    };
  } catch (e) {
    const msg = errorMessage(e);
    await logCall(input, "error", 0, 0, msg);
    return { ok: false, error: msg };
  }
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return "Unknown API error";
  }
}

function textFromMessage(msg: Anthropic.Message): string {
  const parts = msg.content
    .map((c) => (c.type === "text" ? c.text : ""))
    .filter(Boolean);
  return parts.join("");
}

/**
 * Strip ```json fences and any preamble Claude might add despite the
 * "no fences, no preamble" instruction. Defensive parsing per Section 7.1.
 */
export function stripCodeFences(raw: string): string {
  let s = raw.trim();
  // Common preambles Claude sometimes adds despite instructions.
  s = s.replace(/^[^{[]*(```(?:json)?\s*)?/, "").trim();
  if (s.startsWith("```")) s = s.replace(/^```(?:json)?\s*/, "").trim();
  if (s.endsWith("```")) s = s.replace(/```\s*$/, "").trim();
  // Trim anything after the last closing brace/bracket.
  const lastBrace = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
  if (lastBrace > 0) s = s.slice(0, lastBrace + 1);
  return s;
}

async function logCall(
  input: JsonCallInput,
  status: "ok" | "error",
  inTok: number,
  outTok: number,
  err?: string,
) {
  await prisma.aiCallLog
    .create({
      data: {
        projectId: input.projectId ?? null,
        feature: input.feature,
        model: input.model,
        inputTokens: inTok,
        outputTokens: outTok,
        estimatedCost: estimateCost(input.model, inTok, outTok),
        status,
        errorMessage: err ?? null,
      },
    })
    .catch(() => {});
}
