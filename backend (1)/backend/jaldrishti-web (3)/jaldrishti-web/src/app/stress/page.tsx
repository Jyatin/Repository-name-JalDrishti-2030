"use client";

import { useMemo, useState } from "react";
import { CITY_BOUNDARY, WARDS } from "@/data/wards";
import { INDICATOR_BY_KEY, RAINFALL_RECORD } from "@/data/catalogue";
import { SCENARIOS } from "@/data/interventions";
import { computeWsi, rankCorrelation, stressClass, STRESS_LABEL } from "@/lib/wsi";
import { forecastWard } from "@/lib/forecast";
import { formatCompact, formatMm, formatPercent, formatScore } from "@/lib/format";
import { Rail } from "@/components/shell/Rail";
import { TopBar } from "@/components/shell/TopBar";
import { StressLegend, WardMap } from "@/components/map/WardMap";
import { WardPanel } from "@/components/panels/WardPanel";
import { Panel } from "@/components/ui/Panel";
import { CountUp } from "@/components/ui/CountUp";
import { Tooltip } from "@/components/ui/Tooltip";
import { ForecastChart } from "@/components/charts/Charts";
import { ProvenanceDrawer } from "@/components/provenance/ProvenanceDrawer";
import { GradeChip } from "@/components/provenance/GradeChip";
import type { ProvenanceNode, WeightingMethod } from "@/types";

export default function StressPage() {
  const [selectedId, setSelectedId] = useState<string>(WARDS[0].id);
  const [method, setMethod] = useState<WeightingMethod>("entropy");
  const [scenarioId, setScenarioId] = useState<"A" | "B" | "C" | "D">("A");
  const [traceOpen, setTraceOpen] = useState(false);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!;

  // The index is recomputed on every control change. Nothing here is a lookup.
  const wsi = useMemo(
    () =>
      computeWsi(WARDS, {
        method,
        stressMultiplier:
          scenario.demandMultiplier * scenario.lossMultiplier,
      }),
    [method, scenario],
  );

  // Sensitivity: how far the ranking moves when the weighting changes (§4.4).
  const alternate = useMemo(
    () =>
      computeWsi(WARDS, {
        method: method === "entropy" ? "equal" : "entropy",
        stressMultiplier:
          scenario.demandMultiplier * scenario.lossMultiplier,
      }),
    [method, scenario],
  );
  const stability = useMemo(
    () => rankCorrelation(wsi, alternate),
    [wsi, alternate],
  );

  const selected = WARDS.find((w) => w.id === selectedId)!;
  const forecast = useMemo(() => forecastWard(selected), [selected]);

  const criticalCount = wsi.results.filter(
    (r) => stressClass(r.score) === "critical" || stressClass(r.score) === "high",
  ).length;

  const exposedPopulation = wsi.results
    .filter((r) => stressClass(r.score) === "critical" || stressClass(r.score) === "high")
    .reduce(
      (a, r) => a + (WARDS.find((w) => w.id === r.wardId)?.population ?? 0),
      0,
    );

  const trace = useMemo<ProvenanceNode[]>(
    () => buildTrace(selectedId, wsi, method, scenario.name),
    [selectedId, wsi, method, scenario],
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <TopBar
        syntheticShare={wsi.syntheticShare}
        context={`Level 1 water-stress twin · scenario ${scenario.id}`}
      />

      <div className="flex min-h-0 flex-1">
        <div className="hidden md:block">
          <Rail />
        </div>

        <main className="thin-scroll flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          {/* Left column: search, ward identity, drivers. */}
          <aside className="thin-scroll reveal flex w-full shrink-0 flex-col border-hairline bg-panel lg:w-[372px] lg:overflow-y-auto lg:border-r">
            <div className="px-5 pt-4">
              <WardSearch
                value={selectedId}
                onChange={setSelectedId}
                wsi={wsi}
              />
            </div>
            <WardPanel
              ward={selected}
              wsi={wsi}
              onTrace={() => setTraceOpen(true)}
            />
          </aside>

          {/* Right column: map above, layered analysis panels below. */}
          <section className="flex min-h-0 flex-1 flex-col">
            <div className="hair-b flex flex-wrap items-center gap-x-4 gap-y-2 bg-paper px-4 py-2">
              <ScenarioSwitch value={scenarioId} onChange={setScenarioId} />
              <WeightSwitch value={method} onChange={setMethod} />
              <Tooltip
                label={`Spearman rank correlation against ${
                  method === "entropy" ? "equal" : "entropy"
                } weighting. Above 0.9 means the priority order barely moves when the weighting changes.`}
              >
                <span className="ml-auto flex items-center gap-1.5 text-[11px] text-ink-2">
                  Rank stability
                  <span className="figure font-medium text-ink">
                    {stability.toFixed(2)}
                  </span>
                </span>
              </Tooltip>
            </div>

            <div className="relative min-h-[300px] flex-1 lg:min-h-0">
              <WardMap
                wards={WARDS}
                boundary={CITY_BOUNDARY}
                wsi={wsi}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />

              <div className="panel panel-float absolute right-3 top-3 max-w-[240px] px-3 py-2.5">
                <p className="text-[11px] font-semibold">Schematic geometry</p>
                <p className="mt-1 text-[10.5px] leading-snug text-ink-2">
                  A deterministic ward lattice in real coordinates. Not official
                  boundary data — swap in real polygons without touching this view.
                </p>
              </div>

              <div className="panel panel-float absolute bottom-3 left-3 px-3 py-2">
                <StressLegend />
              </div>
            </div>

            {/* Layered analysis strip, as in the reference's lower band. */}
            <div className="thin-scroll hair-t grid shrink-0 gap-3 overflow-x-auto bg-paper p-3 md:grid-cols-2 xl:grid-cols-3">
              <Panel
                tone="sage"
                title="Rainfall against the long-period average"
                meta={<GradeChip grade="C" size="xs" />}
                bodyClassName="px-3 pb-3 pt-2"
              >
                <div className="flex items-baseline gap-3">
                  <span className="figure text-[22px] font-medium text-[#33401a]">
                    {RAINFALL_RECORD.yearsBelowAverage}
                  </span>
                  <span className="text-[11px] leading-tight text-[#4a5a2a]">
                    of {RAINFALL_RECORD.completeYears} years below the{" "}
                    {formatMm(RAINFALL_RECORD.longPeriodAverageMm)} average
                  </span>
                </div>
                <div
                  className="mt-2.5 flex h-2 overflow-hidden rounded-full"
                  role="img"
                  aria-label={`${RAINFALL_RECORD.yearsBelowAverage} of ${RAINFALL_RECORD.completeYears} years fell below the long-period average`}
                >
                  <span
                    className="bg-[#8a6a2e]"
                    style={{
                      width: `${(RAINFALL_RECORD.yearsBelowAverage / RAINFALL_RECORD.completeYears) * 100}%`,
                    }}
                  />
                  <span className="flex-1 bg-[#b9c795]" />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-[#4a5a2a]">
                  <span>{RAINFALL_RECORD.yearsBelowAverage} below</span>
                  <span>
                    {RAINFALL_RECORD.completeYears - RAINFALL_RECORD.yearsBelowAverage} at or above
                  </span>
                </div>
                <p className="mt-1 text-[10px] leading-snug text-[#4a5a2a]">
                  Real measured series, {RAINFALL_RECORD.windowLabel}. City-level
                  only — it cannot separate one ward from another.
                </p>
              </Panel>

              <Panel
                title={`Demand forecast · ${selected.code}`}
                meta={
                  <span className="figure text-[10.5px] text-ink-3">
                    {forecast.horizonMonths} mo
                  </span>
                }
                bodyClassName="px-3 pb-3 pt-2"
              >
                <ForecastChart run={forecast} />
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-ink-2">
                  <span>
                    Baseline MAE{" "}
                    <span className="figure text-ink">
                      {forecast.baselineMae.toFixed(2)}
                    </span>
                    {" · "}
                    Candidate{" "}
                    <span className="figure text-ink">
                      {forecast.candidateMae.toFixed(2)}
                    </span>
                  </span>
                  <span
                    className={`rounded border px-1.5 py-[1px] ${
                      forecast.candidateAdopted
                        ? "border-[#b9c795] bg-sage text-[#33401a]"
                        : "border-hairline-2 bg-panel-2 text-ink-2"
                    }`}
                  >
                    {forecast.candidateAdopted
                      ? "Candidate adopted"
                      : "Baseline retained"}
                  </span>
                </div>
              </Panel>

              <Panel
                tone="deep"
                title="Where stress concentrates"
                bodyClassName="px-3 pb-3 pt-2"
              >
                <div className="flex gap-5">
                  <div>
                    <p className="text-[10.5px] text-[#9fb6bd]">
                      Wards at high or critical stress
                    </p>
                    <p className="text-[24px] font-semibold leading-none text-[#e8eef0]">
                      <CountUp value={criticalCount} format={(n) => n.toFixed(0)} />
                      <span className="text-[13px] font-normal text-[#9fb6bd]">
                        {" "}
                        / {WARDS.length}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10.5px] text-[#9fb6bd]">
                      Population in those wards
                    </p>
                    <p className="text-[24px] font-semibold leading-none text-[#e8eef0]">
                      <CountUp value={exposedPopulation} format={formatCompact} />
                    </p>
                  </div>
                </div>
                <ul className="mt-2.5 space-y-1">
                  {wsi.results.slice(0, 4).map((r) => {
                    const w = WARDS.find((x) => x.id === r.wardId)!;
                    return (
                      <li key={r.wardId}>
                        <button
                          onClick={() => setSelectedId(r.wardId)}
                          className="flex w-full items-center gap-2 rounded px-1 py-[3px] text-left transition-colors hover:bg-deep-2"
                        >
                          <span className="figure w-4 text-[10.5px] text-[#7d979f]">
                            {r.rank}
                          </span>
                          <span className="figure text-[11.5px] text-[#e8eef0]">
                            {w.code}
                          </span>
                          <span className="ml-auto figure text-[11px] text-[#9fb6bd]">
                            {formatScore(r.score)}
                          </span>
                          <span className="w-[38px] text-right text-[10px] text-[#7d979f]">
                            {STRESS_LABEL[stressClass(r.score)]}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-[10px] leading-snug text-[#7d979f]">
                  Ranking rests {formatPercent(wsi.syntheticShare)} on fabricated
                  inputs. Treat it as a demonstration of method, not a finding.
                </p>
              </Panel>
            </div>
          </section>
        </main>
      </div>

      <ProvenanceDrawer
        open={traceOpen}
        onClose={() => setTraceOpen(false)}
        title={`${selected.code} · rank ${wsi.byWard[selectedId].rank}`}
        subtitle="Every step from this ranking back to the data underneath it."
        tree={trace}
      />
    </div>
  );
}

/** Ward picker, standing where the reference puts its search field. */
function WardSearch({
  value,
  onChange,
  wsi,
}: {
  value: string;
  onChange: (id: string) => void;
  wsi: ReturnType<typeof computeWsi>;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = WARDS.filter(
    (w) =>
      w.code.toLowerCase().includes(query.toLowerCase()) ||
      w.zone.toLowerCase().includes(query.toLowerCase()),
  ).slice(0, 7);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-md border border-hairline bg-panel-2 px-2.5 py-2 transition-colors focus-within:border-hairline-2">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden className="text-ink-3">
          <circle cx="5.6" cy="5.6" r="3.9" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8.6 8.6l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 140)}
          placeholder="Find a ward"
          aria-label="Find a ward"
          className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-ink-3"
        />
        <span className="figure hidden rounded border border-hairline-2 px-1 text-[10px] text-ink-3 sm:inline">
          {WARDS.length}
        </span>
      </div>

      {open && query.length > 0 && (
        <ul className="panel panel-float absolute inset-x-0 top-[calc(100%+4px)] z-40 max-h-[240px] overflow-y-auto p-1">
          {matches.length === 0 && (
            <li className="px-2.5 py-3 text-[12px] text-ink-2">
              No ward matches “{query}”. Try a code like BLR-W04, or a zone.
            </li>
          )}
          {matches.map((w) => (
            <li key={w.id}>
              <button
                onMouseDown={() => {
                  onChange(w.id);
                  setQuery("");
                }}
                className={`flex min-h-[36px] w-full items-center gap-2 rounded px-2.5 text-left transition-colors hover:bg-panel-2 ${
                  w.id === value ? "bg-panel-2" : ""
                }`}
              >
                <span className="figure text-[12px]">{w.code}</span>
                <span className="text-[11px] text-ink-3">{w.zone}</span>
                <span className="figure ml-auto text-[11px] text-ink-2">
                  {formatScore(wsi.byWard[w.id].score)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ScenarioSwitch({
  value,
  onChange,
}: {
  value: "A" | "B" | "C" | "D";
  onChange: (v: "A" | "B" | "C" | "D") => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-ink-2">2030 scenario</span>
      <div className="flex rounded-md border border-hairline bg-panel p-[2px]">
        {SCENARIOS.map((s) => (
          <Tooltip key={s.id} label={`${s.name} — ${s.decisionPurpose}`}>
            <button
              onClick={() => onChange(s.id)}
              aria-pressed={value === s.id}
              className={`figure min-h-[44px] min-w-[44px] rounded px-1.5 text-[11px] transition-colors duration-150 md:min-h-0 md:min-w-[26px] md:py-[3px] ${
                value === s.id
                  ? "bg-deep text-[#e8eef0]"
                  : "text-ink-2 hover:bg-panel-2"
              }`}
            >
              {s.id}
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

function WeightSwitch({
  value,
  onChange,
}: {
  value: WeightingMethod;
  onChange: (v: WeightingMethod) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-ink-2">Weighting</span>
      <div className="flex rounded-md border border-hairline bg-panel p-[2px]">
        {(["entropy", "equal"] as const).map((m) => (
          <button
            key={m}
            onClick={() => onChange(m)}
            aria-pressed={value === m}
            className={`min-h-[44px] rounded px-3 text-[11px] capitalize transition-colors duration-150 md:min-h-0 md:px-2 md:py-[3px] ${
              value === m ? "bg-deep text-[#e8eef0]" : "text-ink-2 hover:bg-panel-2"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}

function buildTrace(
  wardId: string,
  wsi: ReturnType<typeof computeWsi>,
  method: WeightingMethod,
  scenarioName: string,
): ProvenanceNode[] {
  const r = wsi.byWard[wardId];
  const top = [...r.contributions].sort((a, b) => b.contribution - a.contribution);

  return [
    {
      label: `Priority rank ${r.rank}`,
      detail: `Score ${formatScore(r.score)}, classified ${STRESS_LABEL[stressClass(r.score)]}. Confidence ${Math.round(r.confidence * 100)}%.`,
      children: [
        {
          label: "Water-Stress Index run",
          detail: `${method === "entropy" ? "Entropy" : "Equal"} weighting over ${wsi.results.length} wards, scenario “${scenarioName}”. Run hash ${wsi.contentHash}.`,
          synthetic: wsi.syntheticShare > 0.5,
          children: [
            {
              label: "Weighting step",
              detail:
                method === "entropy"
                  ? "Weights derived from the spread of each indicator across the ward set. The paper is explicit that this makes weights replicable, not objectively true — compare against equal weighting to test whether the ranking holds."
                  : "Every indicator carries equal weight. Used as the sensitivity comparison against entropy weighting.",
            },
            {
              label: "Normalisation step",
              detail:
                "Each indicator scaled to [0,1] across the ward set. Supply reliability is direction-reversed so that 1 always means more stress.",
            },
            ...top.map((c) => {
              const def = INDICATOR_BY_KEY[c.key];
              return {
                label: def.label,
                detail: `Contributes ${formatPercent(c.contribution / Math.max(r.score, 1e-9))} of this score. Raw ${c.raw.toFixed(3)}, normalised ${c.normalized.toFixed(3)}, weight ${c.weight.toFixed(3)}. ${def.description}`,
                grade: def.grade,
                synthetic: def.synthetic,
                children: [
                  {
                    label: "Source and limitation",
                    detail: def.sourceNote,
                    grade: def.grade,
                    synthetic: def.synthetic,
                  },
                ],
              };
            }),
          ],
        },
        {
          label: "Ward geometry",
          detail:
            "Schematic Voronoi lattice generated under a fixed seed, in real WGS84 coordinates. Not official ward boundary data.",
          synthetic: true,
        },
      ],
    },
  ];
}
