"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AICoach() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi — I'm the Sia AI Coach. Ask me anything about your agent, your blueprint, your business case, or how to narrow scope. I'm direct and I'll push back when something won't work.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    if (!input.trim() || busy) return;
    const user = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: user }]);
    setMessages((m) => [...m, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: user, currentPage: pathname }),
      });
      if (!res.ok || !res.body) {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: "Sorry — coach is temporarily unavailable." };
          return copy;
        });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex h-14 items-center gap-2 rounded-full bg-[#0B1F3A] px-5 text-white shadow-lg hover:bg-[#0E1B2C]"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C5A572] text-xs font-semibold text-[#0B1F3A]">
            AI
          </span>
          Sia AI Coach
        </button>
      ) : (
        <div className="fixed bottom-5 right-5 z-50 flex h-[520px] w-[400px] flex-col rounded-xl border bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b bg-[#0B1F3A] px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">Sia AI Coach</p>
              <p className="text-xs text-white/60">A senior consultant, on-demand</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md px-2 text-white/70 hover:bg-white/10 hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-md px-3 py-2 ${
                  m.role === "user"
                    ? "ml-8 bg-slate-100"
                    : "mr-8 bg-[#0B1F3A]/5"
                }`}
              >
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  {m.role === "user" ? "You" : "Coach"}
                </p>
                <pre className="mt-1 whitespace-pre-wrap font-sans text-sm text-slate-800">
                  {m.content || (busy && i === messages.length - 1 ? "…" : "")}
                </pre>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="border-t p-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={2}
              placeholder="Ask anything (Enter to send, Shift+Enter for newline)"
            />
            <Button onClick={send} variant="gold" size="sm" className="mt-2 w-full" disabled={busy}>
              {busy ? "Thinking…" : "Send"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
