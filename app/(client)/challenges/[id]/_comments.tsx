"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export function CommentForm({ challengeId }: { challengeId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!body.trim()) return;
    setBusy(true);
    await fetch(`/api/challenges/${challengeId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setBody("");
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mt-4 space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Leave guidance for the team…"
        rows={3}
      />
      <Button onClick={submit} size="sm" variant="gold" disabled={busy || !body.trim()}>
        {busy ? "Posting…" : "Post comment"}
      </Button>
    </div>
  );
}
