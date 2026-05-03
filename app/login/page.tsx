"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ClientLoginPage() {
  return (
    <Suspense fallback={null}>
      <ClientLoginInner />
    </Suspense>
  );
}

function ClientLoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const from = search.get("from");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/auth/client-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Invalid credentials");
      return;
    }
    const j = await res.json();
    router.push(from || j.redirect);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container flex min-h-screen items-center justify-center py-16">
        <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-md">
          <p className="mb-2 text-xs uppercase tracking-wider text-[#8A1538]">
            AgentLaunch
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Client &amp; Participant Login
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Project admins and AI Champions sign in here.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourorg.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : null}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-xs text-slate-500">
            Sia internal team?{" "}
            <Link href="/admin/login" className="underline">
              Sia Admin login
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
