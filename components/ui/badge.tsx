import * as React from "react";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  default: "bg-slate-100 text-slate-800 border-slate-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-slate-50 text-slate-600 border-slate-200",
  archived: "bg-slate-50 text-slate-400 border-slate-200",
  open: "bg-blue-50 text-blue-700 border-blue-200",
  claimed: "bg-violet-50 text-violet-700 border-violet-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-rose-50 text-rose-700 border-rose-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-50 text-slate-600 border-slate-200",
};

export function Badge({
  variant = "default",
  className,
  children,
}: {
  variant?: keyof typeof styles | string;
  className?: string;
  children: React.ReactNode;
}) {
  const cls = styles[variant] || styles.default;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        cls,
        className,
      )}
    >
      {children}
    </span>
  );
}
