"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export default function NewProjectPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#0B1F3A");
  const [secondaryColor, setSecondaryColor] = useState("#C5A572");

  async function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await readFileAsDataUrl(file);
    setLogoUrl(url);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      clientOrgName: fd.get("clientOrgName"),
      shortName: fd.get("shortName"),
      description: fd.get("description"),
      welcomeMessage: fd.get("welcomeMessage"),
      startDate: fd.get("startDate"),
      endDate: fd.get("endDate"),
      cohortSize: Number(fd.get("cohortSize") || 0),
      primaryColor,
      secondaryColor,
      logoUrl,
    };
    const res = await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setSubmitting(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Could not create project");
      return;
    }
    const j = await res.json();
    router.push(`/admin/projects/${j.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sia Admin"
        title="Create New Project"
        description="A project is one client engagement — its own users, branding, challenges, and outputs."
      />

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-4 p-6">
            <h2 className="font-semibold">Engagement details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Project name *</Label>
                <Input id="name" name="name" required placeholder="Bahrain Postal — AgentLaunch Cohort 1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientOrgName">Client organization *</Label>
                <Input id="clientOrgName" name="clientOrgName" required placeholder="Bahrain Postal Authority" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortName">Short name</Label>
                <Input id="shortName" name="shortName" placeholder="BPA" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start date *</Label>
                <Input id="startDate" name="startDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End date *</Label>
                <Input id="endDate" name="endDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cohortSize">Expected cohort size</Label>
                <Input id="cohortSize" name="cohortSize" type="number" min={1} defaultValue={15} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Program description</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">Welcome message (shown to participants)</Label>
              <Textarea id="welcomeMessage" name="welcomeMessage" rows={2} />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4 p-6">
            <h2 className="font-semibold">Branding</h2>
            <div className="space-y-2">
              <Label>Logo</Label>
              <input type="file" accept="image/*" onChange={onLogoChange} className="block w-full text-xs" />
              {logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={logoUrl} alt="Logo preview" className="mt-2 max-h-20 rounded border" />
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="primaryColor"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-14 rounded border"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="secondaryColor"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-10 w-14 rounded border"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border p-3" style={{ background: secondaryColor + "33" }}>
              <p className="text-xs text-slate-500">Brand preview</p>
              <div
                className="mt-2 rounded p-3 text-white"
                style={{ background: primaryColor }}
              >
                Welcome to AgentLaunch
              </div>
            </div>
          </Card>

          {error ? (
            <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
          ) : null}
          <div className="flex gap-3">
            <Button type="submit" variant="gold" disabled={submitting}>
              {submitting ? "Creating…" : "Create project"}
            </Button>
            <Link href="/admin/projects">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
