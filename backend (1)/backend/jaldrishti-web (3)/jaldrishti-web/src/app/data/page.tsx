"use client";

import { useState } from "react";
import {
  AVAILABILITY_AUDIT,
  DATA_SOURCES,
  INDICATORS,
  RAINFALL_RECORD,
} from "@/data/catalogue";
import { WARDS, WARD_GENERATOR, WARD_LATTICE_SEED } from "@/data/wards";
import { formatMm } from "@/lib/format";
import { Rail } from "@/components/shell/Rail";
import { TopBar } from "@/components/shell/TopBar";
import { Panel } from "@/components/ui/Panel";
import { GradeChip, SyntheticTag } from "@/components/provenance/GradeChip";
import type { Grade } from "@/types";

/**
 * The page that makes the paper's actual empirical result legible.
 *
 * The Phase 2 audit found that the operational data this model needs does not
 * publicly exist. That is the finding, and it is why everything downstream is
 * labelled the way it is.
 */
const GRID = "minmax(200px,1fr) 64px 64px 72px 96px";

export default function DataPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const syntheticCount = INDICATORS.filter((i) => i.synthetic).length;

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <TopBar
        syntheticShare={syntheticCount / INDICATORS.length}
        context="Data availability and provenance"
      />
      <div className="flex min-h-0 flex-1">
        <div className="hidden md:block">
          <Rail />
        </div>

        <main className="thin-scroll min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1080px] px-4 py-6 sm:px-6 sm:py-8">
            <header className="reveal max-w-[62ch]">
              <p className="text-[11.5px] text-ink-2">Phase 2 audit</p>
              <h1 className="mt-1.5 text-[38px] leading-[1.0] sm:text-[46px]">
                The data this model needs
                <br />
                mostly isn&rsquo;t published
              </h1>
              <p className="mt-4 text-[13.5px] leading-relaxed text-ink-2">
                Bengaluru is not short of water data. It is short of water data at
                the resolution a neighbourhood model runs on. The audit graded
                every variable the index requires against the resolution it
                actually needs — and consumption, losses and supply reliability
                all came back at the bottom of the scale. That finding is the
                reason this prototype exists, so it is shown first rather than
                buried in a limitations section.
              </p>
            </header>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              <Panel title="Grades A–C" bodyClassName="px-4 py-3">
                <p className="figure text-[28px] font-medium leading-none">
                  {AVAILABILITY_AUDIT.filter((r) => "ABC".includes(r.best[0])).length}
                </p>
                <p className="mt-1 text-[11.5px] text-ink-2">
                  variables usable at or aggregable to ward level
                </p>
              </Panel>
              <Panel title="Grade D" bodyClassName="px-4 py-3">
                <p className="figure text-[28px] font-medium leading-none">
                  {AVAILABILITY_AUDIT.filter((r) => r.best === "D").length}
                </p>
                <p className="mt-1 text-[11.5px] text-ink-2">
                  categorical evidence only — vulnerability, not measurement
                </p>
              </Panel>
              <Panel title="Grade E" bodyClassName="px-4 py-3">
                <p className="figure text-[28px] font-medium leading-none text-coral">
                  {AVAILABILITY_AUDIT.filter((r) => r.best === "E").length}
                </p>
                <p className="mt-1 text-[11.5px] text-ink-2">
                  not available at the resolution the model requires
                </p>
              </Panel>
            </div>

            <section className="mt-8">
              <h2 className="text-[17px]">Availability by variable</h2>
              <p className="mt-1 max-w-[60ch] text-[12.5px] text-ink-2">
                Select a row to read what stopped the variable reaching a usable
                grade.
              </p>

              <div className="panel mt-3 overflow-hidden">
                <div className="thin-scroll overflow-x-auto">
                  <div className="min-w-[620px]">
                    <div
                      className="hair-b grid items-center text-[11px] text-ink-2"
                      style={{ gridTemplateColumns: GRID }}
                    >
                      <span className="px-4 py-2.5 font-medium">Variable</span>
                      <span className="px-3 py-2.5 text-center font-medium">Ward</span>
                      <span className="px-3 py-2.5 text-center font-medium">Zone</span>
                      <span className="px-3 py-2.5 text-center font-medium">Station</span>
                      <span className="px-4 py-2.5 font-medium">Best</span>
                    </div>

                    {AVAILABILITY_AUDIT.map((row) => {
                      const open = expanded === row.variable;
                      return (
                        <div
                          key={row.variable}
                          className="border-b border-hairline last:border-0"
                        >
                          <button
                            onClick={() => setExpanded(open ? null : row.variable)}
                            aria-expanded={open}
                            className={`grid w-full items-center text-left transition-colors ${
                              open ? "bg-panel-2" : "hover:bg-panel-2"
                            }`}
                            style={{ gridTemplateColumns: GRID }}
                          >
                            <span className="px-4 py-2.5 text-[12.5px] font-medium">
                              {row.variable}
                            </span>
                            <span className="px-3 py-2.5 text-center">
                              <Cell v={row.ward} />
                            </span>
                            <span className="px-3 py-2.5 text-center">
                              <Cell v={row.dma} />
                            </span>
                            <span className="px-3 py-2.5 text-center">
                              <Cell v={row.station} />
                            </span>
                            <span className="figure px-4 py-2.5 text-[12px]">
                              {row.best}
                            </span>
                          </button>
                          {open && (
                            <p className="reveal border-t border-hairline bg-panel-2 px-4 py-3 text-[12px] leading-relaxed text-ink-2">
                              {row.limitation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-8 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
              <Panel title="Indicators feeding the index" bodyClassName="p-0">
                <ul>
                  {INDICATORS.map((ind) => (
                    <li
                      key={ind.key}
                      className="border-b border-hairline px-4 py-3 transition-colors last:border-0 hover:bg-panel-2"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[12.5px] font-medium">
                          {ind.label}
                        </span>
                        <GradeChip grade={ind.grade} size="xs" />
                        {ind.synthetic && <SyntheticTag compact />}
                        <span className="ml-auto text-[10.5px] text-ink-3">
                          {ind.direction === "stress_increasing"
                            ? "higher = more stress"
                            : "reversed"}
                        </span>
                      </div>
                      <p className="mt-1 text-[11.5px] leading-snug text-ink-2">
                        {ind.description}
                      </p>
                      <p className="mt-1 text-[11px] leading-snug text-ink-3">
                        {ind.sourceNote}
                      </p>
                    </li>
                  ))}
                </ul>
              </Panel>

              <div className="space-y-3">
                <Panel tone="sage" title="The one real result" bodyClassName="px-4 py-3">
                  <p className="text-[12px] leading-relaxed text-[#33401a]">
                    Rainfall is the only variable in the paper with a complete,
                    reproducible public series. Across{" "}
                    {RAINFALL_RECORD.completeYears} complete years (
                    {RAINFALL_RECORD.windowLabel}), annual totals ranged from{" "}
                    {formatMm(RAINFALL_RECORD.minMm)} in {RAINFALL_RECORD.minYear} to{" "}
                    {formatMm(RAINFALL_RECORD.maxMm)} in {RAINFALL_RECORD.maxYear}.{" "}
                    {RAINFALL_RECORD.yearsBelowAverage} of those years fell below the{" "}
                    {formatMm(RAINFALL_RECORD.longPeriodAverageMm)} long-period average.
                  </p>
                  <p className="mt-2 text-[11px] leading-snug text-[#4a5a2a]">
                    It is a single city series. It supports a climate-context
                    indicator; it cannot rank one ward against another.
                  </p>
                </Panel>

                <Panel tone="deep" title="Generated inputs" bodyClassName="px-4 py-3">
                  <p className="text-[12px] leading-relaxed text-[#c8d6da]">
                    The ward lattice and every grade-E series are produced by a
                    seeded generator so any figure on this site can be
                    reproduced exactly and discarded just as easily.
                  </p>
                  <dl className="mt-2.5 space-y-1 text-[11px]">
                    <Row k="Seed" v={String(WARD_LATTICE_SEED)} />
                    <Row k="Generator" v={WARD_GENERATOR} />
                    <Row k="Wards" v={String(WARDS.length)} />
                    <Row k="Geometry" v="Schematic, WGS84" />
                  </dl>
                </Panel>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-[17px]">Sources</h2>
              <div className="panel mt-3 overflow-hidden">
                <div className="thin-scroll overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead>
                      <tr className="hair-b text-[11px] text-ink-2">
                        <th className="px-4 py-2.5 font-medium">Dataset</th>
                        <th className="px-4 py-2.5 font-medium">Publisher</th>
                        <th className="px-4 py-2.5 font-medium">Resolution</th>
                        <th className="px-4 py-2.5 font-medium">Limitation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DATA_SOURCES.map((s) => (
                        <tr
                          key={s.id}
                          className="border-b border-hairline text-[11.5px] transition-colors last:border-0 hover:bg-panel-2"
                        >
                          <td className="px-4 py-2.5">
                            <span className="flex items-center gap-1.5 font-medium">
                              {s.name}
                              {s.tier === "synthetic" && <SyntheticTag compact />}
                            </span>
                            <span className="text-[10.5px] text-ink-3">
                              {s.period}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-ink-2">{s.publisher}</td>
                          <td className="px-4 py-2.5 text-ink-2">{s.resolution}</td>
                          <td className="max-w-[300px] px-4 py-2.5 text-ink-2">
                            {s.limitation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <footer className="hair-t mt-8 py-5">
              <p className="max-w-[68ch] text-[11.5px] leading-relaxed text-ink-3">
                JalDrishti 2030 is a decision-support prototype built from a
                student research paper. It is not connected to any utility system,
                it does not control anything, and it reports no validated result
                for Bengaluru. Where the audit found no data, the prototype shows
                fabricated data and says so.
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

function Cell({ v }: { v: Grade | "—" }) {
  if (v === "—") return <span className="text-[11px] text-ink-3">—</span>;
  return <GradeChip grade={v} size="xs" />;
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[#7d979f]">{k}</dt>
      <dd className="figure truncate text-[#e8eef0]">{v}</dd>
    </div>
  );
}
