"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ClaimChallengeButton({
  challengeId,
  myTeamId,
  challengeStatus,
  myTeamHasChallenge,
  currentTeamId,
}: {
  challengeId: string;
  myTeamId: string | null;
  challengeStatus: string;
  myTeamHasChallenge: boolean;
  currentTeamId: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!myTeamId) {
    return (
      <Button variant="outline" disabled>
        Join a team first
      </Button>
    );
  }
  if (currentTeamId && currentTeamId === myTeamId) {
    return <Button variant="outline" disabled>Already yours</Button>;
  }
  if (challengeStatus !== "open") {
    return (
      <Button variant="outline" disabled>
        Already claimed
      </Button>
    );
  }
  if (myTeamHasChallenge) {
    return (
      <Button variant="outline" disabled>
        Your team already has a challenge
      </Button>
    );
  }

  async function claim() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/my/challenges/${challengeId}/claim`, {
      method: "POST",
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setMsg(j.error || "Could not claim");
      return;
    }
    router.push("/my/build");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="gold" onClick={claim} disabled={busy}>
        {busy ? "Claiming…" : "Claim with my team"}
      </Button>
      {msg ? <span className="text-xs text-rose-600">{msg}</span> : null}
    </div>
  );
}
