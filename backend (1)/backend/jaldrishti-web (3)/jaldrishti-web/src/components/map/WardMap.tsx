"use client";

import { useMemo, useState } from "react";
import { makeProjection, ringBounds, ringToPath } from "@/lib/geo";
import { stressClass, STRESS_LABEL, type StressClass } from "@/lib/wsi";
import { formatScore } from "@/lib/format";
import type { Ward, WsiRun } from "@/types";

const VIEW_W = 1000;
const VIEW_H = 760;

const STRESS_FILL: Record<StressClass, string> = {
  secure: "var(--color-stress-1)",
  watch: "var(--color-stress-2)",
  elevated: "var(--color-stress-3)",
  high: "var(--color-stress-4)",
  critical: "var(--color-stress-5)",
};

interface WardMapProps {
  wards: Ward[];
  boundary: [number, number][];
  wsi: WsiRun;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Hand-built SVG choropleth. No tile provider and no map library: the geometry
 * is schematic, the aesthetic is flat greyscale like the reference, and owning
 * the renderer means the synthetic-share hatching can sit inside the fill
 * rather than floating above it.
 */
export function WardMap({
  wards,
  boundary,
  wsi,
  selectedId,
  onSelect,
}: WardMapProps) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  const projection = useMemo(
    () => makeProjection(boundary, VIEW_W, VIEW_H, 48),
    [boundary],
  );

  const boundaryPath = useMemo(
    () => ringToPath(boundary, projection),
    [boundary, projection],
  );

  const cells = useMemo(
    () =>
      wards.map((w) => ({
        ward: w,
        path: ringToPath(w.ring, projection),
        result: wsi.byWard[w.id],
      })),
    [wards, projection, wsi],
  );

  const active = selectedId ?? hoverId;
  const activeWard = wards.find((w) => w.id === active) ?? null;
  const marquee = activeWard ? ringBounds(activeWard.ring, projection) : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#eeeeea]">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Schematic ward map coloured by water-stress score"
      >
        <defs>
          {/* Diagonal hatch marking fabricated values. */}
          <pattern
            id="synthetic-hatch"
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="7"
              stroke="var(--color-ink)"
              strokeWidth="1"
              opacity="0.16"
            />
          </pattern>

          {/* Faint contour texture, echoing the reference's terrain map. */}
          <pattern
            id="terrain"
            width="180"
            height="180"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="90" cy="90" r="74" fill="none" stroke="var(--color-ink)" strokeWidth="0.5" opacity="0.045" />
            <circle cx="90" cy="90" r="52" fill="none" stroke="var(--color-ink)" strokeWidth="0.5" opacity="0.045" />
            <circle cx="90" cy="90" r="30" fill="none" stroke="var(--color-ink)" strokeWidth="0.5" opacity="0.045" />
          </pattern>

          <clipPath id="city-clip">
            <path d={boundaryPath} />
          </clipPath>
        </defs>

        <rect width={VIEW_W} height={VIEW_H} fill="url(#terrain)" />

        {/* City silhouette sits under the wards to give the lattice an edge. */}
        <path
          d={boundaryPath}
          fill="#e4e4de"
          stroke="var(--color-hairline-2)"
          strokeWidth="1.2"
        />

        <g clipPath="url(#city-clip)">
          {cells.map(({ ward, path, result }) => {
            const cls = stressClass(result.score);
            const isActive = ward.id === active;
            const isSelected = ward.id === selectedId;
            const dimmed = Boolean(active) && !isActive;

            return (
              <g key={ward.id}>
                <path
                  d={path}
                  className="ward-cell"
                  fill={STRESS_FILL[cls]}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? 2 : 1}
                  opacity={dimmed ? 0.52 : 1}
                  onMouseEnter={() => setHoverId(ward.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => onSelect(ward.id)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${ward.code}, ${STRESS_LABEL[cls]} stress, score ${formatScore(result.score)}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(ward.id);
                    }
                  }}
                />
                {/* Hatch density carries the ward's synthetic share. */}
                <path
                  d={path}
                  fill="url(#synthetic-hatch)"
                  opacity={dimmed ? result.syntheticShare * 0.5 : result.syntheticShare}
                  pointerEvents="none"
                />
                {ward.notifiedCritical && (
                  <circle
                    cx={projection.project(...ward.centroid)[0]}
                    cy={projection.project(...ward.centroid)[1]}
                    r="2.6"
                    fill="var(--color-deep)"
                    opacity={dimmed ? 0.4 : 0.85}
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* Selection marquee, lifted from the reference's dashed bounding box. */}
        {marquee && (
          <g className="marquee" pointerEvents="none">
            <rect
              x={marquee.x - 14}
              y={marquee.y - 14}
              width={marquee.w + 28}
              height={marquee.h + 28}
              fill="none"
              stroke="var(--color-coral)"
              strokeWidth="1.3"
              strokeDasharray="5 4"
            />
            {[
              [marquee.x - 14, marquee.y - 14],
              [marquee.x + marquee.w + 14, marquee.y - 14],
              [marquee.x - 14, marquee.y + marquee.h + 14],
              [marquee.x + marquee.w + 14, marquee.y + marquee.h + 14],
            ].map(([cx, cy], i) => (
              <rect
                key={i}
                x={cx - 3.5}
                y={cy - 3.5}
                width="7"
                height="7"
                fill="var(--color-coral)"
              />
            ))}
          </g>
        )}
      </svg>

      {hoverId && hoverId !== selectedId && (
        <HoverCard ward={wards.find((w) => w.id === hoverId)!} wsi={wsi} />
      )}
    </div>
  );
}

function HoverCard({ ward, wsi }: { ward: Ward; wsi: WsiRun }) {
  const result = wsi.byWard[ward.id];
  const cls = stressClass(result.score);
  return (
    <div className="panel panel-float pointer-events-none absolute left-4 top-4 w-[196px] px-3 py-2.5">
      <p className="figure text-[11px] text-ink-3">{ward.code}</p>
      <p className="mt-0.5 flex items-baseline gap-1.5 text-[13px] font-semibold">
        {STRESS_LABEL[cls]}
        <span className="figure text-[12px] font-normal text-ink-2">
          {formatScore(result.score)}
        </span>
      </p>
      <p className="mt-1 text-[11px] text-ink-2">
        Rank {result.rank} of {wsi.results.length} · {ward.zone}
      </p>
    </div>
  );
}

/** Legend for the stress ramp and the hatch. Used beside the map. */
export function StressLegend() {
  const classes: StressClass[] = [
    "secure",
    "watch",
    "elevated",
    "high",
    "critical",
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-1.5">
        {classes.map((c) => (
          <span key={c} className="flex items-center gap-1">
            <span
              className="h-2.5 w-2.5 rounded-[2px]"
              style={{ background: STRESS_FILL[c] }}
            />
            <span className="text-[10.5px] text-ink-2">{STRESS_LABEL[c]}</span>
          </span>
        ))}
      </div>
      <span className="flex items-center gap-1.5">
        <span className="hatch h-2.5 w-2.5 rounded-[2px] border border-hairline-2" />
        <span className="text-[10.5px] text-ink-2">Synthetic share</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-deep" />
        <span className="text-[10.5px] text-ink-2">Notified critical</span>
      </span>
    </div>
  );
}
