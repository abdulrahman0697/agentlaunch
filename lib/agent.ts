import { prisma } from "@/lib/db";

/**
 * Get-or-create the team's AgentSolution row. Each team builds one agent
 * during the program, so the team→agent relationship is effectively 1:1
 * for the prototype.
 */
export async function getOrCreateTeamAgent(teamId: string, challengeId: string) {
  const existing = await prisma.agentSolution.findFirst({
    where: { teamId, challengeId },
  });
  if (existing) return existing;
  return prisma.agentSolution.create({
    data: {
      teamId,
      challengeId,
      name: "Untitled Agent",
      description: "",
      purpose: "",
    },
  });
}
