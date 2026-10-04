"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IS_FIXTURE_MODE } from "@/lib/api";
import { Tooltip } from "@/components/ui/Tooltip";

const ROUTES = [
  { href: "/", label: "Research story" },
  { href: "/stress", label: "Water stress" },
  { href: "/network", label: "Network" },
  { href: "/optimise", label: "Interventions" },
  { href: "/data", label: "Data sources" },
] as const;

/**
 * Persistent header. Its job is the synthetic-share readout on the right: the
 * share of what is currently on screen that was fabricated. It is always
 * visible and cannot be dismissed.
 */
export function TopBar({
  syntheticShare,
  context,
}: {
  syntheticShare: number;
  context: string;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const pct = Math.round(syntheticShare * 100);

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

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {IS_FIXTURE_MODE && (
          <Tooltip label="No backend is connected. Every figure is served from local fixtures.">
            <span className="hidden items-center gap-1.5 rounded border border-hairline-2 bg-panel px-2 py-[3px] text-[10.5px] text-ink-2 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c8a33a]" />
              Prototype data
            </span>
          </Tooltip>
        )}

        <Tooltip label={`${pct}% of the weight behind what you are looking at rests on fabricated inputs.`}>
          <span className="flex items-center gap-2 rounded border border-hairline-2 bg-panel px-2 py-[3px]">
            <span className="hatch h-3 w-3 rounded-[2px] border border-hairline-2" />
            <span className="figure text-[11px] text-ink">{pct}%</span>
            <span className="hidden text-[10.5px] text-ink-2 sm:inline">
              synthetic
            </span>
          </span>
        </Tooltip>
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
