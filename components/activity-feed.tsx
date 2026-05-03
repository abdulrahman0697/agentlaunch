import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/utils";

export interface ActivityEntry {
  id: string;
  action: string;
  userName?: string | null;
  userType: string;
  timestamp: Date | string;
  projectName?: string | null;
}

const labels: Record<string, string> = {
  "sia_admin.login": "signed in (Sia Admin)",
  "project_admin.login": "signed in (Project Admin)",
  "participant.login": "signed in (Participant)",
  "sia_admin.logout": "signed out",
  "project_admin.logout": "signed out",
  "participant.logout": "signed out",
  "sia_admin.project_created": "created a new project",
  "sia_admin.project_archived": "archived a project",
  "sia_admin.week_advanced": "advanced the program week",
  "sia_admin.project_admin_invited": "invited a Project Admin",
  "sia_admin.project_admin_added": "added a Project Admin",
  "sia_admin.project_admins_added": "imported Project Admins",
  "sia_admin.participants_added": "added participants",
  "project_admin.challenge_created": "posted a strategic challenge",
  "project_admin.challenge_analyzed": "ran AI analysis on a challenge",
  "project_admin.team_created": "created a team",
  "participant.challenge_claimed": "claimed a challenge",
  "participant.blueprint_saved": "saved a blueprint",
  "participant.blueprint_reviewed": "ran AI blueprint review",
  "participant.code_scaffolded": "generated code scaffolding",
  "participant.pitch_generated": "generated a pitch deck",
  "participant.quiz_completed": "completed a quiz",
  "participant.coach_message": "asked the AI Coach",
  "participant.roi_validated": "validated their ROI model",
  "system.demo_decision": "logged a Demo Day decision",
};

export function ActivityFeed({
  entries,
  showProject = false,
  emptyText = "No activity yet.",
}: {
  entries: ActivityEntry[];
  showProject?: boolean;
  emptyText?: string;
}) {
  if (!entries.length) {
    return (
      <Card className="p-6 text-sm text-slate-500">{emptyText}</Card>
    );
  }
  return (
    <Card>
      <ul className="divide-y">
        {entries.map((e) => {
          const verb = labels[e.action] || e.action;
          return (
            <li key={e.id} className="flex items-start gap-3 px-5 py-3 text-sm">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-300" />
              <div className="flex-1">
                <p className="text-slate-800">
                  <span className="font-medium">{e.userName || "Someone"}</span>{" "}
                  <span className="text-slate-600">{verb}</span>
                  {showProject && e.projectName ? (
                    <span className="text-slate-500">
                      {" "}
                      · {e.projectName}
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-slate-400">{timeAgo(e.timestamp)}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
