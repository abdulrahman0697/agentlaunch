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

  // AI draft modal state
  const [draftOpen, setDraftOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBrief, setDraftBrief] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  // Controlled form values so the AI draft can populate them.
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [businessContext, setBusinessContext] = useState("");
  const [currentPainPoints, setCurrentPainPoints] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [tags, setTags] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const tagList = String(fd.get("tags") || "")
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
      departmentTags: tagList,
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

  function openDraft() {
    setDraftTitle(title || "");
    setDraftBrief("");
    setDraftError(null);
    setDraftOpen(true);
  }

  async function generateDraft() {
    if (!draftTitle.trim()) {
      setDraftError("Please enter a challenge title.");
      return;
    }
    setDrafting(true);
    setDraftError(null);
    try {
      const res = await fetch("/api/ai/draft-challenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: draftTitle, brief: draftBrief }),
      });
      const j = await res.json();
      if (!res.ok) {
        setDraftError(j.error || "Could not generate draft");
        return;
      }
      const d = j.draft as {
        description: string;
        businessContext: string;
        currentPainPoints: string;
        desiredOutcome: string;
        suggestedTags?: string[];
      };
      setTitle(draftTitle);
      setDescription(d.description);
      setBusinessContext(d.businessContext);
      setCurrentPainPoints(d.currentPainPoints);
      setDesiredOutcome(d.desiredOutcome);
      if (d.suggestedTags && d.suggestedTags.length) {
        setTags(d.suggestedTags.join(", "));
      }
      setDraftOpen(false);
    } catch (e) {
      setDraftError((e as Error).message || "Network error");
    } finally {
      setDrafting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Project Admin"
        title="Post a Strategic Challenge"
        description="Frame the business problem precisely. Once submitted you can run AI analysis to surface candidate agents, benchmarks, and toolbox recommendations."
        actions={
          <Button type="button" variant="outline" onClick={openDraft}>
            ✨ Draft with AI
          </Button>
        }
      />

      <form onSubmit={onSubmit} className="space-y-6">
        <Card className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="Drone Permit Processing Automation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessContext">Business context *</Label>
            <Textarea
              id="businessContext"
              name="businessContext"
              rows={4}
              required
              value={businessContext}
              onChange={(e) => setBusinessContext(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentPainPoints">Current pain points *</Label>
            <Textarea
              id="currentPainPoints"
              name="currentPainPoints"
              rows={5}
              required
              value={currentPainPoints}
              onChange={(e) => setCurrentPainPoints(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desiredOutcome">Desired outcome *</Label>
            <Textarea
              id="desiredOutcome"
              name="desiredOutcome"
              rows={3}
              required
              value={desiredOutcome}
              onChange={(e) => setDesiredOutcome(e.target.value)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tags">Department/function tags (comma-separated)</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="Personnel Licensing, IT"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
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

      {draftOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !drafting && setDraftOpen(false)}
        >
          <Card
            className="w-full max-w-xl space-y-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                ✨ Draft with AI
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                Generate the challenge fields
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Give the AI the challenge title and a short brief in your own
                words. It will draft the description, business context, pain
                points, and desired outcome — you'll be able to edit them
                before posting.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="draftTitle" className="text-xs">
                Challenge title *
              </Label>
              <Input
                id="draftTitle"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Drone Permit Processing Automation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="draftBrief" className="text-xs">
                Brief / notes for the AI
              </Label>
              <Textarea
                id="draftBrief"
                rows={6}
                value={draftBrief}
                onChange={(e) => setDraftBrief(e.target.value)}
                placeholder={
                  "A few sentences to anchor the draft. For example:\n\n" +
                  "• What process is broken today?\n" +
                  "• Who is affected and how often?\n" +
                  "• What stakeholders care about it?\n\n" +
                  "Optional — leave blank and the AI will infer from the title."
                }
              />
            </div>

            {draftError ? (
              <p className="rounded-md bg-rose-50 p-2 text-xs text-rose-700">
                {draftError}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDraftOpen(false)}
                disabled={drafting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="gold"
                onClick={generateDraft}
                disabled={drafting}
              >
                {drafting ? "Drafting…" : "Generate draft"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
