"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  project: {
    id: string;
    name: string;
    clientOrgName: string;
    shortName: string | null;
    description: string | null;
    welcomeMessage: string | null;
    primaryColor: string;
    secondaryColor: string;
    backgroundAccent: string;
    logoUrl: string | null;
    status: string;
    cohortSize: number;
    programWeek: number;
    certificationsEnabled: boolean;
    startDate: Date;
    endDate: Date;
  };
}

export function ProjectSettings({ project }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState(project.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(project.secondaryColor);
  const [logoUrl, setLogoUrl] = useState<string | null>(project.logoUrl);
  const [status, setStatus] = useState(project.status);
  const [programWeek, setProgramWeek] = useState(project.programWeek);
  const [certificationsEnabled, setCertificationsEnabled] = useState(
    project.certificationsEnabled,
  );

  async function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      clientOrgName: fd.get("clientOrgName"),
      shortName: fd.get("shortName"),
      description: fd.get("description"),
      welcomeMessage: fd.get("welcomeMessage"),
      primaryColor,
      secondaryColor,
      logoUrl,
      status,
      programWeek,
      certificationsEnabled,
      cohortSize: Number(fd.get("cohortSize") || project.cohortSize),
    };
    const res = await fetch(`/api/admin/projects/${project.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) {
      setMessage("Saved.");
      router.refresh();
    } else {
      setMessage("Save failed.");
    }
  }

  async function onArchive() {
    if (!confirm("Archive this project? It will be hidden from active lists.")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/projects/${project.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.push("/admin/projects");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card className="space-y-4 p-6">
          <h2 className="font-semibold">Engagement</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Project name</Label>
              <Input id="name" name="name" defaultValue={project.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientOrgName">Client organization</Label>
              <Input id="clientOrgName" name="clientOrgName" defaultValue={project.clientOrgName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortName">Short name</Label>
              <Input id="shortName" name="shortName" defaultValue={project.shortName ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cohortSize">Cohort size</Label>
              <Input
                id="cohortSize"
                name="cohortSize"
                type="number"
                min={1}
                defaultValue={project.cohortSize}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} defaultValue={project.description ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">Welcome message (participant facing)</Label>
            <Textarea id="welcomeMessage" name="welcomeMessage" rows={2} defaultValue={project.welcomeMessage ?? ""} />
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="font-semibold">Program control</h2>
          <div className="space-y-3">
            <Label>
              Program week — {programWeek} of 10
            </Label>
            <input
              type="range"
              min={1}
              max={10}
              value={programWeek}
              onChange={(e) => setProgramWeek(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-slate-500">Manually advance the cohort through the 10-week program.</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={certificationsEnabled}
              onChange={(e) => setCertificationsEnabled(e.target.checked)}
            />
            Enable certifications track for this project
          </label>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="space-y-4 p-6">
          <h2 className="font-semibold">Branding</h2>
          <div className="space-y-2">
            <Label>Logo</Label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setLogoUrl(await readFileAsDataUrl(f));
              }}
              className="block w-full text-xs"
            />
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logoUrl} alt="logo" className="mt-2 max-h-20 rounded border" />
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Primary color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-14 rounded border"
              />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Secondary color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-10 w-14 rounded border"
              />
              <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Button type="submit" variant="gold" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
          <Button type="button" variant="destructive" onClick={onArchive} disabled={busy}>
            Archive project
          </Button>
        </div>
      </div>
    </form>
  );
}
