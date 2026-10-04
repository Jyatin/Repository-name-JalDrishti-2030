"use client";

import { useState, type ReactNode } from "react";

interface TooltipProps {
  label: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom";
}

/** Small, dependency-free tooltip. Keyboard-reachable, not hover-only. */
export function Tooltip({ label, children, side = "top" }: TooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute left-1/2 z-50 w-max max-w-[260px] -translate-x-1/2 rounded-md bg-deep px-2.5 py-1.5 text-[11.5px] leading-snug text-[#e8eef0] shadow-lg ${
            side === "top" ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"
          }`}
        >
          {label}
        </span>
      )}
    </span>
  );
}
