"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SiaAdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <SiaAdminLoginInner />
    </Suspense>
  );
}

function SiaAdminLoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const from = search.get("from") || "/admin/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/auth/admin-login", {
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
    router.push(from);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0B1F3A] to-[#0E1B2C] text-white">
      <div className="container flex min-h-screen items-center justify-center py-16">
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <p className="mb-2 text-xs uppercase tracking-wider text-[#C5A572]">
            Sia Partners
          </p>
          <h1 className="text-2xl font-semibold">Sia Admin Console</h1>
          <p className="mt-1 text-sm text-white/60">
            Super admin access to all client engagements.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">
                Work email
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 text-white placeholder:text-white/40"
                placeholder="admin@sia-partners.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 text-white placeholder:text-white/40"
              />
            </div>
            {error ? (
              <p className="text-sm text-red-300">{error}</p>
            ) : null}
            <Button
              type="submit"
              variant="gold"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-xs text-white/40">
            Client admin or participant?{" "}
            <Link href="/login" className="underline">
              Use the client login
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
