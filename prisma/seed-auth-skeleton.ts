/**
 * Minimal smoke-test seed for M2.
 *
 * Creates one Sia Admin, one Project (with a Project Admin), and one
 * Participant — just enough to log in as each role and verify routing.
 *
 * The full demo seed (Section 9) ships in M7 and replaces this.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
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

  const hash = (s: string) => bcrypt.hashSync(s, 10);

  const admin = await prisma.siaAdmin.create({
    data: {
      email: "admin@sia-partners.com",
      name: "Khalid El Bachraoui",
      title: "Managing Director — Digital, Data and AI Lead",
      passwordHash: hash("sia2026"),
    },
  });

  const project = await prisma.project.create({
    data: {
      name: "QCAA — AgentLaunch Cohort 1",
      clientOrgName: "Qatar Civil Aviation Authority",
      shortName: "QCAA",
      slug: "qcaa-cohort-1",
      primaryColor: "#8A1538",
      secondaryColor: "#C5A572",
      backgroundAccent: "#F5F0EA",
      welcomeMessage:
        "Welcome, Aviation Champions. Over the next 10 weeks, you will design and ship AI agents.",
      startDate: new Date("2026-03-09"),
      endDate: new Date("2026-05-18"),
      status: "active",
      cohortSize: 18,
      programWeek: 6,
      createdBySiaAdminId: admin.id,
    },
  });

  await prisma.projectAdmin.create({
    data: {
      email: "sara.almansoori@caa.gov.qa",
      name: "Sara Al-Mansoori",
      jobTitle: "Director of Strategy & Transformation",
      department: "Office of the President",
      passwordHash: hash("qcaa2026"),
      projectId: project.id,
    },
  });

  await prisma.participant.create({
    data: {
      email: "ahmed.alkuwari@caa.gov.qa",
      name: "Ahmed Al-Kuwari",
      jobTitle: "Senior Air Traffic Controller",
      department: "Air Navigation Services",
      passwordHash: hash("qcaa2026"),
      projectId: project.id,
    },
  });

  console.log("✓ M2 smoke-test seed complete");
  console.log("  Sia Admin:    admin@sia-partners.com / sia2026");
  console.log("  Project Admin: sara.almansoori@caa.gov.qa / qcaa2026");
  console.log("  Participant:   ahmed.alkuwari@caa.gov.qa / qcaa2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
