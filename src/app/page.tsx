"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { WARDS } from "@/data/wards";
import { SCENARIOS } from "@/data/interventions";
import { AVAILABILITY_AUDIT } from "@/data/catalogue";
import { PAPER_META, STORY_STEPS, TRACEABILITY } from "@/data/paper";
import type { StoryStep } from "@/data/paper";
import { computeWsi, stressClass, STRESS_LABEL } from "@/lib/wsi";
import { forecastWard } from "@/lib/forecast";
import { optimise } from "@/lib/optimise";
import { formatScore } from "@/lib/format";
import { Rail } from "@/components/shell/Rail";
import { TopBar } from "@/components/shell/TopBar";
import { DataSystemStatus } from "@/components/shell/DataSystemStatus";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge, type PaperStatus } from "@/components/provenance/StatusBadge";
import { GradeChip } from "@/components/provenance/GradeChip";
import { ForecastChart, ParetoPlot } from "@/components/charts/Charts";

/**
 * Research-story landing page.
 *
 * A single scrolling narrative through the paper's 10-part presentation order.
 * Each section carries a StatusBadge stating exactly what kind of claim it is
 * making (real / synthetic / proposed / validated) and links out to the full
 * interactive module where one exists. Live figures are computed from the same
 * lib functions the dashboards use — nothing here is a separate, divergent copy
 * of the numbers.
 */
export default function StoryPage() {
  const [activeId, setActiveId] = useState(STORY_STEPS[0].id);

  useEffect(() => {
    const targets = STORY_STEPS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <TopBar context="Research story · paper-to-implementation" />
      <div className="flex min-h-0 flex-1">
        <div className="hidden md:block">
          <Rail />
        </div>

        <div className="thin-scroll flex min-h-0 flex-1 overflow-y-auto">
          <main className="mx-auto w-full max-w-[880px] px-4 pb-24 pt-8 sm:px-8">
            <Hero />
            {STORY_STEPS.map((step) => (
              <Section key={step.id} step={step} />
            ))}
            <FinalCta />
          </main>

          {/* In-page section index. Numbered, not decorative — mirrors the presentation order. */}
          <nav
            aria-label="Story sections"
            className="thin-scroll hidden w-[196px] shrink-0 overflow-y-auto border-l border-hairline bg-panel px-3 py-8 xl:block"
          >
            <ol className="space-y-0.5">
              {STORY_STEPS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={`flex items-baseline gap-2 rounded px-2 py-1.5 text-[11.5px] transition-colors ${
                      activeId === s.id
                        ? "bg-panel-2 font-medium text-ink"
                        : "text-ink-2 hover:bg-panel-2"
                    }`}
                  >
                    <span className="figure w-4 shrink-0 text-[10px] text-ink-3">
                      {String(s.index).padStart(2, "0")}
                    </span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>
      <DataSystemStatus syntheticShare={0.5} />
    </div>
  );
}

function Hero() {
  return (
    <header className="reveal border-b border-hairline pb-8">
      <p className="text-[11.5px] text-ink-2">{PAPER_META.competition}</p>
      <h1 className="mt-2 text-[40px] leading-[1.0] sm:text-[52px]">
        JalDrishti 2030
      </h1>
      <p className="mt-3 max-w-[62ch] text-[14px] leading-relaxed text-ink-2">
        An interactive companion to the research paper{" "}
        <em className="not-italic font-medium text-ink">
          &ldquo;{PAPER_META.title}&rdquo;
        </em>
        . Ten steps, from the problem the paper opens with to a traceability
        table mapping every module below back to a paper section. Each step
        states plainly whether what it shows is real, synthetic, proposed, or
        validated.
      </p>
      <p className="mt-2 text-[12px] text-ink-3">
        {PAPER_META.author} · supervised by {PAPER_META.supervisor}
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <StatusBadge status="real" />
        <StatusBadge status="synthetic" />
        <StatusBadge status="proposed" />
        <StatusBadge status="validated" />
      </div>
    </header>
  );
}

function Section({ step }: { step: StoryStep }) {
  return (
    <section id={step.id} className="scroll-mt-16 border-b border-hairline py-9">
      <div className="flex flex-wrap items-center gap-2">
        <span className="figure text-[11px] text-ink-3">
          {String(step.index).padStart(2, "0")}
        </span>
        <p className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-ink-2">
          {step.eyebrow}
        </p>
        <StatusBadge status={step.status} />
      </div>

      <h2 className="mt-2 text-[26px] leading-[1.05] sm:text-[30px]">
        {step.title}
      </h2>

      <p className="mt-3 max-w-[68ch] text-[13.5px] leading-relaxed text-ink-2">
        {step.summary}
      </p>

      <p className="mt-2 text-[11px] text-ink-3">Paper reference: {step.paperRef}</p>

      <div className="mt-5">
        <StepBody id={step.id} />
      </div>

      {step.linkHref && (
        <Link
          href={step.linkHref}
          className="mt-5 inline-flex items-center gap-1.5 rounded-md border border-hairline bg-panel px-3 py-2 text-[12px] font-medium transition-colors hover:border-hairline-2 hover:bg-panel-2"
        >
          {step.linkLabel}
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
            <path
              d="M3.6 1.8L7.4 5.5 3.6 9.2"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      )}
    </section>
  );
}

/** Per-section embedded evidence. Every figure here comes from the same lib
 * functions the dashboards use — this page does not maintain its own numbers. */
function StepBody({ id }: { id: string }) {
  switch (id) {
    case "wsi":
      return <WsiPreview />;
    case "prediction":
      return <PredictionPreview />;
    case "twin":
      return <TwinPreview />;
    case "scenarios":
      return <ScenariosPreview />;
    case "optimisation":
      return <OptimisationPreview />;
    case "data":
      return <DataPreview />;
    case "roadmap":
      return <RoadmapPreview />;
    case "traceability":
      return <TraceabilityPreview />;
    default:
      return null;
  }
}

function WsiPreview() {
  const wsi = useMemo(() => computeWsi(WARDS), []);
  const top5 = wsi.results.slice(0, 5);
  return (
    <Panel title="Highest-ranked wards, entropy weighting" bodyClassName="p-0">
      <ul>
        {top5.map((r) => {
          const w = WARDS.find((x) => x.id === r.wardId)!;
          return (
            <li
              key={r.wardId}
              className="flex items-center gap-3 border-b border-hairline px-4 py-2 text-[12px] last:border-0"
            >
              <span className="figure w-5 text-ink-3">{r.rank}</span>
              <span className="figure w-16 font-medium">{w.code}</span>
              <span className="text-ink-2">{STRESS_LABEL[stressClass(r.score)]}</span>
              <span className="figure ml-auto">{formatScore(r.score)}</span>
              <span className="w-14 text-right text-[10.5px] text-ink-3">
                {Math.round(r.confidence * 100)}% conf.
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function PredictionPreview() {
  const ward = WARDS[0];
  const run = useMemo(() => forecastWard(ward), [ward]);
  return (
    <Panel
      title={`Demand forecast · ${ward.code}`}
      meta={
        <span
          className={`rounded border px-1.5 py-[1px] text-[10px] ${
            run.candidateAdopted
              ? "border-[#b9c795] bg-sage text-[#33401a]"
              : "border-hairline-2 bg-panel-2 text-ink-2"
          }`}
        >
          {run.candidateAdopted ? "Candidate adopted" : "Baseline retained"}
        </span>
      }
      bodyClassName="px-3 pb-3 pt-2"
    >
      <ForecastChart run={run} />
      <p className="mt-1 text-[10.5px] text-ink-2">
        Baseline MAE <span className="figure">{run.baselineMae.toFixed(2)}</span> ·
        Candidate MAE <span className="figure">{run.candidateMae.toFixed(2)}</span>
      </p>
    </Panel>
  );
}

function TwinPreview() {
  return (
    <Panel bodyClassName="px-4 py-3">
      <div className="flex flex-wrap items-center gap-4 text-[12px]">
        <Metric label="Junctions" value="20" />
        <Metric label="Pipes" value="24" />
        <Metric label="Min. pressure gate" value="12 m" />
      </div>
      <p className="mt-3 text-[11.5px] leading-relaxed text-ink-2">
        Leak, pump-outage and supply-reduction perturbations are available in
        the interactive view. Pressures there come from an illustrative
        distance-and-elevation formula — the proposed EPANET/WNTR solve is not
        yet wired in.
      </p>
    </Panel>
  );
}

function ScenariosPreview() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {SCENARIOS.map((s) => (
        <Panel key={s.id} bodyClassName="px-3.5 py-3">
          <p className="flex items-center gap-2 text-[12.5px] font-semibold">
            <span className="figure grid h-5 w-5 place-items-center rounded bg-deep text-[10px] text-[#e8eef0]">
              {s.id}
            </span>
            {s.name}
          </p>
          <p className="mt-1.5 text-[11.5px] leading-snug text-ink-2">
            {s.assumption}
          </p>
          <p className="mt-1.5 text-[10.5px] text-ink-3">
            demand ×{s.demandMultiplier} · loss ×{s.lossMultiplier} · supply ×
            {s.supplyMultiplier}
          </p>
        </Panel>
      ))}
    </div>
  );
}

function OptimisationPreview() {
  const wsi = useMemo(() => computeWsi(WARDS), []);
  const run = useMemo(() => optimise(WARDS, wsi, { budgetLakh: 900 }), [wsi]);
  return (
    <Panel
      title="Pareto front at a 900 L budget cap"
      meta={
        <span className="figure text-[10.5px] text-ink-3">
          {run.evaluated} evaluated → {run.front.length} on the front
        </span>
      }
      bodyClassName="px-3 pb-2 pt-2"
    >
      <ParetoPlot
        front={run.front}
        selectedId={null}
        onSelect={() => {}}
        xKey="totalCost"
        yKey="residualStress"
      />
    </Panel>
  );
}

function DataPreview() {
  const worst = [...AVAILABILITY_AUDIT].filter((r) => r.best === "E").slice(0, 4);
  return (
    <Panel title="Variables graded E — not available at ward resolution" bodyClassName="p-0">
      <ul>
        {worst.map((row) => (
          <li
            key={row.variable}
            className="flex items-center gap-3 border-b border-hairline px-4 py-2 text-[12px] last:border-0"
          >
            <GradeChip grade="E" size="xs" />
            <span className="font-medium">{row.variable}</span>
            <span className="ml-auto max-w-[46ch] truncate text-[11px] text-ink-3">
              {row.limitation}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function RoadmapPreview() {
  const phases: { n: string; title: string; status: PaperStatus; detail: string }[] = [
    {
      n: "1",
      title: "Interactive research prototype",
      status: "real",
      detail: "This site. Full methodology, synthetic + available real data.",
    },
    {
      n: "2",
      title: "Data & analytical engine",
      status: "proposed",
      detail: "FastAPI, PostGIS, real ingestion, persisted WSI & forecast runs.",
    },
    {
      n: "3",
      title: "Digital twin & optimisation validation",
      status: "proposed",
      detail: "EPANET/WNTR, NSGA-II, scenario evaluation, research validation.",
    },
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {phases.map((p) => (
        <Panel key={p.n} bodyClassName="px-3.5 py-3">
          <div className="flex items-center justify-between">
            <span className="figure text-[18px] font-semibold text-ink-3">
              {p.n}
            </span>
            <StatusBadge status={p.status} size="xs" />
          </div>
          <p className="mt-1.5 text-[12.5px] font-semibold leading-snug">
            {p.title}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-ink-2">{p.detail}</p>
        </Panel>
      ))}
    </div>
  );
}

function TraceabilityPreview() {
  return (
    <div className="space-y-4">
      <Panel title="Feature → paper section" bodyClassName="p-0">
        <ul>
          {TRACEABILITY.map((row) => (
            <li
              key={row.feature}
              className="flex items-center gap-3 border-b border-hairline px-4 py-2 text-[12px] last:border-0"
            >
              <span className="flex-1">{row.feature}</span>
              <span className="text-[10.5px] text-ink-3">{row.paperRef}</span>
              <StatusBadge status={row.status} size="xs" />
            </li>
          ))}
        </ul>
      </Panel>

    </div>
  );
}

function FinalCta() {
  return (
    <div className="reveal pt-9 text-center">
      <p className="text-[12.5px] text-ink-2">
        Start with the data audit — it explains every synthetic label that
        follows.
      </p>
      <Link
        href="/data"
        className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-deep px-4 py-2.5 text-[13px] font-medium text-[#e8eef0] transition-colors hover:bg-deep-2"
      >
        Open the data-availability audit
      </Link>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="figure text-[15px] font-medium">{value}</span>
      <span className="text-[10.5px] text-ink-3">{label}</span>
    </span>
  );
}
