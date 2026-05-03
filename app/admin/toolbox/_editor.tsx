"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Item {
  id: string;
  pillar: string;
  name: string;
  description: string;
  url: string | null;
}
interface Project {
  id: string;
  name: string;
}

export function ToolboxEditor({
  pillars,
  items,
  projects,
  assignmentMap,
}: {
  pillars: string[];
  items: Item[];
  projects: Project[];
  assignmentMap: Record<string, Record<string, boolean>>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  async function saveItem(form: HTMLFormElement, id?: string) {
    const fd = new FormData(form);
    const body = {
      id,
      pillar: fd.get("pillar"),
      name: fd.get("name"),
      description: fd.get("description"),
      url: fd.get("url"),
    };
    await fetch("/api/admin/toolbox", {
      method: id ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setEditingId(null);
    setShowNew(false);
    startTransition(() => router.refresh());
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this toolbox item?")) return;
    await fetch(`/api/admin/toolbox/${id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  async function toggleAssignment(itemId: string, projectId: string, enabled: boolean) {
    await fetch(`/api/admin/toolbox/${itemId}/assign`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectId, enabled }),
    });
    startTransition(() => router.refresh());
  }

  const visible = items.filter((i) => filter === "all" || i.pillar === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs">Filter pillar</Label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All</option>
            {pillars.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <Button size="sm" variant="gold" onClick={() => setShowNew(true)}>
          + Add toolbox item
        </Button>
      </div>

      {showNew ? (
        <Card className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveItem(e.currentTarget);
            }}
            className="grid gap-3 md:grid-cols-2"
          >
            <div className="space-y-1">
              <Label className="text-xs">Pillar</Label>
              <select name="pillar" required className="h-10 w-full rounded-md border border-input px-3 text-sm">
                {pillars.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input name="name" required />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Description</Label>
              <Textarea name="description" rows={2} required />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">URL (optional)</Label>
              <Input name="url" />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" size="sm" variant="gold" disabled={pending}>
                Save
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowNew(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Pillar</th>
              <th className="px-4 py-2.5">Name</th>
              {projects.map((p) => (
                <th key={p.id} className="px-2 py-2.5 text-center">{p.name}</th>
              ))}
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {visible.map((it) => (
              editingId === it.id ? (
                <tr key={it.id} className="bg-amber-50">
                  <td colSpan={3 + projects.length}>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveItem(e.currentTarget, it.id);
                      }}
                      className="grid gap-2 p-3 md:grid-cols-3"
                    >
                      <select name="pillar" defaultValue={it.pillar} className="h-9 rounded border px-2 text-sm">
                        {pillars.map((p) => <option key={p}>{p}</option>)}
                      </select>
                      <Input name="name" defaultValue={it.name} required />
                      <Input name="url" defaultValue={it.url ?? ""} placeholder="URL" />
                      <Textarea
                        name="description"
                        defaultValue={it.description}
                        rows={2}
                        className="md:col-span-3"
                        required
                      />
                      <div className="md:col-span-3 flex gap-2">
                        <Button type="submit" size="sm" variant="gold">Save</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={it.id}>
                  <td className="px-4 py-2 text-xs text-slate-500">{it.pillar}</td>
                  <td className="px-4 py-2">
                    <p className="font-medium">{it.name}</p>
                    <p className="text-xs text-slate-500">{it.description}</p>
                  </td>
                  {projects.map((p) => {
                    const enabled = assignmentMap[it.id]?.[p.id] ?? false;
                    return (
                      <td key={p.id} className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => toggleAssignment(it.id, p.id, e.target.checked)}
                        />
                      </td>
                    );
                  })}
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => setEditingId(it.id)}
                      className="text-xs text-slate-700 hover:underline"
                    >
                      Edit
                    </button>{" "}
                    ·{" "}
                    <button
                      onClick={() => deleteItem(it.id)}
                      className="text-xs text-rose-700 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            ))}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={3 + projects.length} className="px-4 py-6 text-center text-sm text-slate-500">
                  No items.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
