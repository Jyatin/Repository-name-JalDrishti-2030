"use client";

import { useMemo, useState } from "react";
import { NETWORK_LINKS, NETWORK_META, NETWORK_NODES, SCENARIOS } from "@/data/interventions";
import { illustrativePressure } from "@/lib/forecast";
import { Rail } from "@/components/shell/Rail";
import { TopBar } from "@/components/shell/TopBar";
import { Panel } from "@/components/ui/Panel";
import { CountUp } from "@/components/ui/CountUp";
import { Tooltip } from "@/components/ui/Tooltip";
import { PressureProfile } from "@/components/charts/Charts";

const MIN_PRESSURE = 12; // metres of head

type Perturbation = "none" | "leak" | "pump" | "supply";

const PERTURBATIONS: { id: Perturbation; label: string; detail: string }[] = [
  { id: "none", label: "Baseline", detail: "Network under its base demand pattern." },
  { id: "leak", label: "Leak on P14", detail: "A sustained loss on a mid-trunk segment." },
  { id: "pump", label: "Pump outage", detail: "Source head lost on one branch." },
  { id: "supply", label: "Supply reduction", detail: "Reservoir output cut by a fifth." },
];

export default function NetworkPage() {
  const [perturbation, setPerturbation] = useState<Perturbation>("none");
  const [scenarioId, setScenarioId] = useState<"A" | "B" | "C" | "D">("A");
  const [hoverNode, setHoverNode] = useState<string | null>(null);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!;

  const state = useMemo(() => {
    const source = NETWORK_NODES.find((n) => n.kind === "reservoir")!;
    const multiplier =
      scenario.demandMultiplier *
      (perturbation === "leak" ? 1.45 : 1) *
      (perturbation === "pump" ? 1.7 : 1) *
      (perturbation === "supply" ? 1.32 : 1);

    const nodes = NETWORK_NODES.filter((n) => n.kind === "junction").map((n) => {
      const d = Math.hypot(n.x - source.x, n.y - source.y);
      return {
        ...n,
        distance: d,
        pressure: illustrativePressure(d, n.elevation, multiplier),
      };
    });

    const below = nodes.filter((n) => n.pressure < MIN_PRESSURE);
    const unmet = below.reduce(
      (a, n) => a + n.baseDemand * (1 - n.pressure / MIN_PRESSURE),
      0,
    );

    return {
      nodes,
      below: below.length,
      unmet,
      feasible: below.length <= 2,
      meanPressure: nodes.reduce((a, n) => a + n.pressure, 0) / nodes.length,
    };
  }, [perturbation, scenario]);

  const nodeById = new Map(state.nodes.map((n) => [n.id, n]));

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <TopBar syntheticShare={1} context="Level 2 representative network" />
      <div className="flex min-h-0 flex-1">
        <div className="hidden md:block">
          <Rail />
        </div>

        <main className="thin-scroll flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          <aside className="reveal w-full shrink-0 border-hairline bg-panel px-5 py-4 lg:w-[372px] lg:overflow-y-auto lg:border-r">
            <p className="text-[11.5px] text-ink-2">Representative zone</p>
            <h1 className="mt-1.5 text-[36px] leading-[0.98]">
              {NETWORK_META.name}
            </h1>

            <div className="mt-3 rounded-md border border-coral-soft bg-[#fdf4f1] px-3 py-2.5">
              <p className="text-[11.5px] font-semibold text-[#8c2a17]">
                Not a calibrated Bengaluru model
              </p>
              <p className="mt-1 text-[11px] leading-snug text-[#8c2a17]">
                {NETWORK_META.provenanceNote} Pressures shown here come from a
                distance-and-elevation falloff, not a solver. The EPANET/WNTR
                run belongs to the backend phase.
              </p>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-px bg-hairline">
              <Stat label="Junctions" value={NETWORK_META.nodeCount - 1} />
              <Stat label="Pipes" value={NETWORK_META.linkCount} />
              <Stat
                label="Mean head"
                value={state.meanPressure}
                suffix=" m"
                decimals={1}
              />
              <Stat
                label="Below minimum"
                value={state.below}
                tone={state.below > 2 ? "alert" : "default"}
              />
            </dl>

            <h2 className="mt-5 text-[13px] font-semibold">Perturbation</h2>
            <div className="mt-2 space-y-1">
              {PERTURBATIONS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPerturbation(p.id)}
                  aria-pressed={perturbation === p.id}
                  className={`flex w-full flex-col items-start rounded-md border px-3 py-2 text-left transition-colors duration-150 ${
                    perturbation === p.id
                      ? "border-hairline-2 bg-panel-2"
                      : "border-transparent hover:bg-panel-2"
                  }`}
                >
                  <span className="text-[12.5px] font-medium">{p.label}</span>
                  <span className="text-[11px] text-ink-2">{p.detail}</span>
                </button>
              ))}
            </div>

            <div
              className={`mt-4 rounded-md border px-3 py-2.5 ${
                state.feasible
                  ? "border-[#b9c795] bg-sage"
                  : "border-coral-soft bg-[#fdf4f1]"
              }`}
            >
              <p
                className={`text-[12px] font-semibold ${
                  state.feasible ? "text-[#33401a]" : "text-[#8c2a17]"
                }`}
              >
                {state.feasible
                  ? "Passes the feasibility gate"
                  : "Fails the feasibility gate"}
              </p>
              <p
                className={`mt-1 text-[11px] leading-snug ${
                  state.feasible ? "text-[#4a5a2a]" : "text-[#8c2a17]"
                }`}
              >
                {state.below} of {state.nodes.length} junctions sit below the{" "}
                {MIN_PRESSURE} m minimum, with{" "}
                {state.unmet.toFixed(1)} L/s of demand unmet. The paper places
                this gate before optimisation so portfolios are constrained by
                what the network can physically deliver.
              </p>
            </div>
          </aside>

          <section className="flex min-h-0 flex-1 flex-col">
            <div className="hair-b flex flex-wrap items-center gap-3 bg-paper px-4 py-2">
              <span className="text-[11px] text-ink-2">Demand from scenario</span>
              <div className="flex rounded-md border border-hairline bg-panel p-[2px]">
                {SCENARIOS.map((s) => (
                  <Tooltip key={s.id} label={`${s.name} — ${s.assumption}`}>
                    <button
                      onClick={() => setScenarioId(s.id)}
                      aria-pressed={scenarioId === s.id}
                      className={`figure min-h-[44px] min-w-[44px] rounded px-1.5 text-[11px] transition-colors md:min-h-0 md:min-w-[26px] md:py-[3px] ${
                        scenarioId === s.id
                          ? "bg-deep text-[#e8eef0]"
                          : "text-ink-2 hover:bg-panel-2"
                      }`}
                    >
                      {s.id}
                    </button>
                  </Tooltip>
                ))}
              </div>
              <span className="ml-auto text-[11px] text-ink-3">
                Pressure below {MIN_PRESSURE} m shown in coral
              </span>
            </div>

            <div className="relative min-h-[320px] flex-1 bg-[#eeeeea]">
              <svg
                viewBox="0 0 560 280"
                className="h-full w-full"
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label="Representative distribution network coloured by illustrative pressure"
              >
                {NETWORK_LINKS.map((l) => {
                  const a =
                    l.from === "R1"
                      ? NETWORK_NODES[0]
                      : nodeById.get(l.from);
                  const b = nodeById.get(l.to);
                  if (!a || !b) return null;
                  const broken =
                    (perturbation === "leak" && l.id === "P14") ||
                    (perturbation === "pump" && l.from === "R1" && l.id === "P1");
                  return (
                    <line
                      key={l.id}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={broken ? "var(--color-coral)" : "#a9b4b6"}
                      strokeWidth={Math.max(1, l.diameter / 190)}
                      strokeDasharray={broken ? "4 3" : undefined}
                      strokeLinecap="round"
                    />
                  );
                })}

                {state.nodes.map((n) => {
                  const below = n.pressure < MIN_PRESSURE;
                  const hovered = hoverNode === n.id;
                  return (
                    <g key={n.id}>
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={hovered ? 6 : 4.4}
                        fill={below ? "var(--color-coral)" : "#69a0a8"}
                        stroke="#ffffff"
                        strokeWidth="1.2"
                        className="cursor-pointer transition-all duration-150"
                        onMouseEnter={() => setHoverNode(n.id)}
                        onMouseLeave={() => setHoverNode(null)}
                      >
                        <title>{`${n.id} — ${n.pressure.toFixed(1)} m, demand ${n.baseDemand.toFixed(1)} L/s`}</title>
                      </circle>
                    </g>
                  );
                })}

                <g>
                  <circle
                    cx={NETWORK_NODES[0].x}
                    cy={NETWORK_NODES[0].y}
                    r="8"
                    fill="var(--color-deep)"
                  />
                  <text
                    x={NETWORK_NODES[0].x}
                    y={NETWORK_NODES[0].y - 13}
                    fontSize="9"
                    fill="var(--color-ink-2)"
                    textAnchor="middle"
                  >
                    source
                  </text>
                </g>
              </svg>
            </div>

            <div className="hair-t shrink-0 bg-paper p-3">
              <Panel
                title="Pressure by junction"
                meta={
                  <span className="figure text-[10.5px] text-ink-3">
                    {state.nodes.length} nodes · illustrative
                  </span>
                }
                bodyClassName="px-3 pb-2 pt-2"
              >
                <PressureProfile
                  values={state.nodes.map((n) => ({
                    id: n.id,
                    pressure: n.pressure,
                  }))}
                  threshold={MIN_PRESSURE}
                />
              </Panel>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix = "",
  decimals = 0,
  tone = "default",
}: {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  tone?: "default" | "alert";
}) {
  return (
    <div className="bg-panel px-4 py-3">
      <dt className="text-[11px] text-ink-2">{label}</dt>
      <dd
        className={`mt-0.5 text-[20px] font-semibold leading-none ${
          tone === "alert" ? "text-coral" : ""
        }`}
      >
        <CountUp value={value} format={(n) => n.toFixed(decimals) + suffix} />
      </dd>
    </div>
  );
}
