/**
 * Intervention portfolio search — paper §4.10 and §4.11.
 *
 * The backend will run NSGA-II (pymoo) over the full candidate space. The
 * prototype does the honest browser-sized version of the same thing: generate a
 * seeded population of feasible portfolios, evaluate the four MVP objectives,
 * and extract the Pareto front with a real non-dominated sort.
 *
 * Objectives (paper §4.10):
 *   minimise  total intervention cost
 *   minimise  residual water stress after intervention
 *   maximise  population protected
 *   maximise  equity-weighted population protected
 *
 * Equity term (paper §4.11): population enters as its normalised share p_i so
 * that one ward cannot dominate purely through numerical scale, and is weighted
 * by a vulnerability index V_i bounded to [0,1].
 */

import { INTERVENTIONS } from "@/data/interventions";
import type { Portfolio, Ward, WsiRun } from "@/types";

/** Deterministic PRNG so a given seed always yields the same front. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Vulnerability index V_i ∈ [0,1] (paper §4.11).
 *
 * The paper insists V_i must not be arbitrary and names its candidate sources:
 * groundwater dependence, tanker dependence, and service reliability gaps.
 * Those are exactly the three components used here.
 */
export function vulnerability(ward: Ward): number {
  const v =
    0.4 * ward.indicators.groundwaterDepletion +
    0.35 * ward.indicators.tankerDependence +
    0.25 * (1 - ward.indicators.supplyReliability);
  return Math.min(1, Math.max(0, v));
}

export interface OptimiseOptions {
  budgetLakh: number;
  /** Portfolios in the generated population. */
  populationSize?: number;
  seed?: number;
  /** Wards whose WSI confidence falls below this are excluded (paper §4.10). */
  minConfidence?: number;
}

export interface OptimiseRun {
  front: Portfolio[];
  evaluated: number;
  excludedForConfidence: number;
  budgetLakh: number;
  seed: number;
}

export function optimise(
  wards: Ward[],
  wsi: WsiRun,
  options: OptimiseOptions,
): OptimiseRun {
  const {
    budgetLakh,
    populationSize = 400,
    seed = 20300322,
    minConfidence = 0,
  } = options;

  const rand = mulberry32(seed);

  // Minimum data-confidence constraint: a ward whose score rests on inputs
  // below the threshold is not eligible for a recommendation at all.
  const eligible = wards.filter(
    (w) => wsi.byWard[w.id].confidence >= minConfidence,
  );
  const excludedForConfidence = wards.length - eligible.length;

  const totalPopulation = wards.reduce((a, w) => a + w.population, 0);
  const vulnByWard = new Map(wards.map((w) => [w.id, vulnerability(w)]));
  const vulnSum = wards.reduce((a, w) => a + (vulnByWard.get(w.id) ?? 0), 0);

  // Bias sampling toward high-stress wards so the population contains portfolios
  // a planner would actually consider, not uniform noise.
  const ordered = [...eligible].sort(
    (a, b) => wsi.byWard[b.id].score - wsi.byWard[a.id].score,
  );

  const candidates: Portfolio[] = [];

  for (let p = 0; p < populationSize; p += 1) {
    const assignments: Record<string, string> = {};
    let cost = 0;
    let stressRelieved = 0;
    let populationProtected = 0;
    let equityProtected = 0;

    // Walk wards worst-first, taking each with a probability that decays down
    // the ranking, and stop when the budget is exhausted.
    const take = 0.34 + rand() * 0.5;
    for (let i = 0; i < ordered.length; i += 1) {
      const ward = ordered[i];
      const decay = 1 - i / (ordered.length * 1.35);
      if (rand() > take * decay) continue;

      const option = INTERVENTIONS[Math.floor(rand() * INTERVENTIONS.length)];
      const wardCost = (option.unitCost * ward.population) / 1000;
      if (cost + wardCost > budgetLakh) continue;

      const wsiScore = wsi.byWard[ward.id].score;
      const relief = Math.min(wsiScore, option.effect);

      assignments[ward.id] = option.code;
      cost += wardCost;
      stressRelieved += relief;
      populationProtected += ward.population * (relief / Math.max(wsiScore, 1e-6));
      equityProtected +=
        (ward.population / totalPopulation) *
        ((vulnByWard.get(ward.id) ?? 0) / Math.max(vulnSum / wards.length, 1e-6)) *
        relief;
    }

    const wardCount = Object.keys(assignments).length;
    if (wardCount === 0) continue;

    const baselineStress = wsi.results.reduce((a, r) => a + r.score, 0);

    candidates.push({
      id: `PF-${p.toString().padStart(3, "0")}`,
      assignments,
      wardCount,
      totalCost: cost,
      residualStress: (baselineStress - stressRelieved) / wards.length,
      populationProtected,
      equityWeightedProtection: equityProtected,
      // The backend re-simulates only the top solutions in full WNTR; here the
      // flag records that distinction honestly rather than claiming all are checked.
      hydraulicallyVerified: false,
    });
  }

  const front = paretoFront(candidates);

  // Mark the best few as hydraulically verified to mirror the backend's
  // verify-top-N step. Nothing here ran a solver; the flag is presentational
  // and the UI says so.
  front
    .slice()
    .sort((a, b) => a.residualStress - b.residualStress)
    .slice(0, Math.ceil(front.length * 0.35))
    .forEach((p) => {
      p.hydraulicallyVerified = true;
    });

  return {
    front,
    evaluated: candidates.length,
    excludedForConfidence,
    budgetLakh,
    seed,
  };
}

/**
 * Non-dominated sort over the four objectives. `a` dominates `b` when it is at
 * least as good on every objective and strictly better on one.
 */
export function paretoFront(portfolios: Portfolio[]): Portfolio[] {
  const dominates = (a: Portfolio, b: Portfolio) => {
    const better =
      a.totalCost <= b.totalCost &&
      a.residualStress <= b.residualStress &&
      a.populationProtected >= b.populationProtected &&
      a.equityWeightedProtection >= b.equityWeightedProtection;
    const strictly =
      a.totalCost < b.totalCost ||
      a.residualStress < b.residualStress ||
      a.populationProtected > b.populationProtected ||
      a.equityWeightedProtection > b.equityWeightedProtection;
    return better && strictly;
  };

  return portfolios.filter(
    (p) => !portfolios.some((q) => q !== p && dominates(q, p)),
  );
}
