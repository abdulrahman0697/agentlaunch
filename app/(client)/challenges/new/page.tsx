"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";

export default function NewChallengePage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const tags = String(fd.get("tags") || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const body = {
      title: fd.get("title"),
      description: fd.get("description"),
      businessContext: fd.get("businessContext"),
      currentPainPoints: fd.get("currentPainPoints"),
      desiredOutcome: fd.get("desiredOutcome"),
      priority: fd.get("priority") || "medium",
      departmentTags: tags,
    };
    const res = await fetch("/api/challenges", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Could not create challenge");
      setBusy(false);
      return;
    }
    const j = await res.json();
    router.push(`/challenges/${j.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Project Admin"
        title="Post a Strategic Challenge"
        description="Frame the business problem precisely. Once submitted you can run AI analysis to surface candidate agents, benchmarks, and toolbox recommendations."
      />
      <form onSubmit={onSubmit} className="space-y-6">
        <Card className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" name="title" required placeholder="Drone Permit Processing Automation" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" name="description" rows={3} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessContext">Business context *</Label>
            <Textarea id="businessContext" name="businessContext" rows={4} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentPainPoints">Current pain points *</Label>
            <Textarea id="currentPainPoints" name="currentPainPoints" rows={4} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desiredOutcome">Desired outcome *</Label>
            <Textarea id="desiredOutcome" name="desiredOutcome" rows={3} required />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tags">Department/function tags (comma-separated)</Label>
              <Input id="tags" name="tags" placeholder="Personnel Licensing, IT" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                name="priority"
                defaultValue="medium"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </Card>

        {error ? (
          <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
        ) : null}
        <div className="flex gap-3">
          <Button type="submit" variant="gold" disabled={busy}>
            {busy ? "Saving…" : "Post challenge"}
          </Button>
          <Link href="/challenges">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
