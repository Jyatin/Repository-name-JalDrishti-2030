"use client";

import type { Grade } from "@/types";
import { Tooltip } from "@/components/ui/Tooltip";

/**
 * Resolution grade from the paper's Phase 2 audit (Table 3).
 *
 * A: directly usable ward-level numbers
 * B: directly usable DMA/zone-level numbers
 * C: spatial data that can reasonably be aggregated
 * D: categorical or qualitative evidence only
 * E: not available at the required operational resolution
 */
const GRADE_MEANING: Record<Grade, string> = {
  A: "Directly usable ward-level numbers.",
  B: "Directly usable zone-level numbers.",
  C: "Spatial data that can reasonably be aggregated to wards.",
  D: "Categorical evidence only — not a measurement.",
  E: "Not available at the resolution this model needs.",
};

const GRADE_STYLE: Record<Grade, string> = {
  A: "bg-sage text-[#33401a] border-[#b9c795]",
  B: "bg-sage text-[#33401a] border-[#b9c795]",
  C: "bg-[#f4efd8] text-[#6a5a1e] border-[#ddd2a4]",
  D: "bg-[#f7e2d5] text-[#8a4726] border-[#e6c3ac]",
  E: "bg-coral-soft text-[#8c2a17] border-[#e0a493]",
};

export function GradeChip({
  grade,
  size = "sm",
}: {
  grade: Grade;
  size?: "sm" | "xs";
}) {
  return (
    <Tooltip label={`Grade ${grade} — ${GRADE_MEANING[grade]}`}>
      <span
        className={`figure inline-flex items-center justify-center rounded border font-medium ${
          GRADE_STYLE[grade]
        } ${size === "xs" ? "h-4 w-4 text-[9.5px]" : "h-[18px] w-[18px] text-[10.5px]"}`}
      >
        {grade}
      </span>
    </Tooltip>
  );
}

/**
 * Marks a value as fabricated. Appears wherever synthetic data reaches the
 * screen — this is the paper's central finding made impossible to overlook.
 */
export function SyntheticTag({
  reason,
  compact = false,
}: {
  reason?: string;
  compact?: boolean;
}) {
  return (
    <Tooltip
      label={
        reason ??
        "Generated under a documented seed because no usable public series exists at this resolution."
      }
    >
      <span
        className={`inline-flex items-center gap-1 rounded border border-hairline-2 bg-panel-2 font-medium text-ink-2 ${
          compact ? "px-1 py-0 text-[9.5px]" : "px-1.5 py-[1px] text-[10px]"
        }`}
      >
        <span className="hatch h-2 w-2 rounded-[2px] border border-hairline-2" />
        Synthetic
      </span>
    </Tooltip>
  );
}

/** Confidence read-out, paired with any score that carries one. */
export function ConfidenceBar({
  value,
  width = 44,
}: {
  value: number;
  width?: number;
}) {
  return (
    <Tooltip
      label={`Confidence ${Math.round(value * 100)}% — weighted by the resolution grade of every indicator feeding this score.`}
    >
      <span className="inline-flex items-center gap-1.5">
        <span
          className="relative block h-1 overflow-hidden rounded-full bg-hairline"
          style={{ width }}
        >
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-ink-2 transition-[width] duration-500"
            style={{ width: `${Math.round(value * 100)}%` }}
          />
        </span>
        <span className="figure text-[10.5px] text-ink-3">
          {Math.round(value * 100)}
        </span>
      </span>
    </Tooltip>
  );
}
