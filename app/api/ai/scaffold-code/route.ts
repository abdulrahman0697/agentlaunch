import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { safeJson } from "@/lib/utils";

/**
 * STUB for M5. PROMPT 3 (Section 7.5) — Code Scaffolding Generator.
 * M6 replaces the body with the real Claude call; this returns a
 * runnable LangGraph/LangChain skeleton so the UI is demonstrable.
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
  const tools = safeJson<string[]>(agent.tools, []);
  const code = `### Project Structure
\`\`\`
${slugify(agent.name)}/
  ├── requirements.txt
  ├── .env.example
  ├── agent.py
  ├── tools.py
  ├── prompts.py
  └── README.md
\`\`\`

### File: requirements.txt
\`\`\`txt
${frameworkRequirements(agent.framework)}
python-dotenv==1.0.1
pydantic==2.9.2
\`\`\`

### File: .env.example
\`\`\`bash
# Anthropic API key (https://console.anthropic.com)
ANTHROPIC_API_KEY=
# Model — defaults to ${agent.llm}
LLM_MODEL=${agent.llm}
\`\`\`

### File: agent.py
\`\`\`python
"""${agent.name} — entrypoint.

Built for: ${agent.challenge?.title}
Framework: ${agent.framework}
Purpose: ${agent.purpose || "TODO: describe in one sentence."}
"""
from __future__ import annotations
import os, logging
from dotenv import load_dotenv
from prompts import SYSTEM_PROMPT
from tools import TOOLS

load_dotenv()
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("${slugify(agent.name)}")

${frameworkSkeleton(agent.framework)}

if __name__ == "__main__":
    # Minimal example invocation
    sample_input = "TODO: paste a realistic input here"
    out = run(sample_input)
    print(out)
\`\`\`

### File: tools.py
\`\`\`python
"""Custom tools the agent can call.

The blueprint listed: ${tools.join(", ") || "(none)"}
Each tool must return a STRING that the agent can reason about.
"""
from typing import Any

${toolStubs(tools)}

TOOLS = [
${tools.map((t) => `    ${slugify(t).replace(/-/g, "_")},`).join("\n") || "    # add tools here"}
]
\`\`\`

### File: prompts.py
\`\`\`python
SYSTEM_PROMPT = """
You are an AI agent for ${agent.challenge?.title}.
Your purpose: ${agent.purpose}.

Always:
- Cite the exact tool you used to ground each claim.
- If you are uncertain, return a structured "needs_human_review" message
  rather than guessing.

Never:
- Take actions outside the listed tool set.
- Disclose internal reasoning to the end user.
"""
\`\`\`

### File: README.md
\`\`\`markdown
# ${agent.name}

## Setup
1. \`python -m venv .venv && source .venv/bin/activate\`
2. \`pip install -r requirements.txt\`
3. \`cp .env.example .env\` and fill in \`ANTHROPIC_API_KEY\`
4. \`python agent.py\`

## Iterating
- Edit \`prompts.py\` to refine behavior.
- Add real implementations in \`tools.py\`.
- Add unit tests under \`tests/\`.
\`\`\`

### Quick Start
1. Clone or download this directory.
2. Create a virtualenv and install requirements.
3. Add your \`ANTHROPIC_API_KEY\` to \`.env\`.
4. Replace the \`TODO\` blocks in \`tools.py\` with real implementations.
5. Run \`python agent.py\` and iterate from there.
`;

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
  await prisma.aiCallLog.create({
    data: {
      projectId: session.projectId as string,
      feature: "scaffoldCode",
      model: "stub",
      status: "ok",
    },
  });

  return NextResponse.json({ code });
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
    log.info("parsing request")
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
  if (fw === "Claude Agents SDK") {
    return `from anthropic import Anthropic
client = Anthropic()

def run(request: str) -> str:
    msg = client.messages.create(
        model=os.getenv("LLM_MODEL"),
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role":"user","content":request}],
        tools=TOOLS,
    )
    return msg.content[0].text`;
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
    """${t}. TODO: implement.

    Replace this stub with the real call.
    """
    return f"[stub: ${t} called with {input}]"
`,
    )
    .join("\n");
}
