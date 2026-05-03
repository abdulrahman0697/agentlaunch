"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export function SidebarNav({
  items,
  brand,
  footer,
}: {
  items: NavItem[];
  brand: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <aside className="sia-sidebar flex w-64 shrink-0 flex-col text-white">
      <div className="px-6 py-6">{brand}</div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((it) => {
          const active =
            pathname === it.href ||
            (it.href !== "/" && pathname.startsWith(it.href + "/")) ||
            pathname.startsWith(it.href + "?");
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white",
              )}
            >
              {it.icon ? <span className="opacity-80">{it.icon}</span> : null}
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
      {footer ? <div className="border-t border-white/10 p-4">{footer}</div> : null}
    </aside>
  );
}
