"use client";

import { useMemo, useState } from "react";
import type { ForecastRun } from "@/lib/forecast";
import type { Portfolio } from "@/types";
import { formatLakh } from "@/lib/format";

/**
 * All charts are hand-built SVG. A charting library would bring its own visual
 * defaults; drawing them directly keeps the bar weights, tick style and colour
 * meaning consistent with the rest of the system.
 */

/** Forecast with an uncertainty band that widens with horizon (paper §4.12). */
export function ForecastChart({ run }: { run: ForecastRun }) {
  const W = 560;
  const H = 180;
  const PAD = { l: 6, r: 6, t: 12, b: 20 };

  const hist = run.history.slice(-24);
  const all = [
    ...hist.map((p) => p.value),
    ...run.forecast.map((p) => p.upper),
    ...run.forecast.map((p) => p.lower),
  ];
  const min = Math.min(...all) * 0.96;
  const max = Math.max(...all) * 1.04;
  const total = hist.length + run.forecast.length;

  const x = (i: number) =>
    PAD.l + (i / (total - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) =>
    PAD.t + (1 - (v - min) / (max - min)) * (H - PAD.t - PAD.b);

  const histLine = hist
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join("");

  const fcStart = hist.length - 1;
  const fcLine =
    `M${x(fcStart).toFixed(1)} ${y(hist[hist.length - 1].value).toFixed(1)}` +
    run.forecast
      .map((p, i) => `L${x(fcStart + 1 + i).toFixed(1)} ${y(p.value).toFixed(1)}`)
      .join("");

  const band =
    `M${x(fcStart).toFixed(1)} ${y(hist[hist.length - 1].value).toFixed(1)}` +
    run.forecast
      .map((p, i) => `L${x(fcStart + 1 + i).toFixed(1)} ${y(p.upper).toFixed(1)}`)
      .join("") +
    run.forecast
      .slice()
      .reverse()
      .map((p, i) =>
        `L${x(fcStart + run.forecast.length - i).toFixed(1)} ${y(p.lower).toFixed(1)}`,
      )
      .join("") +
    "Z";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Demand forecast with uncertainty band">
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1={PAD.l}
          x2={W - PAD.r}
          y1={PAD.t + t * (H - PAD.t - PAD.b)}
          y2={PAD.t + t * (H - PAD.t - PAD.b)}
          stroke="var(--color-hairline)"
          strokeWidth="1"
        />
      ))}
      <path d={band} fill="var(--color-coral)" opacity="0.13" />
      <path d={histLine} fill="none" stroke="var(--color-ink)" strokeWidth="1.6" />
      <path
        d={fcLine}
        fill="none"
        stroke="var(--color-coral)"
        strokeWidth="1.6"
        strokeDasharray="4 3"
      />
      <line
        x1={x(fcStart)}
        x2={x(fcStart)}
        y1={PAD.t}
        y2={H - PAD.b}
        stroke="var(--color-ink-3)"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      <text x={x(fcStart) + 4} y={PAD.t + 8} fontSize="9" fill="var(--color-ink-3)">
        forecast
      </text>
    </svg>
  );
}

/** Pareto scatter over two selectable objectives (paper §4.10). */
export function ParetoPlot({
  front,
  selectedId,
  onSelect,
  xKey,
  yKey,
}: {
  front: Portfolio[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  xKey: "totalCost" | "populationProtected";
  yKey: "residualStress" | "equityWeightedProtection";
}) {
  const W = 560;
  const H = 260;
  const PAD = { l: 44, r: 14, t: 14, b: 32 };
  const [hover, setHover] = useState<string | null>(null);

  const bounds = useMemo(() => {
    const xs = front.map((p) => p[xKey]);
    const ys = front.map((p) => p[yKey]);
    return {
      x0: Math.min(...xs),
      x1: Math.max(...xs),
      y0: Math.min(...ys),
      y1: Math.max(...ys),
    };
  }, [front, xKey, yKey]);

  const px = (v: number) =>
    PAD.l + ((v - bounds.x0) / (bounds.x1 - bounds.x0 || 1)) * (W - PAD.l - PAD.r);
  const py = (v: number) =>
    PAD.t + (1 - (v - bounds.y0) / (bounds.y1 - bounds.y0 || 1)) * (H - PAD.t - PAD.b);

  const xLabel = xKey === "totalCost" ? "Total cost" : "Population protected";
  const yLabel =
    yKey === "residualStress" ? "Residual stress" : "Equity-weighted protection";

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label={`Pareto front: ${xLabel} against ${yLabel}`}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={PAD.l}
            x2={W - PAD.r}
            y1={PAD.t + t * (H - PAD.t - PAD.b)}
            y2={PAD.t + t * (H - PAD.t - PAD.b)}
            stroke="var(--color-hairline)"
            strokeWidth="1"
          />
        ))}
        {front.map((p) => {
          const isSel = p.id === selectedId;
          const isHov = p.id === hover;
          return (
            <circle
              key={p.id}
              cx={px(p[xKey])}
              cy={py(p[yKey])}
              r={isSel ? 6 : isHov ? 5 : 4}
              fill={p.hydraulicallyVerified ? "var(--color-coral)" : "none"}
              stroke="var(--color-coral)"
              strokeWidth="1.5"
              opacity={selectedId && !isSel ? 0.42 : 1}
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHover(p.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect(p.id)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSelect(p.id);
              }}
            >
              <title>{`${p.id} · ${formatLakh(p.totalCost)} · ${p.wardCount} wards`}</title>
            </circle>
          );
        })}
        <text x={PAD.l} y={H - 8} fontSize="10" fill="var(--color-ink-2)">
          {xLabel} →
        </text>
        <text
          x={-(H / 2)}
          y={12}
          fontSize="10"
          fill="var(--color-ink-2)"
          transform="rotate(-90)"
          textAnchor="middle"
        >
          {yLabel} →
        </text>
      </svg>
    </div>
  );
}

/** Node pressure profile for the Level 2 view. */
export function PressureProfile({
  values,
  threshold,
}: {
  values: { id: string; pressure: number }[];
  threshold: number;
}) {
  const H = 150;
  const max = Math.max(...values.map((v) => v.pressure), threshold) * 1.1;
  const slot = 100 / values.length;

  return (
    <svg viewBox={`0 0 100 ${H}`} className="w-full" style={{ height: H }} preserveAspectRatio="none" aria-label="Node pressure profile">
      <line
        x1="0"
        x2="100"
        y1={H - 14 - (threshold / max) * (H - 24)}
        y2={H - 14 - (threshold / max) * (H - 24)}
        stroke="var(--color-coral)"
        strokeWidth="0.5"
        strokeDasharray="1.5 1.5"
      />
      {values.map((v, i) => {
        const h = (v.pressure / max) * (H - 24);
        const below = v.pressure < threshold;
        return (
          <rect
            key={v.id}
            className="bar-grow"
            style={{ animationDelay: `${i * 9}ms` }}
            x={i * slot + slot * 0.18}
            y={H - 14 - h}
            width={slot * 0.64}
            height={h}
            rx="0.5"
            fill={below ? "var(--color-coral)" : "#69a0a8"}
          >
            <title>{`${v.id}: ${v.pressure.toFixed(1)} m`}</title>
          </rect>
        );
      })}
    </svg>
  );
}
