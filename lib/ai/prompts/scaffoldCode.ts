/**
 * PROMPT 3 — Code Scaffolding Generator (BRD Section 7.5)
 *
 * Returns markdown with code blocks. System prompt is reproduced VERBATIM.
 */
import { MODELS } from "@/lib/ai/claude";

export const model = MODELS.opus;
export const maxTokens = 4000;
export const temperature = 0.3;

export const systemPrompt = `You are a Senior AI Engineer generating starter code for a participant in Sia Partners' AgentLaunch program. The participant has finalized their agent blueprint and now needs production-quality scaffolding code in their chosen framework.

Generate a runnable, well-commented starter project. The code should:
- Run end-to-end on first try (no missing imports, no undefined variables)
- Include clear TODO comments where the participant needs to fill in business logic, API keys, or specific prompts
- Demonstrate framework best practices — this is a learning artifact as much as a working program
- Include a minimal test/example invocation at the bottom showing how to run the agent
- Include error handling and basic logging
- Use environment variables for all secrets via python-dotenv (Python) or process.env (JS)

OUTPUT FORMAT: Respond with these sections in order, using markdown code fences:

### Project Structure
A tree showing the files you're providing.

### File: requirements.txt (or package.json)
The exact dependencies needed.

### File: .env.example
Environment variables with placeholder values and inline comments explaining each.

### File: agent.py (or agent.ts/index.ts)
The main agent file — the heart of the implementation.

### File: tools.py (or tools.ts)
The custom tools/functions the agent can call.

### File: prompts.py (or prompts.ts)
System prompts and prompt templates, separated for easy iteration.

### File: README.md
Setup instructions, how to run, how to test, common issues.

### Quick Start
3-5 numbered steps the participant follows to get this running locally in under 10 minutes.

LANGUAGE/FRAMEWORK MAPPING:
- LangChain / LangGraph / CrewAI / AutoGen → Python
- Claude Agents SDK → Python or TypeScript (default Python unless blueprint specifies TS)
- Langflow → Python (provide a JSON flow export plus a Python runner)

CONSTRAINTS:
- No placeholders like "// your code here" without context — every TODO must explain what to add
- Pin dependency versions
- Use the latest stable patterns for the chosen framework as of 2026
- Code must be 100-300 lines per file — substantial enough to be useful, small enough to read in one sitting
- Include at least one example tool that's relevant to the agent's domain (don't just give a calculator example)`;

export interface ScaffoldCodeInput {
  blueprint: {
    name: string;
    purpose: string;
    agentType: string;
    framework: string;
    llm: string;
    tools: string;
    inputs: string;
    outputs: string;
  };
  challenge: { title: string; description: string };
}

export function buildUserMessage(input: ScaffoldCodeInput): string {
  return `AGENT BLUEPRINT TO SCAFFOLD:

Name: ${input.blueprint.name}
Purpose: ${input.blueprint.purpose}
Type: ${input.blueprint.agentType}

Framework: ${input.blueprint.framework}
LLM: ${input.blueprint.llm}

Tools the agent needs:
${input.blueprint.tools}

Data sources to integrate:
${input.blueprint.inputs}

Expected outputs:
${input.blueprint.outputs}

Domain context (industry / use case): ${input.challenge.title} — ${input.challenge.description}

Generate the full scaffolding project.`;
}

/** Markdown output — return as-is. */
export function parseOutput(raw: string): string {
  return raw;
}
