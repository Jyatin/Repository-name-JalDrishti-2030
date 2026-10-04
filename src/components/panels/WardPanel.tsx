"use client";

import type { ReactNode } from "react";

import { INDICATOR_BY_KEY } from "@/data/catalogue";
import { formatCompact, formatInt, formatPercent, formatScore } from "@/lib/format";
import { stressClass, STRESS_LABEL } from "@/lib/wsi";
import { vulnerability } from "@/lib/optimise";
import { CountUp } from "@/components/ui/CountUp";
import { ConfidenceBar, GradeChip, SyntheticTag } from "@/components/provenance/GradeChip";
import type { Ward, WsiRun } from "@/types";

/**
 * The reference's left column: place eyebrow, oversized name, two labelled
 * readouts, then supporting detail. Here the oversized item is the ward and its
 * stress classification, because that is the thing a planner is deciding about.
 */
export function WardPanel({
  ward,
  wsi,
  onTrace,
}: {
  ward: Ward;
  wsi: WsiRun;
  onTrace: () => void;
}) {
  const result = wsi.byWard[ward.id];
  const cls = stressClass(result.score);
  const v = vulnerability(ward);

  const contributions = [...result.contributions].sort(
    (a, b) => b.contribution - a.contribution,
  );

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-4">
        <p className="flex items-center gap-1.5 text-[11.5px] text-ink-2">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
            <path
              d="M5.5 10s3.6-3.3 3.6-5.9A3.6 3.6 0 0 0 1.9 4.1C1.9 6.7 5.5 10 5.5 10z"
              stroke="currentColor"
              strokeWidth="1.1"
            />
            <circle cx="5.5" cy="4.2" r="1.2" stroke="currentColor" strokeWidth="1.1" />
          </svg>
          {ward.zone} zone · Bengaluru
        </p>

        <h1 className="mt-1.5 text-[38px] leading-[0.98] sm:text-[44px]">
          {ward.code}
        </h1>

        <div className="mt-3 space-y-1.5">
          <ReadoutRow
            swatch="var(--color-coral)"
            label="Water-stress index"
            value={
              <span className="flex items-center gap-2">
                <CountUp
                  value={result.score}
                  format={formatScore}
                  className="text-[15px] font-medium"
                />
                <span className="text-[12px] text-ink-2">
                  {STRESS_LABEL[cls]}
                </span>
              </span>
            }
          />
          <ReadoutRow
            swatch="var(--color-deep)"
            label="Priority rank"
            value={
              <span className="figure text-[15px] font-medium">
                {result.rank}
                <span className="text-[12px] font-normal text-ink-2">
                  {" "}
                  of {wsi.results.length}
                </span>
              </span>
            }
          />
        </div>

        <button
          onClick={onTrace}
          className="mt-3.5 flex w-full items-center justify-between gap-2 rounded-md border border-hairline bg-panel-2 px-3 py-2 text-left transition-colors duration-150 hover:border-hairline-2 hover:bg-panel"
        >
          <span className="text-[12px] font-medium">
            Why is this ward ranked {result.rank}?
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-ink-2">
            Trace
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
              <path
                d="M3.6 1.8L7.4 5.5 3.6 9.2"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-px bg-hairline">
        <Tile
          label="Population"
          value={<CountUp value={ward.population} format={formatCompact} />}
          note="Gridded aggregation"
          grade="C"
        />
        <Tile
          label="Connections"
          value={<CountUp value={ward.connections} format={formatInt} />}
          note="Synthetic"
          tone="muted"
        />
        <Tile
          label="Vulnerability"
          value={<CountUp value={v} format={(n) => n.toFixed(2)} />}
          note="Groundwater, tanker, reliability"
          tone="accent"
        />
        <Tile
          label="Area"
          value={<CountUp value={ward.areaKm2} format={(n) => n.toFixed(1)} />}
          note="km² (schematic)"
        />
      </div>

      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-semibold">What drives this score</h2>
          <ConfidenceBar value={result.confidence} />
        </div>

        <ul className="mt-3 space-y-2.5">
          {contributions.map((c) => {
            const def = INDICATOR_BY_KEY[c.key];
            const share = c.contribution / Math.max(result.score, 1e-9);
            return (
              <li key={c.key}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-[12px] font-medium">
                      {def.label}
                    </span>
                    <GradeChip grade={def.grade} size="xs" />
                  </span>
                  <span className="figure shrink-0 text-[11.5px] text-ink-2">
                    {formatPercent(share)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-hairline">
                    <span
                      className="absolute inset-y-0 left-0 rounded-full bg-ink transition-[width] duration-500"
                      style={{ width: `${Math.min(100, share * 100)}%` }}
                    />
                  </span>
                  <span className="figure w-[64px] shrink-0 text-right text-[10.5px] text-ink-3">
                    w {c.weight.toFixed(3)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        {ward.notifiedCritical && (
          <p className="mt-4 rounded-md border border-hairline bg-panel-2 px-3 py-2 text-[11.5px] leading-snug text-ink-2">
            This ward carries a groundwater-critical notification. That is
            categorical evidence of vulnerability — it is not a measurement, and
            it does not enter the index as one.
          </p>
        )}
      </div>
    </div>
  );
}

function ReadoutRow({
  swatch,
  label,
  value,
}: {
  swatch: string;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 rounded bg-panel-2 px-2 py-1">
        <span
          className="h-2.5 w-2.5 rounded-[2px]"
          style={{ background: swatch }}
        />
        <span className="text-[11.5px] text-ink-2">{label}</span>
      </span>
      {value}
    </div>
  );
}

function Tile({
  label,
  value,
  note,
  grade,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  note: string;
  grade?: "A" | "B" | "C" | "D" | "E";
  tone?: "default" | "accent" | "muted";
}) {
  const bg =
    tone === "accent"
      ? "bg-sage"
      : tone === "muted"
        ? "bg-panel-2"
        : "bg-panel";
  return (
    <div className={`${bg} px-4 py-3`}>
      <p className="flex items-center gap-1.5 text-[11px] text-ink-2">
        {label}
        {grade && <GradeChip grade={grade} size="xs" />}
      </p>
      <p className="mt-0.5 text-[20px] font-semibold leading-none">{value}</p>
      <p className="mt-1 flex items-center gap-1 text-[10.5px] text-ink-3">
        {note === "Synthetic" ? <SyntheticTag compact /> : note}
      </p>
    </div>
  );
}
