"use client";

import { useMemo, useState } from "react";
import { WARDS } from "@/data/wards";
import { INTERVENTION_BY_CODE, INTERVENTIONS } from "@/data/interventions";
import { computeWsi, stressClass, STRESS_LABEL } from "@/lib/wsi";
import { optimise } from "@/lib/optimise";
import { formatCompact, formatLakh, formatPercent, formatScore } from "@/lib/format";
import { Rail } from "@/components/shell/Rail";
import { TopBar } from "@/components/shell/TopBar";
import { Panel } from "@/components/ui/Panel";
import { CountUp } from "@/components/ui/CountUp";
import { Tooltip } from "@/components/ui/Tooltip";
import { ParetoPlot } from "@/components/charts/Charts";
import { ProvenanceDrawer } from "@/components/provenance/ProvenanceDrawer";
import type { ProvenanceNode } from "@/types";

type XKey = "totalCost" | "populationProtected";
type YKey = "residualStress" | "equityWeightedProtection";

export default function OptimisePage() {
  const [budget, setBudget] = useState(900);
  const [minConfidence, setMinConfidence] = useState(0);
  const [xKey, setXKey] = useState<XKey>("totalCost");
  const [yKey, setYKey] = useState<YKey>("residualStress");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [traceOpen, setTraceOpen] = useState(false);

  const wsi = useMemo(() => computeWsi(WARDS), []);

  // Real non-dominated sort over a seeded portfolio population.
  const run = useMemo(
    () => optimise(WARDS, wsi, { budgetLakh: budget, minConfidence }),
    [wsi, budget, minConfidence],
  );

  const selected =
    run.front.find((p) => p.id === selectedId) ??
    [...run.front].sort((a, b) => a.residualStress - b.residualStress)[0] ??
    null;

  const trace = useMemo<ProvenanceNode[]>(() => {
    if (!selected) return [];
    return [
      {
        label: `Portfolio ${selected.id}`,
        detail: `${selected.wardCount} wards, ${formatLakh(selected.totalCost)} against a ${formatLakh(budget)} cap. ${selected.hydraulicallyVerified ? "Flagged for full hydraulic verification." : "Not yet hydraulically verified."}`,
        children: [
          {
            label: "Non-dominated sort",
            detail: `${run.evaluated} portfolios evaluated under seed ${run.seed}; ${run.front.length} survive on the Pareto front. A portfolio survives only if nothing else beats it on every objective at once.`,
          },
          {
            label: "Objectives",
            detail:
              "Minimise total cost and residual stress; maximise population protected and equity-weighted protection. The paper is explicit that these must not be collapsed into a single ranking.",
          },
          {
            label: "Equity term",
            detail:
              "Population enters as its normalised share so no ward dominates through scale alone, weighted by a vulnerability index built from groundwater dependence, tanker dependence and reliability gaps.",
            synthetic: true,
          },
          {
            label: "Intervention effects",
            detail:
              "The paper gives relative cost bands and no benefit figures, stating that no benefit may be claimed without local justification. The effect sizes driving this search are fabricated placeholders.",
            synthetic: true,
          },
          {
            label: "Hydraulic feasibility",
            detail:
              "The backend re-simulates the leading solutions in full EPANET/WNTR before they can be recommended. Nothing on this screen has been through a solver.",
            synthetic: true,
          },
        ],
      },
    ];
  }, [selected, run, budget]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <TopBar syntheticShare={1} context="Intervention portfolios" />
      <div className="flex min-h-0 flex-1">
        <div className="hidden md:block">
          <Rail />
        </div>

        <main className="thin-scroll flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          <aside className="reveal w-full shrink-0 border-hairline bg-panel px-5 py-4 lg:w-[372px] lg:overflow-y-auto lg:border-r">
            <p className="text-[11.5px] text-ink-2">Multi-objective search</p>
            <h1 className="mt-1.5 text-[36px] leading-[0.98]">
              Intervention
              <br />
              portfolios
            </h1>
            <p className="mt-2.5 max-w-[46ch] text-[12px] leading-relaxed text-ink-2">
              There is no single best plan. Each point on the front is a portfolio
              that nothing else beats on cost, residual stress, reach and equity
              all at once. Choosing between them is a judgement, not a calculation.
            </p>

            <div className="mt-5">
              <label className="flex items-baseline justify-between text-[12px] font-medium">
                Budget cap
                <span className="figure text-[12px] text-ink-2">
                  {formatLakh(budget)}
                </span>
              </label>
              <input
                type="range"
                min={200}
                max={2400}
                step={50}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="mt-2 w-full accent-[#e2553b]"
                aria-label="Budget cap in lakh"
              />
            </div>

            <div className="mt-4">
              <label className="flex items-baseline justify-between text-[12px] font-medium">
                Minimum data confidence
                <span className="figure text-[12px] text-ink-2">
                  {formatPercent(minConfidence)}
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={0.7}
                step={0.05}
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                className="mt-2 w-full accent-[#e2553b]"
                aria-label="Minimum data confidence"
              />
              <p className="mt-1.5 text-[11px] leading-snug text-ink-2">
                {run.excludedForConfidence > 0
                  ? `${run.excludedForConfidence} wards are excluded: their scores rest on inputs too weak to act on.`
                  : "Raise this to exclude wards whose scores rest on weak inputs. The paper makes data confidence a constraint on the optimiser, not a footnote."}
              </p>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-px bg-hairline">
              <Stat label="Evaluated" value={run.evaluated} />
              <Stat label="On the front" value={run.front.length} />
            </dl>

            {selected && (
              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-[13px] font-semibold">{selected.id}</h2>
                  <button
                    onClick={() => setTraceOpen(true)}
                    className="rounded border border-hairline px-2 py-[3px] text-[11px] text-ink-2 transition-colors hover:border-hairline-2 hover:text-ink"
                  >
                    Trace
                  </button>
                </div>

                <ul className="mt-2 space-y-1.5">
                  <Objective
                    label="Total cost"
                    value={formatLakh(selected.totalCost)}
                    goal="lower"
                  />
                  <Objective
                    label="Residual stress"
                    value={formatScore(selected.residualStress)}
                    goal="lower"
                  />
                  <Objective
                    label="Population protected"
                    value={formatCompact(selected.populationProtected)}
                    goal="higher"
                  />
                  <Objective
                    label="Equity-weighted"
                    value={selected.equityWeightedProtection.toFixed(3)}
                    goal="higher"
                  />
                </ul>

                <h3 className="mt-4 text-[12px] font-semibold">
                  Where the money goes
                </h3>
                <ul className="thin-scroll mt-2 max-h-[220px] space-y-1 overflow-y-auto pr-1">
                  {Object.entries(selected.assignments)
                    .sort(
                      (a, b) =>
                        wsi.byWard[b[0]].score - wsi.byWard[a[0]].score,
                    )
                    .map(([wardId, code]) => {
                      const ward = WARDS.find((w) => w.id === wardId)!;
                      const iv = INTERVENTION_BY_CODE[code];
                      return (
                        <li
                          key={wardId}
                          className="flex items-center gap-2 rounded px-1.5 py-1 transition-colors hover:bg-panel-2"
                        >
                          <span className="figure w-[62px] text-[11px]">
                            {ward.code}
                          </span>
                          <span className="truncate text-[11.5px] text-ink-2">
                            {iv.name}
                          </span>
                          <span className="ml-auto text-[10px] text-ink-3">
                            {STRESS_LABEL[stressClass(wsi.byWard[wardId].score)]}
                          </span>
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}
          </aside>

          <section className="flex min-h-0 flex-1 flex-col">
            <div className="hair-b flex flex-wrap items-center gap-3 bg-paper px-4 py-2">
              <AxisSwitch
                label="X"
                value={xKey}
                options={[
                  ["totalCost", "Cost"],
                  ["populationProtected", "Reach"],
                ]}
                onChange={(v) => setXKey(v as XKey)}
              />
              <AxisSwitch
                label="Y"
                value={yKey}
                options={[
                  ["residualStress", "Residual stress"],
                  ["equityWeightedProtection", "Equity"],
                ]}
                onChange={(v) => setYKey(v as YKey)}
              />
              <Tooltip label="Filled points are flagged for full hydraulic verification in the backend. Hollow points have not been checked against the network.">
                <span className="ml-auto flex items-center gap-2 text-[11px] text-ink-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-coral" />
                  verified
                  <span className="ml-1 h-2.5 w-2.5 rounded-full border border-coral" />
                  unverified
                </span>
              </Tooltip>
            </div>

            <div className="flex min-h-[280px] flex-1 items-center justify-center p-4">
              {run.front.length === 0 ? (
                <p className="max-w-[40ch] text-center text-[12.5px] text-ink-2">
                  No portfolio fits within {formatLakh(budget)} at this confidence
                  threshold. Raise the budget or lower the threshold.
                </p>
              ) : (
                <ParetoPlot
                  front={run.front}
                  selectedId={selected?.id ?? null}
                  onSelect={setSelectedId}
                  xKey={xKey}
                  yKey={yKey}
                />
              )}
            </div>

            <div className="hair-t shrink-0 bg-paper p-3">
              <Panel
                title="Intervention library"
                meta={
                  <span className="text-[10.5px] text-ink-3">
                    Mechanisms and cost bands from the paper; effect sizes synthetic
                  </span>
                }
                bodyClassName="p-0"
              >
                <div className="thin-scroll overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left">
                    <thead>
                      <tr className="hair-b text-[11px] text-ink-2">
                        <th className="px-4 py-2 font-medium">Intervention</th>
                        <th className="px-4 py-2 font-medium">Mechanism</th>
                        <th className="px-4 py-2 font-medium">Cost band</th>
                        <th className="px-4 py-2 font-medium">Hydraulic gate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {INTERVENTIONS.map((iv) => (
                        <tr
                          key={iv.code}
                          className="border-b border-hairline text-[11.5px] transition-colors last:border-0 hover:bg-panel-2"
                        >
                          <td className="px-4 py-2 font-medium">{iv.name}</td>
                          <td className="max-w-[300px] px-4 py-2 text-ink-2">
                            {iv.mechanism}
                          </td>
                          <td className="px-4 py-2 text-ink-2">{iv.costBand}</td>
                          <td className="px-4 py-2 text-ink-2">
                            {iv.requiresHydraulicEval ? "Required" : "Not required"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>
          </section>
        </main>
      </div>

      <ProvenanceDrawer
        open={traceOpen}
        onClose={() => setTraceOpen(false)}
        title={selected ? `Portfolio ${selected.id}` : "Portfolio"}
        subtitle="What produced this option, and what it rests on."
        tree={trace}
      />
    </div>
  );
}

function Objective({
  label,
  value,
  goal,
}: {
  label: string;
  value: string;
  goal: "lower" | "higher";
}) {
  return (
    <li className="flex items-center justify-between rounded bg-panel-2 px-2.5 py-1.5">
      <span className="flex items-center gap-1.5 text-[11.5px] text-ink-2">
        <span className="text-ink-3">{goal === "lower" ? "↓" : "↑"}</span>
        {label}
      </span>
      <span className="figure text-[12px] font-medium">{value}</span>
    </li>
  );
}

function AxisSwitch({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="figure text-[11px] text-ink-3">{label}</span>
      <div className="flex rounded-md border border-hairline bg-panel p-[2px]">
        {options.map(([v, l]) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            aria-pressed={value === v}
            className={`min-h-[44px] rounded px-3 text-[11px] transition-colors md:min-h-0 md:px-2 md:py-[3px] ${
              value === v ? "bg-deep text-[#e8eef0]" : "text-ink-2 hover:bg-panel-2"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-panel px-4 py-3">
      <dt className="text-[11px] text-ink-2">{label}</dt>
      <dd className="mt-0.5 text-[20px] font-semibold leading-none">
        <CountUp value={value} format={(n) => n.toFixed(0)} />
      </dd>
    </div>
  );
}
