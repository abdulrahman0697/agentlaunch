"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Quiz } from "@/lib/ai/types";

export function QuizModal({
  resourceId,
  title,
  onClose,
}: {
  resourceId: string;
  title: string;
  onClose: () => void;
}) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<{ score: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/quiz", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resourceId }),
    })
      .then((r) => r.json())
      .then((j) => setQuiz(j.quiz))
      .finally(() => setLoading(false));
  }, [resourceId]);

  async function submit() {
    if (!quiz) return;
    let correct = 0;
    for (const q of quiz.questions) {
      if (answers[q.id] === q.correctAnswer) correct++;
    }
    const score = Math.round((correct / quiz.questions.length) * 100);
    await fetch(`/api/my/learning/${resourceId}/quiz-attempt`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ score, answers }),
    });
    setSubmitted({ score });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="max-h-[80vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Quiz</p>
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">×</button>
        </div>
        {loading ? (
          <p className="mt-6 text-sm text-slate-500">Generating 5 questions…</p>
        ) : !quiz ? (
          <p className="mt-6 text-sm text-rose-600">Could not load quiz.</p>
        ) : (
          <div className="mt-4 space-y-5">
            {quiz.questions.map((q) => (
              <div key={q.id} className="space-y-2">
                <p className="font-medium">
                  {q.id}. {q.question}
                </p>
                <div className="space-y-1">
                  {q.options.map((o) => {
                    const selected = answers[q.id] === o.key;
                    const isCorrect = submitted && o.key === q.correctAnswer;
                    const isWrong = submitted && selected && o.key !== q.correctAnswer;
                    return (
                      <label
                        key={o.key}
                        className={`flex cursor-pointer items-start gap-2 rounded border p-2 text-sm ${
                          isCorrect
                            ? "border-emerald-400 bg-emerald-50"
                            : isWrong
                              ? "border-rose-400 bg-rose-50"
                              : selected
                                ? "border-slate-400"
                                : ""
                        }`}
                      >
                        <input
                          type="radio"
                          className="mt-0.5"
                          name={`q-${q.id}`}
                          checked={selected}
                          disabled={!!submitted}
                          onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.key }))}
                        />
                        <span>
                          <strong>{o.key}.</strong> {o.text}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {submitted ? (
                  <p className="text-xs text-slate-500">{q.explanation}</p>
                ) : null}
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              {!submitted ? (
                <Button
                  variant="gold"
                  onClick={submit}
                  disabled={Object.keys(answers).length < quiz.questions.length}
                >
                  Submit
                </Button>
              ) : (
                <p className="text-sm">
                  You scored <strong>{submitted.score}%</strong>
                </p>
              )}
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
