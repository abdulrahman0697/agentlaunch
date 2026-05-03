/**
 * AgentLaunch seed script — implements BRD Section 9 in full.
 *
 * Drops and recreates every table on each run (per Section 9.8) so the
 * dataset stays exactly reproducible. Pre-generated AI outputs come from
 * /prisma/seed-data/ai-outputs/index.ts so the seed never needs to call
 * the live Claude API.
 *
 * Run: `npm run seed` (or `npx prisma db seed`).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  qcaaParticipants,
  mwanParticipants,
  dcParticipants,
} from "./seed-data/people";
import {
  dronePermitAnalysis,
  makeAnalysis,
  sampleRoi,
  samplePitchDeck,
} from "./seed-data/ai-outputs";

const prisma = new PrismaClient();

// All passwords below are demo-only and printed in the README per Section 9.
const HASH = (s: string) => bcrypt.hashSync(s, 10);

// ----- Section 9.2 — Sia Toolbox (full 6-pillar library) -----------------
const TOOLBOX = [
  ["Strategy", "AI Maturity Assessment", "5-dimension diagnostic scoring an org's AI readiness"],
  ["Strategy", "Portfolio Management Toolkit", "Use case prioritization matrix and stage-gate templates"],
  ["Strategy", "AI Vision Workshop Kit", "Facilitator deck + exercises to align leadership on AI ambition"],
  ["Operating Model", "AI Governance Framework", "Policies, RACI, decision rights for AI initiatives"],
  ["Operating Model", "AI Product Management Framework", "End-to-end lifecycle from ideation to retirement"],
  ["Operating Model", "AI Risk & Ethics Charter", "Pre-built ethics review templates"],
  ["Solutions", "Sectorial Use Case Libraries", "200+ pre-mapped use cases by industry"],
  ["Solutions", "AI Capability Benchmark", "Compare your AI capabilities against peers"],
  ["Solutions", "Vendor Landscape Map", "Curated map of agentic AI tools and vendors"],
  ["Skills", "Jobs and Skills Framework", "AI role definitions and competency models"],
  ["Skills", "AI Talent Management Playbook", "Hiring, retention, and upskilling guides"],
  ["Skills", "Career Pathing Toolkit", "Transition paths from traditional to AI-augmented roles"],
  ["Technology and Data", "SiaGPT", "Sia's enterprise GenAI platform"],
  ["Technology and Data", "3rd-Party AI Products Catalog", "Vetted tool stack recommendations"],
  ["Technology and Data", "Benchmark of Market Solutions", "Comparative scoring of LLMs, agent frameworks, vector DBs"],
  ["Culture", "AI 4 All Training Modules", "12 self-paced modules for non-technical staff"],
  ["Culture", "AI Communication & Change Kit", "Templates for announcements, FAQs, town halls"],
  ["Culture", "AI Champion Program Blueprint", "Playbook for building internal AI ambassador networks"],
] as const;

// ----- Section 9.6 — Learning Hub (20 entries) ---------------------------
const LEARNING = [
  ["What is Agentic AI?", "article", "Sia Internal", "Fundamentals", 15, "/learn/articles/what-is-agentic-ai"],
  ["LLMs 101 for Business Leaders", "video", "Sia Internal", "Fundamentals", 25, "/learn/videos/llms-101"],
  ["Anthropic: Prompt Engineering Fundamentals", "course", "Anthropic", "Prompt Engineering", 90, "https://www.anthropic.com/learn/prompt-engineering-interactive-tutorial"],
  ["DeepLearning.AI: ChatGPT Prompt Engineering for Developers", "course", "DeepLearning.AI", "Prompt Engineering", 60, "https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/"],
  ["DeepLearning.AI: AI Agents in Langflow", "course", "DeepLearning.AI", "Frameworks", 120, "https://www.deeplearning.ai/short-courses/"],
  ["DeepLearning.AI: Generative AI for Everyone", "course", "DeepLearning.AI", "Fundamentals", 180, "https://www.deeplearning.ai/courses/generative-ai-for-everyone/"],
  ["LangChain Quickstart", "tutorial", "LangChain", "Frameworks", 45, "https://python.langchain.com/docs/get_started/quickstart"],
  ["LangGraph: Multi-Step Agent Workflows", "tutorial", "LangChain", "Frameworks", 60, "https://langchain-ai.github.io/langgraph/"],
  ["Claude Agents SDK — Getting Started", "tutorial", "Anthropic", "Frameworks", 60, "https://docs.anthropic.com/"],
  ["CrewAI: Multi-Agent Systems", "tutorial", "CrewAI", "Frameworks", 75, "https://docs.crewai.com/"],
  ["AutoGen Conversational Agents", "tutorial", "Microsoft", "Frameworks", 60, "https://microsoft.github.io/autogen/"],
  ["Tool Use & Function Calling Patterns", "article", "Sia Internal", "Building Agents", 30, "/learn/articles/tool-use"],
  ["Agent Memory: Short-Term, Long-Term, Episodic", "article", "Sia Internal", "Building Agents", 25, "/learn/articles/agent-memory"],
  ["Guardrails & Safety in Production Agents", "article", "Sia Internal", "Production", 35, "/learn/articles/guardrails"],
  ["Evaluating Agent Performance", "article", "Sia Internal", "Production", 30, "/learn/articles/evaluating-agents"],
  ["Google Cloud: Generative AI Fundamentals", "certification", "Google Cloud", "Certifications", 240, "https://www.cloudskillsboost.google/paths/118"],
  ["Microsoft AI-900: Azure AI Fundamentals", "certification", "Microsoft", "Certifications", 480, "https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/"],
  ["Building Your First Business Case for AI", "article", "Sia Internal", "Business Case", 25, "/learn/articles/business-case"],
  ["ROI Modeling for AI Projects", "tutorial", "Sia Internal", "Business Case", 40, "/learn/articles/roi-modeling"],
  ["Demo Day: Pitching AI to Leadership", "video", "Sia Internal", "Business Case", 20, "/learn/videos/demo-day"],
] as const;

async function main() {
  // ===== 1. Wipe everything (Section 9.8 — drop & recreate cleanly) =====
  await prisma.activityLog.deleteMany();
  await prisma.coachMessage.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.participantProgress.deleteMany();
  await prisma.aiCallLog.deleteMany();
  await prisma.demoDay.deleteMany();
  await prisma.agentSolution.deleteMany();
  await prisma.challengeComment.deleteMany();
  await prisma.strategicChallenge.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.team.deleteMany();
  await prisma.projectAdmin.deleteMany();
  await prisma.projectToolboxItem.deleteMany();
  await prisma.toolboxItem.deleteMany();
  await prisma.project.deleteMany();
  await prisma.siaAdmin.deleteMany();
  await prisma.learningResource.deleteMany();

  // ===== 2. Section 9.1 — Sia Admins =====
  const khalid = await prisma.siaAdmin.create({
    data: {
      email: "admin@sia-partners.com",
      name: "Khalid El Bachraoui",
      title: "Managing Director — Digital, Data and AI Lead",
      passwordHash: HASH("sia2026"),
    },
  });
  await prisma.siaAdmin.create({
    data: {
      email: "taha@sia-partners.com",
      name: "Taha Belmejdoub",
      title: "Senior Manager — AI Services Lead",
      passwordHash: HASH("sia2026"),
    },
  });

  // ===== 3. Section 9.2 — Toolbox =====
  const toolboxItems: Record<string, string> = {};
  for (const [pillar, name, description] of TOOLBOX) {
    const t = await prisma.toolboxItem.create({
      data: { pillar, name, description },
    });
    toolboxItems[name] = t.id;
  }

  // ===== 4. Section 9.6 — Learning Hub =====
  for (const [title, type, provider, topic, mins, url] of LEARNING) {
    await prisma.learningResource.create({
      data: { title, type, provider, topic, estimatedMinutes: mins, url },
    });
  }

  // ===== 5. Sections 9.3 / 9.4 / 9.5 — Three projects =====
  const qcaa = await createProject({
    name: "Qatar Civil Aviation Authority — AgentLaunch Cohort 1",
    clientOrgName: "Qatar Civil Aviation Authority",
    shortName: "QCAA",
    slug: "qcaa-cohort-1",
    logoUrl: "/seed/logos/qcaa-logo.svg",
    primaryColor: "#8A1538",
    secondaryColor: "#C5A572",
    backgroundAccent: "#F5F0EA",
    welcomeMessage:
      "Welcome, Aviation Champions. Over the next 10 weeks, you'll design and ship AI agents that move QCAA toward a smarter, safer, and more efficient civil aviation ecosystem in Qatar.",
    startDate: new Date("2026-03-09"),
    endDate: new Date("2026-05-18"),
    status: "active",
    cohortSize: 18,
    programWeek: 6,
    createdBy: khalid.id,
    enabledToolbox: [
      "AI Governance Framework",
      "AI Risk & Ethics Charter",
      "Sectorial Use Case Libraries",
      "Benchmark of Market Solutions",
      "AI Champion Program Blueprint",
      "AI 4 All Training Modules",
    ],
    admin: {
      email: "sara.almansoori@caa.gov.qa",
      name: "Sara Al-Mansoori",
      jobTitle: "Director of Strategy & Transformation",
      department: "Office of the President",
      password: "qcaa2026",
    },
  });

  await seedQcaaContent(qcaa, toolboxItems);

  const mwan = await createProject({
    name: "MWAN — AgentLaunch Cohort 1",
    clientOrgName: "National Center for Waste Management (Saudi Arabia)",
    shortName: "MWAN",
    slug: "mwan-cohort-1",
    logoUrl: "/seed/logos/mwan-logo.svg",
    primaryColor: "#0F7B3F",
    secondaryColor: "#FFFFFF",
    backgroundAccent: "#E8F4EC",
    welcomeMessage:
      "Welcome to AgentLaunch. Together we'll design AI agents that help MWAN advance Saudi Arabia's circular economy ambitions under Vision 2030.",
    startDate: new Date("2026-03-23"),
    endDate: new Date("2026-06-01"),
    status: "active",
    cohortSize: 15,
    programWeek: 4,
    createdBy: khalid.id,
    enabledToolbox: [
      "AI Governance Framework",
      "Sectorial Use Case Libraries",
      "AI Maturity Assessment",
      "AI 4 All Training Modules",
    ],
    admin: {
      email: "abdulaziz.alharbi@mwan.gov.sa",
      name: "Abdulaziz Al-Harbi",
      jobTitle: "Head of Innovation & Digital Transformation",
      department: "Innovation",
      password: "mwan2026",
    },
  });

  await seedMwanContent(mwan, toolboxItems);

  const dc = await createProject({
    name: "Dubai Customs — AgentLaunch Cohort 1",
    clientOrgName: "Dubai Customs",
    shortName: "DC",
    slug: "dubai-customs-cohort-1",
    logoUrl: "/seed/logos/dc-logo.svg",
    primaryColor: "#D4A017",
    secondaryColor: "#1B1B3A",
    backgroundAccent: "#FAF6EC",
    welcomeMessage: "Welcome to AgentLaunch — Dubai Customs Cohort 1.",
    startDate: new Date("2025-11-03"),
    endDate: new Date("2026-01-12"),
    status: "completed",
    cohortSize: 20,
    programWeek: 10,
    createdBy: khalid.id,
    enabledToolbox: [
      "AI Governance Framework",
      "Sectorial Use Case Libraries",
      "Vendor Landscape Map",
      "AI Capability Benchmark",
      "Career Pathing Toolkit",
    ],
    admin: {
      email: "mariam.alshamsi@dubaicustoms.ae",
      name: "Mariam Al-Shamsi",
      jobTitle: "Director of Strategy",
      department: "Strategy",
      password: "dc2026",
    },
  });

  await seedDcContent(dc, toolboxItems);

  // ===== 6. Section 9.7 — Cross-project activity (~50 entries) =====
  await seedActivityLog();

  // ===== 7. Summary table =====
  const counts = await summary();
  printSummary(counts);
}

interface ProjectSpec {
  name: string;
  clientOrgName: string;
  shortName: string;
  slug: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundAccent: string;
  welcomeMessage: string;
  startDate: Date;
  endDate: Date;
  status: string;
  cohortSize: number;
  programWeek: number;
  createdBy: string;
  enabledToolbox: string[];
  admin: { email: string; name: string; jobTitle: string; department: string; password: string };
}

async function createProject(s: ProjectSpec) {
  const project = await prisma.project.create({
    data: {
      name: s.name,
      clientOrgName: s.clientOrgName,
      shortName: s.shortName,
      slug: s.slug,
      logoUrl: s.logoUrl,
      primaryColor: s.primaryColor,
      secondaryColor: s.secondaryColor,
      backgroundAccent: s.backgroundAccent,
      welcomeMessage: s.welcomeMessage,
      startDate: s.startDate,
      endDate: s.endDate,
      status: s.status,
      cohortSize: s.cohortSize,
      programWeek: s.programWeek,
      createdBySiaAdminId: s.createdBy,
    },
  });
  await prisma.projectAdmin.create({
    data: {
      email: s.admin.email,
      name: s.admin.name,
      jobTitle: s.admin.jobTitle,
      department: s.admin.department,
      passwordHash: HASH(s.admin.password),
      projectId: project.id,
    },
  });
  // Toolbox assignments — populated lazily once toolboxItems is known.
  return { project, enabledToolbox: s.enabledToolbox };
}

async function assignToolbox(
  projectId: string,
  itemNames: string[],
  toolboxItems: Record<string, string>,
) {
  for (const n of itemNames) {
    const id = toolboxItems[n];
    if (!id) continue;
    await prisma.projectToolboxItem.create({
      data: { projectId, toolboxItemId: id, enabled: true },
    });
  }
}

// ===== QCAA seed content =================================================
async function seedQcaaContent(
  ctx: { project: { id: string }; enabledToolbox: string[] },
  toolboxItems: Record<string, string>,
) {
  const projectId = ctx.project.id;
  await assignToolbox(projectId, ctx.enabledToolbox, toolboxItems);
  const admin = await prisma.projectAdmin.findFirst({ where: { projectId } });

  // Participants
  const participants: Record<string, string> = {};
  for (const p of qcaaParticipants) {
    const created = await prisma.participant.create({
      data: {
        email: p.email,
        name: p.name,
        jobTitle: p.jobTitle,
        department: p.department,
        passwordHash: HASH("qcaa2026"),
        projectId,
        progressStage: p.stage || "discovery",
      },
    });
    participants[p.name] = created.id;
  }

  // Teams
  const teamMap: Record<string, string> = {};
  for (const teamName of ["Team Skyway", "Team Hangar", "Team Tower", "Team Wingspan"]) {
    const t = await prisma.team.create({ data: { name: teamName, projectId } });
    teamMap[teamName] = t.id;
  }
  // Assign participants to teams
  for (const p of qcaaParticipants) {
    await prisma.participant.update({
      where: { id: participants[p.name] },
      data: { teamId: teamMap[p.team] },
    });
  }

  // Challenge 1 — Drone Permit (claimed, full analysis + blueprint + ROI)
  const c1 = await createChallenge(projectId, admin?.id || null, {
    title: "Drone Permit Processing Automation",
    description:
      "QCAA receives a growing volume of drone (UAS) operating permit applications from commercial operators, media companies, government entities, and recreational users. Each application requires manual review of pilot credentials, equipment specs, flight zones, NOTAM conflicts, and security clearance — averaging 9 business days per permit.",
    businessContext:
      "Drone applications have grown 340% in 24 months. Two licensing officers process them manually using legacy forms. Backlog now exceeds 600 applications. Industry stakeholders have escalated complaints to the Ministry.",
    currentPainPoints:
      "- 9-day average turnaround vs. 2-day published SLA\n- Inconsistent decisions between officers\n- No automated checks against no-fly zones, restricted airspace, or NOTAMs\n- Manual back-and-forth via email when applications are incomplete\n- No analytics on rejection patterns or common errors",
    desiredOutcome:
      "Reduce average processing time to ≤2 business days for standard applications, auto-flag complex cases for human review, achieve consistent rule application, and provide applicants with real-time status visibility.",
    departmentTags: ["Personnel Licensing", "Air Navigation Services", "IT"],
    priority: "high",
    status: "claimed",
    analysis: dronePermitAnalysis,
    teamId: teamMap["Team Skyway"],
  });
  await createBlueprint(teamMap["Team Skyway"], c1.id, {
    name: "Permit Triage Agent",
    purpose:
      "Read each drone permit application, run automated checks across pilot DB, NOTAMs, GIS no-fly zones, and security clearance, then classify as auto-approve / needs-review / reject with rationale.",
    framework: "LangGraph",
    llm: "claude-sonnet-4-6",
    tools: ["read_application_pdf", "query_pilot_db", "check_nofly_zones", "query_notams", "classify_complexity", "draft_decision_letter"],
    inputs: ["Application PDFs", "Pilot DB", "NOTAM feed", "GIS no-fly zone API", "Security clearance DB"],
    outputs: ["Decision (auto-approve / needs-review / reject)", "Audit log entry", "Applicant notification draft"],
    memory: "Per-application context only; no cross-applicant state.",
    guardrails:
      "Always call no-fly-zone check; below 0.85 confidence threshold escalate to human reviewer; log every action with rationale for audit.",
    feasibility: 9,
    impact: 8,
    status: "building",
    roi: { ...sampleRoi, timeSavedHours: 4200, costReducedAmount: 315000, assumptions: "9 day → 2 day cycle on 70% of 600 backlog. 1.5 FTE freed at $75/h fully loaded." },
    kpis: ["Cycle time (days)", "Auto-approval rate", "Compliance exception rate", "Inspector hours saved/week"],
    risks: ["GIS API uptime", "Edge cases in legacy paper applications", "Officer adoption"],
    roadmap: { months3: ["Pilot with 10% of incoming volume"], months6: ["Roll out 50%, refine eval set"], months12: ["Full rollout + extend to commercial drone hub permits"] },
  });

  // Challenge 2 — Airworthiness Inspection Triage (claimed, blueprint complete)
  const c2 = await createChallenge(projectId, admin?.id || null, {
    title: "Aircraft Airworthiness Inspection Triage",
    description:
      "Inspectors review incoming maintenance reports and incident logs from operators to decide which require physical inspection, document review, or no further action. Volume is high; prioritization is informal and inspector-dependent.",
    businessContext:
      "Hamad International is one of the busiest hubs in the region. With 50+ airlines operating from Doha, the volume of airworthiness directives, service bulletins, and operator-submitted maintenance records exceeds inspection capacity.",
    currentPainPoints:
      "- Reports queued in email and shared drives, no single inbox\n- Triage decisions vary by inspector experience\n- High-risk items occasionally lost in volume\n- No structured way to learn from past inspection outcomes",
    desiredOutcome:
      "A consistent, risk-scored triage of every incoming report, with the highest-risk items flagged immediately and routed to the right inspector.",
    departmentTags: ["Airworthiness", "Safety & Regulation"],
    priority: "high",
    status: "claimed",
    analysis: makeAnalysis(
      "Aircraft Airworthiness Inspection Triage",
      [
        { name: "Risk Scoring Agent", oneLiner: "Reads each maintenance report and assigns a risk score with inspector routing recommendation.", framework: "LangGraph", llm: "claude-sonnet-4-6", feas: 8, impact: 9, capabilities: ["Risk scoring against historical outcomes", "Inspector routing"], dataSources: ["Maintenance reports", "Inspection history"], risks: ["Data quality of historical outcomes"] },
        { name: "Routing Agent", oneLiner: "Smart routing of triaged items to the right inspector based on workload, skill, and prior cases.", framework: "Claude Agents SDK", llm: "claude-sonnet-4-6", feas: 7, impact: 7, capabilities: ["Workload balancing", "Skill matching"], dataSources: ["Inspector schedules"], risks: ["Inspector pushback on assignments"] },
        { name: "Historical Pattern Agent", oneLiner: "Periodically surfaces emerging risk patterns across operators and aircraft types.", framework: "CrewAI", llm: "claude-opus-4-7", feas: 6, impact: 8, capabilities: ["Pattern detection", "Alert drafting"], dataSources: ["Decision history", "Incident DB"], risks: ["False positive rate"] },
      ],
      { org: "EASA Predictive Maintenance Pilot (EU)", outcome: "20% earlier identification of recurring airworthiness issues vs baseline.", relevance: "Same risk-scoring pattern over inspection records." },
      [
        { pillar: "Operating Model", asset: "AI Risk & Ethics Charter", why: "Safety-critical use case demands a documented ethics review." },
        { pillar: "Solutions", asset: "Sectorial Use Case Libraries", why: "Aviation maintenance benchmarks reduce design time." },
      ],
    ),
    teamId: teamMap["Team Hangar"],
  });
  await createBlueprint(teamMap["Team Hangar"], c2.id, {
    name: "Airworthiness Risk Scorer",
    purpose: "Score each incoming maintenance report 1-10 and route the high-risk ones to the right inspector with cited precedents.",
    framework: "LangGraph",
    llm: "claude-sonnet-4-6",
    tools: ["parse_report", "lookup_history", "score_risk", "route_to_inspector", "log_decision"],
    inputs: ["Maintenance reports", "Inspection history", "Operator records"],
    outputs: ["Risk score 1-10", "Routing recommendation", "Cited precedents"],
    memory: "Per-report only.",
    guardrails: "Anything ≥8 always paged to a human regardless of confidence; never auto-close a report.",
    feasibility: 8,
    impact: 9,
    status: "building",
    roi: { ...sampleRoi, timeSavedHours: 3000, costReducedAmount: 225000, assumptions: "Triage time on routine reports drops from 25min to 5min." },
    kpis: ["Time-to-triage (hours)", "High-risk catch rate", "Inspector hours redirected"],
    risks: ["Historical data sparsity for new aircraft types"],
    roadmap: { months3: ["Pilot with one operator"], months6: ["50% of operators"], months12: ["All operators + extend to ramp inspections"] },
  });

  // Challenge 3 — Aerodrome Compliance (claimed, blueprint in design)
  const c3 = await createChallenge(projectId, admin?.id || null, {
    title: "Aerodrome Compliance Reporting Assistant",
    description:
      "Quarterly compliance reports for Qatar's licensed aerodromes are compiled manually from inspection records, incident logs, and operator submissions. Each report takes ~3 weeks of analyst time and is prone to inconsistency.",
    businessContext:
      "QCAA oversees 6 licensed aerodromes including Hamad International. ICAO reporting standards are evolving, and the team needs a faster, auditable process.",
    currentPainPoints:
      "- Manual data aggregation across 7 source systems\n- Inconsistent narrative quality across reports\n- No automated cross-check against ICAO Annex 14 standards\n- Last-minute scramble before each quarterly deadline",
    desiredOutcome:
      "A quarterly report drafted in <3 days, with auto-pulled data, ICAO-aligned structure, and inspector-ready review markup.",
    departmentTags: ["Aerodromes", "Strategy & Performance"],
    priority: "medium",
    status: "claimed",
    analysis: makeAnalysis(
      "Aerodrome Compliance Reporting Assistant",
      [
        { name: "Data Aggregation Agent", oneLiner: "Pulls inspection records, incident logs, and operator submissions into a single normalized dataset.", framework: "LangChain", llm: "claude-sonnet-4-6", feas: 9, impact: 7, capabilities: ["Multi-source ETL", "Schema normalization"], dataSources: ["7 internal systems"], risks: ["Source schema drift"] },
        { name: "Report Drafting Agent", oneLiner: "Drafts ICAO-aligned narrative sections from the normalized dataset.", framework: "Claude Agents SDK", llm: "claude-opus-4-7", feas: 7, impact: 8, capabilities: ["Structured drafting", "ICAO Annex 14 alignment check"], dataSources: ["ICAO standards"], risks: ["Hallucinated metrics"] },
        { name: "Reviewer-Ready Markup Agent", oneLiner: "Surfaces every claim that needs human verification before sign-off.", framework: "LangGraph", llm: "claude-sonnet-4-6", feas: 8, impact: 6, capabilities: ["Confidence-marked output", "Inline citations"], dataSources: ["Source records"], risks: ["Reviewer fatigue if too many flags"] },
      ],
      { org: "EASA Annual Safety Report tooling", outcome: "Cut report drafting time from 6 weeks to 2 weeks.", relevance: "Same drafting-from-aggregated-data pattern." },
      [{ pillar: "Operating Model", asset: "AI Governance Framework", why: "Auditability for regulatory deliverables." }, { pillar: "Solutions", asset: "Sectorial Use Case Libraries", why: "Aviation compliance reporting precedents." }],
    ),
    teamId: teamMap["Team Tower"],
  });
  await createBlueprint(teamMap["Team Tower"], c3.id, {
    name: "Compliance Report Drafter",
    purpose: "Draft ICAO-aligned quarterly compliance reports with reviewer-ready markup.",
    framework: "Claude Agents SDK",
    llm: "claude-opus-4-7",
    tools: ["fetch_inspections", "fetch_incidents", "icao_alignment_check", "draft_section", "flag_for_review"],
    inputs: ["Inspection records", "Incident logs", "Operator submissions", "ICAO Annex 14"],
    outputs: ["Drafted report sections", "Reviewer markup"],
    memory: "Per-quarter context.",
    guardrails: "Every quantitative claim must cite a source row; flag any section with confidence <0.7.",
    feasibility: 7,
    impact: 8,
    status: "blueprint",
    roi: { ...sampleRoi, timeSavedHours: 600, costReducedAmount: 45000, assumptions: "Report drafting time 3 weeks → 3 days, 4x per year." },
    kpis: ["Report turnaround (days)", "Reviewer correction rate"],
    risks: ["ICAO Annex changes mid-year"],
    roadmap: { months3: ["Pilot for one aerodrome"], months6: ["All 6 aerodromes"], months12: ["Extend to monthly snapshots"] },
  });

  // Challenge 4 — Internal Knowledge Q&A (claimed, in discovery)
  const c4 = await createChallenge(projectId, admin?.id || null, {
    title: "Internal Knowledge Q&A Agent for Civil Aviation Regulations",
    description:
      "Staff across QCAA frequently need to find specific clauses across the QCAR (Qatar Civil Aviation Regulations), ICAO annexes, and internal SOPs. Search is slow and answers are often incomplete.",
    businessContext:
      "The QCAR alone is 1,200+ pages. New officers spend weeks learning where to look. Senior staff are interrupted dozens of times per week with reference questions.",
    currentPainPoints:
      "- No internal search across regulatory corpus\n- Reliance on tribal knowledge of senior staff\n- Risk of citing outdated versions\n- Long onboarding ramp for new hires",
    desiredOutcome:
      "A conversational agent that answers regulatory questions with cited clauses, flags ambiguous cases for human follow-up, and stays current as regulations update.",
    departmentTags: ["All"],
    priority: "medium",
    status: "claimed",
    analysis: makeAnalysis(
      "Internal Knowledge Q&A Agent",
      [
        { name: "Regulatory Q&A Agent", oneLiner: "Conversational agent over the QCAR + ICAO + internal SOP corpus with cited clauses.", framework: "LangChain", llm: "claude-sonnet-4-6", feas: 8, impact: 8, capabilities: ["RAG over regulatory corpus", "Cited clause output"], dataSources: ["QCAR", "ICAO Annexes", "Internal SOPs"], risks: ["Stale corpus → wrong answers"] },
        { name: "Onboarding Coach Agent", oneLiner: "Walks new officers through their role-specific regulatory landscape interactively.", framework: "Claude Agents SDK", llm: "claude-sonnet-4-6", feas: 7, impact: 6, capabilities: ["Role-aware curriculum", "Quiz generation"], dataSources: ["QCAR", "Role definitions"], risks: ["Engagement / completion rates"] },
        { name: "Regulation-Update Watcher", oneLiner: "Monitors ICAO and QCAR amendments and pushes targeted briefings to affected teams.", framework: "LangGraph", llm: "claude-sonnet-4-6", feas: 7, impact: 7, capabilities: ["Diff detection", "Targeted notifications"], dataSources: ["ICAO publications", "QCAR amendments"], risks: ["Notification fatigue"] },
      ],
      { org: "FAA Knowledge Center pilot", outcome: "70% of routine compliance questions answered without escalation.", relevance: "Same RAG-with-citations pattern." },
      [{ pillar: "Operating Model", asset: "AI Governance Framework", why: "Citation traceability for regulatory answers." }, { pillar: "Skills", asset: "Career Pathing Toolkit", why: "Onboarding agent ties directly to career-pathing." }],
    ),
    teamId: teamMap["Team Wingspan"],
  });
  await createBlueprint(teamMap["Team Wingspan"], c4.id, {
    name: "QCAR Q&A Agent",
    purpose: "Answer regulatory questions with cited clauses; escalate ambiguity.",
    framework: "LangChain",
    llm: "claude-sonnet-4-6",
    tools: ["retrieve_regulation", "verify_citation", "escalate_ambiguous"],
    inputs: ["QCAR corpus", "ICAO Annexes", "Internal SOPs"],
    outputs: ["Answer with cited clauses", "Escalation ticket if ambiguous"],
    memory: "Conversation-level only.",
    guardrails: "Never answer without a citation; if confidence <0.75 escalate.",
    feasibility: 8,
    impact: 8,
    status: "draft",
    roi: { ...sampleRoi, timeSavedHours: 2000, costReducedAmount: 150000, assumptions: "Average officer saves 30min/day on lookups across ~50 officers." },
    kpis: ["Answer-with-citation rate", "Escalation rate", "Onboarding time"],
    risks: ["Corpus version control"],
    roadmap: { months3: ["Pilot with Personnel Licensing"], months6: ["Open to all departments"], months12: ["Extend to applicant-facing FAQ"] },
  });

  // Challenge 5 — Passenger Complaint Resolution (OPEN — for live demo)
  await createChallenge(projectId, admin?.id || null, {
    title: "Passenger Complaint Resolution Agent",
    description:
      "QCAA's Stakeholder Relations team handles passenger complaints against airlines operating in Qatar. Volume has grown alongside post-2022 tourism growth.",
    businessContext:
      "Mandate under QCAR Part 270 to investigate complaints and rule on compensation per ICAO and Qatari consumer protection law.",
    currentPainPoints:
      "- 4-week average resolution time\n- Repetitive case categorization done manually\n- No early triage to separate frivolous from substantive complaints",
    desiredOutcome:
      "Faster, more consistent complaint handling with auto-categorization, evidence summarization, and draft resolution recommendations.",
    departmentTags: ["Stakeholder Relations", "Legal Affairs"],
    priority: "medium",
    status: "open",
    analysis: null, // intentionally blank — drives the live demo per BRD
    teamId: null,
  });

  // Schedule Demo Day
  await prisma.demoDay.create({
    data: {
      projectId,
      scheduledAt: new Date("2026-05-18T10:00:00Z"),
      reviewers: JSON.stringify([
        { name: "H.E. President of QCAA", email: "president@caa.gov.qa", org: "QCAA" },
        { name: "Sia Managing Director", email: "khalid@sia-partners.com", org: "Sia Partners" },
      ]),
      pitchOrder: JSON.stringify([teamMap["Team Skyway"], teamMap["Team Hangar"], teamMap["Team Tower"], teamMap["Team Wingspan"]]),
      notes: "Boardroom 4 · 90 min total · Q&A blocks of 5 min per team",
    },
  });
}

// ===== MWAN seed content =================================================
async function seedMwanContent(
  ctx: { project: { id: string }; enabledToolbox: string[] },
  toolboxItems: Record<string, string>,
) {
  const projectId = ctx.project.id;
  await assignToolbox(projectId, ctx.enabledToolbox, toolboxItems);
  const admin = await prisma.projectAdmin.findFirst({ where: { projectId } });

  for (const p of mwanParticipants) {
    await prisma.participant.create({
      data: {
        email: p.email,
        name: p.name,
        jobTitle: p.jobTitle,
        department: p.department,
        passwordHash: HASH("mwan2026"),
        projectId,
        progressStage: p.stage || "design",
      },
    });
  }
  const teamMap: Record<string, string> = {};
  for (const teamName of ["Team Cycle", "Team Reuse", "Team Reduce"]) {
    const t = await prisma.team.create({ data: { name: teamName, projectId } });
    teamMap[teamName] = t.id;
  }
  for (const p of mwanParticipants) {
    await prisma.participant.update({
      where: { email: p.email },
      data: { teamId: teamMap[p.team] },
    });
  }

  const c1 = await createChallenge(projectId, admin?.id || null, {
    title: "Waste Facility Permit Auto-Review",
    description: "Automate review of new waste facility applications against environmental and operational standards.",
    businessContext: "MWAN is the national regulator for waste under Vision 2030.",
    currentPainPoints: "- 6-week average review cycle\n- Inconsistent assessments across reviewers\n- No environmental data cross-check",
    desiredOutcome: "Standard applications reviewed in ≤5 days; high-risk cases routed to senior reviewers.",
    departmentTags: ["Regulatory", "Operations"],
    priority: "high",
    status: "claimed",
    analysis: makeAnalysis(
      "Waste Facility Permit Auto-Review",
      [
        { name: "Permit Triage Agent", oneLiner: "Auto-assess routine applications against codified rules.", framework: "LangGraph", llm: "claude-sonnet-4-6", feas: 8, impact: 8, capabilities: ["Doc parsing", "Rule check"], dataSources: ["Application intake", "Standards corpus"], risks: ["Rule drift"] },
        { name: "Environmental Cross-Check Agent", oneLiner: "Cross-checks proposed sites against environmental and zoning data.", framework: "Claude Agents SDK", llm: "claude-opus-4-7", feas: 7, impact: 9, capabilities: ["GIS lookups", "Zoning verification"], dataSources: ["Environmental data", "Zoning DB"], risks: ["Data freshness"] },
        { name: "Stakeholder Notification Agent", oneLiner: "Drafts decision letters and stakeholder notifications with consistent tone.", framework: "LangChain", llm: "claude-haiku-4-5", feas: 9, impact: 5, capabilities: ["Templated drafting"], dataSources: ["Decision metadata"], risks: ["Tone consistency"] },
      ],
      { org: "Singapore NEA permit automation", outcome: "Review cycle 4 weeks → 1 week.", relevance: "Direct analog in regulator scale and corpus." },
      [{ pillar: "Operating Model", asset: "AI Governance Framework", why: "Regulatory decision auditability." }, { pillar: "Solutions", asset: "Sectorial Use Case Libraries", why: "Public-sector permit benchmarks." }],
    ),
    teamId: teamMap["Team Cycle"],
  });
  await createBlueprint(teamMap["Team Cycle"], c1.id, {
    name: "MWAN Permit Triage",
    purpose: "Auto-assess routine waste facility permits against codified standards.",
    framework: "LangGraph",
    llm: "claude-sonnet-4-6",
    tools: ["parse_application", "rule_check", "env_cross_check", "draft_decision"],
    inputs: ["Application intake DB", "Standards corpus", "Environmental data"],
    outputs: ["Decision recommendation", "Audit trail"],
    memory: "Per-application only.",
    guardrails: "Always run env cross-check; ≥0.8 confidence to auto-decide.",
    feasibility: 8,
    impact: 8,
    status: "blueprint",
    roi: { ...sampleRoi, timeSavedHours: 1800, costReducedAmount: 135000 },
    kpis: ["Cycle time", "Auto-decision rate"],
    risks: ["Standards version control"],
    roadmap: { months3: ["Pilot — small applications"], months6: ["50% volume"], months12: ["Full rollout"] },
  });

  const c2 = await createChallenge(projectId, admin?.id || null, {
    title: "Illegal Dumping GIS Detection Agent",
    description: "Agent that ingests satellite imagery and citizen reports to flag suspected illegal dump sites and route to inspectors.",
    businessContext: "Illegal dumping costs Vision 2030 cleanup budgets and damages public trust.",
    currentPainPoints: "- Reactive only\n- No prioritization framework\n- Inspector time wasted on duplicate reports",
    desiredOutcome: "Proactive detection with prioritized inspector routes.",
    departmentTags: ["Operations", "Geospatial"],
    priority: "high",
    status: "claimed",
    analysis: makeAnalysis(
      "Illegal Dumping GIS Detection Agent",
      [
        { name: "Imagery Anomaly Agent", oneLiner: "Detects new ground anomalies in satellite imagery.", framework: "LangGraph", llm: "claude-opus-4-7", feas: 6, impact: 9, capabilities: ["Image diff", "Anomaly classification"], dataSources: ["Satellite imagery feed"], risks: ["False positives in construction zones"] },
        { name: "Report Triage Agent", oneLiner: "Triages citizen reports and merges with imagery anomalies.", framework: "LangChain", llm: "claude-sonnet-4-6", feas: 9, impact: 7, capabilities: ["Dedup", "Geospatial clustering"], dataSources: ["Citizen reports portal"], risks: ["Spam reports"] },
        { name: "Inspector Routing Agent", oneLiner: "Builds optimized daily inspection routes.", framework: "Claude Agents SDK", llm: "claude-sonnet-4-6", feas: 8, impact: 6, capabilities: ["Route optimization"], dataSources: ["Inspector schedules", "Sites"], risks: ["Inspector preferences"] },
      ],
      { org: "Australian state environmental agencies", outcome: "30% increase in caught dump sites.", relevance: "Same imagery + citizen-report fusion." },
      [{ pillar: "Solutions", asset: "Vendor Landscape Map", why: "Imagery analysis vendor comparison." }, { pillar: "Operating Model", asset: "AI Governance Framework", why: "Auditability for enforcement actions." }],
    ),
    teamId: teamMap["Team Reuse"],
  });
  await createBlueprint(teamMap["Team Reuse"], c2.id, {
    name: "Dumping Detector",
    purpose: "Detect new illegal dump sites and route inspectors.",
    framework: "LangGraph",
    llm: "claude-opus-4-7",
    tools: ["fetch_imagery", "diff_anomaly", "cluster_reports", "build_route"],
    inputs: ["Satellite imagery", "Citizen reports", "Inspector schedules"],
    outputs: ["Prioritized site list", "Inspector route"],
    memory: "Per-day cycle.",
    guardrails: "Never auto-issue fines; always inspector-verified.",
    feasibility: 7,
    impact: 9,
    status: "blueprint",
    roi: { ...sampleRoi, timeSavedHours: 1200, costReducedAmount: 90000 },
    kpis: ["Catch rate", "Inspector hours"],
    risks: ["Imagery cadence"],
    roadmap: { months3: ["Pilot one province"], months6: ["3 provinces"], months12: ["Nationwide"] },
  });

  // Challenge 3 — OPEN for live demo
  await createChallenge(projectId, admin?.id || null, {
    title: "Operator Compliance Reporting Assistant",
    description: "Help licensed waste operators submit compliance reports faster and with fewer errors.",
    businessContext: "Operators report quarterly under MWAN's mandate.",
    currentPainPoints: "- Operators submit late and incomplete\n- MWAN spends weeks chasing missing data",
    desiredOutcome: "Self-service compliance assistant with auto-validated submissions.",
    departmentTags: ["Regulatory", "Operations"],
    priority: "medium",
    status: "open",
    analysis: null,
    teamId: null,
  });

  await prisma.demoDay.create({
    data: {
      projectId,
      scheduledAt: new Date("2026-06-01T09:00:00Z"),
      reviewers: JSON.stringify([{ name: "MWAN CEO", email: "ceo@mwan.gov.sa", org: "MWAN" }]),
      pitchOrder: JSON.stringify([teamMap["Team Cycle"], teamMap["Team Reuse"], teamMap["Team Reduce"]]),
    },
  });
}

// ===== Dubai Customs seed content (graduated cohort) =====================
async function seedDcContent(
  ctx: { project: { id: string }; enabledToolbox: string[] },
  toolboxItems: Record<string, string>,
) {
  const projectId = ctx.project.id;
  await assignToolbox(projectId, ctx.enabledToolbox, toolboxItems);
  const admin = await prisma.projectAdmin.findFirst({ where: { projectId } });

  for (const p of dcParticipants) {
    await prisma.participant.create({
      data: {
        email: p.email,
        name: p.name,
        jobTitle: p.jobTitle,
        department: p.department,
        passwordHash: HASH("dc2026"),
        projectId,
        progressStage: "completed",
      },
    });
  }
  const teamMap: Record<string, string> = {};
  for (const teamName of ["Team Falcon", "Team Dhow", "Team Compass", "Team Anchor"]) {
    const t = await prisma.team.create({ data: { name: teamName, projectId } });
    teamMap[teamName] = t.id;
  }
  for (const p of dcParticipants) {
    await prisma.participant.update({
      where: { email: p.email },
      data: { teamId: teamMap[p.team] },
    });
  }

  const dcChallenges = [
    {
      title: "HS Code Classification Agent",
      desc: "Auto-classify imports against the harmonized commodity coding system with cited rationale.",
      decision: "greenlight",
      team: "Team Falcon",
    },
    {
      title: "Trade Document Anomaly Detector",
      desc: "Flag anomalies in declared trade documents (invoices, bills of lading) for risk team review.",
      decision: "greenlight",
      team: "Team Dhow",
    },
    {
      title: "Trader Helpdesk Conversational Agent",
      desc: "Self-service trader helpdesk that handles routine queries and routes complex ones.",
      decision: "greenlight",
      team: "Team Compass",
    },
    {
      title: "Inspection Targeting Optimizer",
      desc: "Recommend which shipments to physically inspect based on multi-signal risk scoring.",
      decision: "needs_revision",
      team: "Team Anchor",
    },
  ];
  for (const dc of dcChallenges) {
    const ch = await createChallenge(projectId, admin?.id || null, {
      title: dc.title,
      description: dc.desc,
      businessContext: "Dubai Customs' Vision 2030 target: 80% of routine processes touch-free.",
      currentPainPoints: "Manual review cycles slowing trade flow.",
      desiredOutcome: "Materially faster decisioning with audit-ready rationale.",
      departmentTags: ["Trade Operations", "Risk", "Innovation"],
      priority: "high",
      status: "completed",
      analysis: makeAnalysis(
        dc.title,
        [
          { name: dc.title.replace(" Agent", "").replace(" Optimizer", "").replace(" Detector", ""), oneLiner: dc.desc, framework: "LangGraph", llm: "claude-sonnet-4-6", feas: 8, impact: 8, capabilities: ["Doc parsing", "Risk scoring"], dataSources: ["Trade DB"], risks: ["Edge cases"] },
        ],
        { org: "WCO digital pilots", outcome: "Cycle time -40%.", relevance: "Direct customs analog." },
        [{ pillar: "Solutions", asset: "Vendor Landscape Map", why: "Customs vendor comparison." }],
      ),
      teamId: teamMap[dc.team],
    });
    await createBlueprint(teamMap[dc.team], ch.id, {
      name: dc.title.replace(" Agent", "").replace(" Optimizer", "").replace(" Detector", ""),
      purpose: dc.desc,
      framework: "LangGraph",
      llm: "claude-sonnet-4-6",
      tools: ["parse_doc", "score_risk", "draft_decision"],
      inputs: ["Trade DB", "Risk corpus"],
      outputs: ["Decision", "Rationale"],
      memory: "Per-shipment context.",
      guardrails: "Risk team approval for anything above threshold.",
      feasibility: 8,
      impact: 8,
      status: "demo_ready",
      roi: { ...sampleRoi, timeSavedHours: 5500, costReducedAmount: 412500 },
      kpis: ["Cycle time", "Catch rate", "Trader NPS"],
      risks: ["Adoption"],
      roadmap: { months3: ["Pilot one trade lane"], months6: ["50%"], months12: ["100%"] },
      pitchDeck: samplePitchDeck("Dubai Customs", dc.title, dc.title, "LangGraph", { ...sampleRoi, timeSavedHours: 5500, costReducedAmount: 412500 }),
      demoDecision: dc.decision,
    });
  }

  // Demo Day record (already executed)
  await prisma.demoDay.create({
    data: {
      projectId,
      scheduledAt: new Date("2026-01-12T10:00:00Z"),
      reviewers: JSON.stringify([
        { name: "DG of Dubai Customs", email: "dg@dubaicustoms.ae", org: "Dubai Customs" },
        { name: "Sia MD", email: "khalid@sia-partners.com", org: "Sia Partners" },
      ]),
      pitchOrder: JSON.stringify(Object.values(teamMap)),
      notes: "Greenlight on 3 of 4 agents. Inspection Targeting Optimizer scheduled for v2.",
    },
  });
}

// ----- Helpers ------------------------------------------------------------

interface ChallengeSeed {
  title: string;
  description: string;
  businessContext: string;
  currentPainPoints: string;
  desiredOutcome: string;
  departmentTags: string[];
  priority: string;
  status: string;
  analysis: unknown;
  teamId: string | null;
}

async function createChallenge(
  projectId: string,
  adminId: string | null,
  s: ChallengeSeed,
) {
  const ch = await prisma.strategicChallenge.create({
    data: {
      projectId,
      title: s.title,
      description: s.description,
      businessContext: s.businessContext,
      currentPainPoints: s.currentPainPoints,
      desiredOutcome: s.desiredOutcome,
      departmentTags: JSON.stringify(s.departmentTags),
      priority: s.priority,
      status: s.status,
      aiAnalysis: s.analysis ? JSON.stringify(s.analysis) : null,
      suggestedAgents: s.analysis
        ? JSON.stringify((s.analysis as { suggestedAgents: unknown[] }).suggestedAgents)
        : null,
      benchmarkData: s.analysis
        ? JSON.stringify((s.analysis as { benchmarking: unknown }).benchmarking)
        : null,
      createdByProjectAdminId: adminId,
    },
  });
  if (s.teamId) {
    await prisma.team.update({ where: { id: s.teamId }, data: { challengeId: ch.id } });
  }
  return ch;
}

interface BlueprintSeed {
  name: string;
  purpose: string;
  framework: string;
  llm: string;
  tools: string[];
  inputs: string[];
  outputs: string[];
  memory: string;
  guardrails: string;
  feasibility: number;
  impact: number;
  status: string;
  roi: unknown;
  kpis: string[];
  risks: string[];
  roadmap: unknown;
  pitchDeck?: unknown;
  demoDecision?: string;
}

async function createBlueprint(teamId: string, challengeId: string, b: BlueprintSeed) {
  await prisma.agentSolution.create({
    data: {
      teamId,
      challengeId,
      name: b.name,
      description: b.purpose,
      purpose: b.purpose,
      agentType: "workflow",
      framework: b.framework,
      llm: b.llm,
      inputs: JSON.stringify(b.inputs),
      tools: JSON.stringify(b.tools),
      outputs: JSON.stringify(b.outputs),
      memory: b.memory,
      guardrails: b.guardrails,
      feasibilityScore: b.feasibility,
      impactScore: b.impact,
      status: b.status,
      roiModel: JSON.stringify(b.roi),
      kpis: JSON.stringify(b.kpis),
      risks: JSON.stringify(b.risks),
      roadmap: JSON.stringify(b.roadmap),
      pitchDeck: b.pitchDeck ? JSON.stringify(b.pitchDeck) : null,
      demoDecision: b.demoDecision || null,
    },
  });
}

async function seedActivityLog() {
  // ~50 entries spread across the last 14 days, all 3 projects.
  const projects = await prisma.project.findMany();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  let count = 0;
  for (const p of projects) {
    const admin = await prisma.projectAdmin.findFirst({ where: { projectId: p.id } });
    const participants = await prisma.participant.findMany({ where: { projectId: p.id }, take: 5 });
    const challenges = await prisma.strategicChallenge.findMany({ where: { projectId: p.id } });

    const events: Array<[string, string, string, Record<string, unknown>]> = [];
    if (admin) {
      for (const c of challenges) {
        events.push(["project_admin", admin.name, "project_admin.challenge_created", { challengeId: c.id }]);
        if (c.aiAnalysis) {
          events.push(["project_admin", admin.name, "project_admin.challenge_analyzed", { challengeId: c.id }]);
        }
      }
    }
    for (const part of participants.slice(0, 4)) {
      events.push(["participant", part.name, "participant.login", {}]);
      events.push(["participant", part.name, "participant.coach_message", { chars: 240 }]);
      if (Math.random() > 0.5) {
        events.push(["participant", part.name, "participant.blueprint_saved", {}]);
        events.push(["participant", part.name, "participant.blueprint_reviewed", {}]);
      }
      if (Math.random() > 0.6) {
        events.push(["participant", part.name, "participant.code_scaffolded", {}]);
      }
      if (Math.random() > 0.7) {
        events.push(["participant", part.name, "participant.quiz_completed", { score: 80 }]);
      }
    }
    if (p.status === "completed") {
      const agents = await prisma.agentSolution.findMany({ where: { team: { projectId: p.id } } });
      for (const a of agents) {
        if (a.demoDecision) {
          events.push(["project_admin", admin?.name ?? "Demo Day", "system.demo_decision", { agentId: a.id, decision: a.demoDecision }]);
        }
      }
    }

    // Randomize timestamps over the last 14 days
    for (const [userType, userName, action, payload] of events) {
      await prisma.activityLog.create({
        data: {
          projectId: p.id,
          userType,
          userName,
          action,
          payload: JSON.stringify(payload),
          timestamp: new Date(now - Math.random() * 14 * day),
        },
      });
      count++;
    }
  }
  return count;
}

async function summary() {
  const [siaAdmins, projects, participants, teams, challenges, withAi, openCh, agents, toolbox, learning, activity] =
    await Promise.all([
      prisma.siaAdmin.count(),
      prisma.project.count(),
      prisma.participant.count(),
      prisma.team.count(),
      prisma.strategicChallenge.count(),
      prisma.strategicChallenge.count({ where: { aiAnalysis: { not: null } } }),
      prisma.strategicChallenge.count({ where: { status: "open" } }),
      prisma.agentSolution.count(),
      prisma.toolboxItem.count(),
      prisma.learningResource.count(),
      prisma.activityLog.count(),
    ]);
  return { siaAdmins, projects, participants, teams, challenges, withAi, openCh, agents, toolbox, learning, activity };
}

function printSummary(c: Awaited<ReturnType<typeof summary>>) {
  console.log();
  console.log("  ✓ %d Sia Admins", c.siaAdmins);
  console.log("  ✓ %d Projects (QCAA active wk6, MWAN active wk4, DC completed)", c.projects);
  console.log("  ✓ %d Participants across all projects", c.participants);
  console.log("  ✓ %d Teams", c.teams);
  console.log("  ✓ %d Strategic Challenges (%d with AI analysis, %d open for live demo)", c.challenges, c.withAi, c.openCh);
  console.log("  ✓ %d Agent Blueprints (varying maturity)", c.agents);
  console.log("  ✓ %d Sia Toolbox assets", c.toolbox);
  console.log("  ✓ %d Learning Hub resources", c.learning);
  console.log("  ✓ %d Activity log entries", c.activity);
  console.log();
  console.log("  Login URLs:");
  console.log("    Sia Admin:        http://localhost:3000/admin/login");
  console.log("    Client (QCAA):    http://localhost:3000/login → use sara.almansoori@caa.gov.qa / qcaa2026");
  console.log("    Participant (QCAA): http://localhost:3000/login → use ahmed.alkuwari@caa.gov.qa / qcaa2026");
  console.log();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
