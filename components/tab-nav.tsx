"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

export interface Tab {
  key: string;
  label: string;
}

export function TabNav({
  tabs,
  basePath,
  defaultKey,
}: {
  tabs: Tab[];
  basePath: string;
  defaultKey?: string;
}) {
  return (
    <Suspense fallback={null}>
      <TabNavInner tabs={tabs} basePath={basePath} defaultKey={defaultKey} />
    </Suspense>
  );
}

function TabNavInner({
  tabs,
  basePath,
  defaultKey,
}: {
  tabs: Tab[];
  basePath: string;
  defaultKey?: string;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const active = search.get("tab") || defaultKey || tabs[0]?.key;
  return (
    <div className="border-b">
      <nav className="-mb-px flex gap-6 overflow-x-auto">
        {tabs.map((t) => {
          const href = t.key === defaultKey
            ? basePath
            : `${basePath}?tab=${t.key}`;
          const isActive = active === t.key;
          return (
            <Link
              key={t.key}
              href={href}
              className={cn(
                "whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition",
                isActive
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      {/* keep current tab key visible to server */}
      {pathname && active ? null : null}
    </div>
  );
}
