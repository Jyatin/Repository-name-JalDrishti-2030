"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip } from "@/components/ui/Tooltip";

/**
 * Left icon rail, matching the reference's slim navigation column.
 *
 * Five destinations: the research story plus one per stage of the paper's
 * analytical cycle that this prototype covers. Labels name what a planner
 * does (or what the story explains), not internal system terms.
 */
const ROUTES = [
  { href: "/", label: "Research story", stage: "Problem → Traceability", icon: StoryIcon },
  { href: "/stress", label: "Water stress", stage: "Integrate · Predict", icon: MapIcon },
  { href: "/network", label: "Network", stage: "Simulate", icon: NetworkIcon },
  { href: "/optimise", label: "Interventions", stage: "Optimise · Decide", icon: BranchIcon },
  { href: "/data", label: "Data sources", stage: "Sense", icon: LayersIcon },
] as const;

export function Rail() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="flex h-full w-[52px] shrink-0 flex-col items-center border-r border-hairline bg-paper py-3"
    >
      <Link
        href="/"
        className="mb-5 grid h-8 w-8 place-items-center rounded-md bg-deep text-[13px] font-semibold text-[#e8eef0]"
        aria-label="JalDrishti home"
      >
        <span className="font-[family-name:var(--font-display)]">J</span>
      </Link>

      <ul className="flex flex-1 flex-col items-center gap-1">
        {ROUTES.map(({ href, label, stage, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Tooltip label={`${label} · ${stage}`}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative grid h-9 w-9 place-items-center rounded-md transition-colors duration-150 ${
                    active
                      ? "bg-panel text-ink shadow-[0_1px_2px_rgb(21_24_27/0.06)]"
                      : "text-ink-3 hover:bg-panel-2 hover:text-ink-2"
                  }`}
                >
                  {active && (
                    <span className="absolute -left-3 h-4 w-[2px] rounded-full bg-coral" />
                  )}
                  <Icon />
                  <span className="sr-only">{label}</span>
                </Link>
              </Tooltip>
            </li>
          );
        })}
      </ul>

      <Tooltip label="Decision support only — no autonomous control">
        <span className="grid h-8 w-8 place-items-center rounded-md text-ink-3">
          <ShieldIcon />
        </span>
      </Tooltip>
    </nav>
  );
}

const S = {
  width: 17,
  height: 17,
  viewBox: "0 0 17 17",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.35,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function StoryIcon() {
  return (
    <svg {...S} aria-hidden>
      <path d="M3 3.5h8.4l2.6 2.6V14H3z" />
      <path d="M5.2 6.6h6M5.2 9h6M5.2 11.4h3.8" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg {...S} aria-hidden>
      <path d="M2 4.6l4-1.6 5 1.9 4-1.6v9.1l-4 1.6-5-1.9-4 1.6z" />
      <path d="M6 3v10.4M11 4.9v10.3" />
    </svg>
  );
}

function NetworkIcon() {
  return (
    <svg {...S} aria-hidden>
      <circle cx="3.6" cy="8.5" r="1.7" />
      <circle cx="13.4" cy="4" r="1.7" />
      <circle cx="13.4" cy="13" r="1.7" />
      <path d="M5.2 7.7l6.6-3M5.2 9.3l6.6 3" />
    </svg>
  );
}

function BranchIcon() {
  return (
    <svg {...S} aria-hidden>
      <path d="M4 2.6v6.2c0 1.6 1.3 2.9 2.9 2.9H13" />
      <circle cx="4" cy="14" r="1.6" />
      <circle cx="4" cy="2.6" r="1.1" />
      <path d="M11 9.6L13.4 12 11 14.3" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg {...S} aria-hidden>
      <path d="M8.5 2.2l6 3.2-6 3.2-6-3.2z" />
      <path d="M2.5 9l6 3.2 6-3.2" />
      <path d="M2.5 12.3l6 3.2 6-3.2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg {...S} aria-hidden>
      <path d="M8.5 2l5 2v4.3c0 3.2-2.1 5.6-5 6.7-2.9-1.1-5-3.5-5-6.7V4z" />
      <path d="M6.4 8.5l1.5 1.5 2.8-3" />
    </svg>
  );
}
