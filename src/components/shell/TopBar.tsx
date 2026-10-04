"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const ROUTES = [
  { href: "/", label: "Research story" },
  { href: "/stress", label: "Water stress" },
  { href: "/network", label: "Network" },
  { href: "/optimise", label: "Interventions" },
  { href: "/data", label: "Data sources" },
] as const;

/** Persistent navigation header, kept visually quiet above dashboard content. */
export function TopBar({ context }: { context: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="hair-b relative z-30 flex h-12 shrink-0 items-center gap-3 bg-paper px-3 sm:px-4">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        aria-label="Toggle navigation"
        className="grid h-9 w-9 place-items-center rounded-md text-ink-2 transition-colors hover:bg-panel-2 md:hidden"
      >
        <svg width="17" height="17" viewBox="0 0 17 17" aria-hidden>
          <path
            d="M2.5 4.5h12M2.5 8.5h12M2.5 12.5h12"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div className="flex min-w-0 items-baseline gap-2">
        <span className="font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-[-0.02em]">
          JalDrishti
        </span>
        <span className="figure hidden text-[11px] text-ink-3 sm:inline">
          2030
        </span>
        <span className="hidden truncate text-[12px] text-ink-2 lg:inline">
          · {context}
        </span>
      </div>

      {menuOpen && (
        <nav className="panel panel-float reveal absolute left-3 right-3 top-[52px] p-1.5 md:hidden">
          <ul>
            {ROUTES.map((r) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex min-h-[44px] items-center rounded-md px-3 text-[14px] transition-colors ${
                    pathname === r.href
                      ? "bg-panel-2 font-medium text-ink"
                      : "text-ink-2 hover:bg-panel-2"
                  }`}
                >
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
