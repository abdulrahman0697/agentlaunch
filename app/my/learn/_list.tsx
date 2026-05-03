"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuizModal } from "./_quiz";

interface Item {
  id: string;
  title: string;
  type: string;
  provider: string;
  topic: string;
  minutes: number;
  url: string;
  completed?: boolean;
  score?: number | null;
}

export function LearningList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [topic, setTopic] = useState<string>("all");
  const [quizFor, setQuizFor] = useState<Item | null>(null);

  const topics = Array.from(new Set(items.map((i) => i.topic)));
  const filtered = topic === "all" ? items : items.filter((i) => i.topic === topic);
  const done = items.filter((i) => i.completed).length;

  async function markComplete(id: string) {
    await fetch(`/api/my/learning/${id}/complete`, { method: "POST" });
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      <Card className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-xs uppercase tracking-wider text-slate-500">Topic</span>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All</option>
            {topics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <span className="text-sm text-slate-500">
          {done} of {items.length} modules completed
        </span>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((i) => (
          <Card key={i.id} className="space-y-2 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  {i.type} · {i.provider} · {i.minutes} min
                </p>
                <p className="mt-1 font-semibold">{i.title}</p>
              </div>
              {i.completed ? <Badge variant="active">done</Badge> : null}
            </div>
            <p className="text-xs text-slate-500">{i.topic}</p>
            <div className="flex gap-2">
              <a href={i.url} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline">Open</Button>
              </a>
              {!i.completed ? (
                <Button size="sm" variant="gold" onClick={() => markComplete(i.id)} disabled={pending}>
                  Mark complete
                </Button>
              ) : null}
              <Button size="sm" variant="ghost" onClick={() => setQuizFor(i)}>
                Take 5-Q quiz
              </Button>
            </div>
            {i.completed && typeof i.score === "number" ? (
              <p className="text-xs text-slate-500">Last quiz score: {i.score}%</p>
            ) : null}
          </Card>
        ))}
      </div>
      {quizFor ? (
        <QuizModal
          resourceId={quizFor.id}
          title={quizFor.title}
          onClose={() => {
            setQuizFor(null);
            startTransition(() => router.refresh());
          }}
        />
      ) : null}
    </div>
  );
}
