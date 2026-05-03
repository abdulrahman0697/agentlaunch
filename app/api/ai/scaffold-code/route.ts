import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { isClaudeConfigured, generateJson } from "@/lib/ai/claude";
import * as P from "@/lib/ai/prompts/scaffoldCode";
import { safeJson } from "@/lib/utils";

/**
 * BRD Section 7.5 — Code Scaffolding Generator (PROMPT 3).
 * Returns markdown with code fences. Falls back to a stub when no key.
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
    include: { team: true, challenge: true },
  });
  if (!agent || agent.team.projectId !== session.projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!agent.challenge) return NextResponse.json({ error: "No challenge" }, { status: 400 });

  const tools = safeJson<string[]>(agent.tools, []);
  const inputs = safeJson<string[]>(agent.inputs, []);
  const outputs = safeJson<string[]>(agent.outputs, []);

  let code: string | null = null;
  if (isClaudeConfigured()) {
    const userMessage = P.buildUserMessage({
      blueprint: {
        name: agent.name,
        purpose: agent.purpose,
        agentType: agent.agentType,
        framework: agent.framework,
        llm: agent.llm,
        tools: tools.join("\n- ") || "(none)",
        inputs: inputs.join("\n- ") || "(none)",
        outputs: outputs.join("\n- ") || "(none)",
      },
      challenge: {
        title: agent.challenge.title,
        description: agent.challenge.description,
      },
    });
    // Markdown response — generateJson() expects JSON, but we can use the
    // same call path with an identity parser since we don't try to parse.
    const r = await generateJson<string>(
      {
        feature: "scaffoldCode",
        projectId: session.projectId as string,
        model: P.model,
        systemPrompt: P.systemPrompt,
        userMessage,
        maxTokens: P.maxTokens,
        temperature: P.temperature,
      },
      // raw is the message text (already stripped of fences); for code
      // scaffolds we want the raw original including code fences, so
      // catch the parse and return the unstripped raw.
      () => "",
    );
    if (r.raw) code = r.raw;
  }
  if (!code) code = stubScaffold(agent.name, agent.framework, agent.llm, agent.purpose, agent.challenge.title, tools);

  await prisma.agentSolution.update({
    where: { id: agentId },
    data: {
      scaffoldCode: code,
      status: agent.status === "draft" || agent.status === "blueprint" ? "building" : agent.status,
    },
  });
  await prisma.activityLog.create({
    data: {
      projectId: session.projectId as string,
      userId: session.sub,
      userType: "participant",
      userName: session.name,
      action: "participant.code_scaffolded",
      payload: JSON.stringify({ agentId, framework: agent.framework }),
    },
  });
  return NextResponse.json({ code });
}

function stubScaffold(
  name: string,
  framework: string,
  llm: string,
  purpose: string,
  challengeTitle: string,
  tools: string[],
): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return `### Project Structure
\`\`\`
${slug}/
  ├── requirements.txt
  ├── .env.example
  ├── agent.py
  ├── tools.py
  ├── prompts.py
  └── README.md
\`\`\`

### File: requirements.txt
\`\`\`txt
${frameworkRequirements(framework)}
python-dotenv==1.0.1
pydantic==2.9.2
\`\`\`

### File: .env.example
\`\`\`bash
# Anthropic API key (https://console.anthropic.com)
ANTHROPIC_API_KEY=
LLM_MODEL=${llm}
\`\`\`

### File: agent.py
\`\`\`python
"""${name} — entrypoint.

Built for: ${challengeTitle}
Framework: ${framework}
Purpose: ${purpose || "TODO: describe in one sentence."}
"""
from __future__ import annotations
import os, logging
from dotenv import load_dotenv
from prompts import SYSTEM_PROMPT
from tools import TOOLS

load_dotenv()
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("${slug}")

${frameworkSkeleton(framework)}

if __name__ == "__main__":
    sample_input = "TODO: paste a realistic input here"
    out = run(sample_input)
    print(out)
\`\`\`

### File: tools.py
\`\`\`python
${toolStubs(tools)}

TOOLS = [
${tools.map((t) => `    ${slugify(t).replace(/-/g, "_")},`).join("\n") || "    # add tools here"}
]
\`\`\`

### File: prompts.py
\`\`\`python
SYSTEM_PROMPT = """
You are an AI agent for ${challengeTitle}.
Your purpose: ${purpose}.

Always cite the tool you used. If uncertain, return needs_human_review.
"""
\`\`\`

### File: README.md
\`\`\`markdown
# ${name}

## Setup
1. Create venv, \`pip install -r requirements.txt\`
2. Copy .env.example to .env and add ANTHROPIC_API_KEY
3. \`python agent.py\`
\`\`\`

### Quick Start
1. Clone or download this directory.
2. Create a virtualenv and install requirements.
3. Add your \`ANTHROPIC_API_KEY\` to \`.env\`.
4. Replace the \`TODO\` blocks in \`tools.py\`.
5. Run \`python agent.py\`.
`;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function frameworkRequirements(fw: string): string {
  switch (fw) {
    case "LangGraph":
      return `langgraph==0.2.34\nlangchain-anthropic==0.2.4`;
    case "LangChain":
      return `langchain==0.3.7\nlangchain-anthropic==0.2.4`;
    case "Claude Agents SDK":
      return `anthropic==0.30.1`;
    case "CrewAI":
      return `crewai==0.80.0\nlangchain-anthropic==0.2.4`;
    case "AutoGen":
      return `autogen-agentchat==0.2.36`;
    default:
      return `anthropic==0.30.1`;
  }
}

function frameworkSkeleton(fw: string): string {
  if (fw === "LangGraph") {
    return `from langgraph.graph import StateGraph, END
from langchain_anthropic import ChatAnthropic
from typing import TypedDict, List

class State(TypedDict):
    request: str
    actions: List[str]
    result: str

llm = ChatAnthropic(model=os.getenv("LLM_MODEL"))

def parse(state: State) -> State:
    state["actions"] = []
    return state

def think(state: State) -> State:
    msg = llm.invoke([("system", SYSTEM_PROMPT), ("user", state["request"])])
    state["result"] = msg.content
    return state

graph = StateGraph(State)
graph.add_node("parse", parse)
graph.add_node("think", think)
graph.set_entry_point("parse")
graph.add_edge("parse", "think")
graph.add_edge("think", END)
app = graph.compile()

def run(request: str) -> str:
    return app.invoke({"request": request, "actions": [], "result": ""})["result"]`;
  }
  return `from anthropic import Anthropic
client = Anthropic()

def run(request: str) -> str:
    msg = client.messages.create(
        model=os.getenv("LLM_MODEL"),
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role":"user","content":request}],
    )
    return msg.content[0].text`;
}

function toolStubs(tools: string[]): string {
  if (!tools.length) return `# TODO: define tools the agent can call.`;
  return tools
    .map(
      (t) => `def ${slugify(t).replace(/-/g, "_")}(input: str) -> str:
    """${t}. TODO: implement."""
    return f"[stub: ${t} called with {input}]"
`,
    )
    .join("\n");
}
