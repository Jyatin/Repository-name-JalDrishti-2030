import { Tooltip } from "@/components/ui/Tooltip";

/**
 * The four-way status distinction the research story is built around.
 *
 * This is a different axis from GradeChip (A-E resolution grade): a value can
 * be grade-C AND "real", or grade-E AND "synthetic". StatusBadge instead marks
 * whether a whole FEATURE is implemented, fabricated, described-but-unbuilt, or
 * experimentally confirmed. Used at section/feature level across the site.
 */
export type PaperStatus = "real" | "synthetic" | "proposed" | "validated";

const META: Record<
  PaperStatus,
  { label: string; meaning: string; className: string }
> = {
  real: {
    label: "Real",
    meaning: "Sourced or measured evidence — public data or the paper's own reported finding.",
    className: "border-[#b9c795] bg-sage text-[#33401a]",
  },
  synthetic: {
    label: "Synthetic",
    meaning: "Fabricated under a documented seed to demonstrate the method. Not a Bengaluru measurement.",
    className: "border-hairline-2 bg-panel-2 text-ink-2",
  },
  proposed: {
    label: "Proposed",
    meaning: "Methodology described in the paper. Not yet implemented or run.",
    className: "border-[#ddd2a4] bg-[#f4efd8] text-[#6a5a1e]",
  },
  validated: {
    label: "Validated",
    meaning: "Confirmed by an actual experiment. Reserved — nothing in this prototype qualifies yet.",
    className: "border-[#e0a493] bg-coral-soft text-[#8c2a17]",
  },
};

export function StatusBadge({
  status,
  size = "sm",
}: {
  status: PaperStatus;
  size?: "sm" | "xs";
}) {
  const m = META[status];
  return (
    <Tooltip label={m.meaning}>
      <span
        className={`inline-flex items-center rounded-full border font-medium tracking-[0.01em] uppercase ${m.className} ${
          size === "xs" ? "px-1.5 py-[1px] text-[9px]" : "px-2 py-[2px] text-[10px]"
        }`}
      >
        {m.label}
      </span>
    </Tooltip>
  );
}
