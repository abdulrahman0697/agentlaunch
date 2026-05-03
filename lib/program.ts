/**
 * Maps program week (1-10) to the 4-phase model used in the BRD:
 * Discovery → Design → Build → Realization.
 */
export type Phase = "discovery" | "design" | "build" | "realization" | "completed";

export const PHASE_LABEL: Record<Phase, string> = {
  discovery: "Discovery",
  design: "Feasibility & Design",
  build: "Build & Iterate",
  realization: "Realization",
  completed: "Completed",
};

export function phaseForWeek(week: number): Phase {
  if (week <= 0) return "discovery";
  if (week <= 3) return "discovery";
  if (week <= 5) return "design";
  if (week <= 8) return "build";
  if (week <= 10) return "realization";
  return "completed";
}

export const PHASES: Phase[] = ["discovery", "design", "build", "realization"];
