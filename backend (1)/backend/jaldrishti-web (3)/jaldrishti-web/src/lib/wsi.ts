/**
 * Level 1 Water-Stress Index engine — paper §4.4 and §4.6.
 *
 * This is a real implementation, not a lookup table. Given the ward indicator
 * set it performs min–max normalisation with direction reversal, derives
 * entropy weights from the observation set, and returns per-ward scores with
 * their full contribution breakdown so the provenance drawer can explain any
 * ranking down to the indicator that caused it.
 *
 * The inputs are mostly synthetic. The arithmetic is not.
 */

import { INDICATORS, INDICATOR_BY_KEY } from "@/data/catalogue";
import type {
  IndicatorKey,
  Ward,
  WeightingMethod,
  WsiResult,
  WsiRun,
} from "@/types";

/**
 * Min–max normalisation to [0,1].
 *
 * Paper §4.4: for a stress-increasing indicator the raw direction is kept;
 * where a larger value represents better service, the direction is reversed so
 * that 1 always means "more stress".
 */
export function normalize(
  value: number,
  min: number,
  max: number,
  reverse: boolean,
): number {
  if (max - min < 1e-12) return 0.5; // degenerate indicator carries no signal
  const t = (value - min) / (max - min);
  return reverse ? 1 - t : t;
}

/**
 * Entropy weighting (paper §4.4).
 *
 * For indicator k, p_ik = X'_ik / Σ_i X'_ik; the entropy e_k follows from those
 * proportions; d_k = 1 − e_k is the diversification term; weights are the
 * normalised d_k. Where p_ik = 0 the term p·ln(p) is taken as zero.
 *
 * The paper is explicit that this does not make the index objectively true —
 * it is a replicable procedure for deriving weights from data, which is why the
 * UI always offers equal weighting alongside it for sensitivity comparison.
 */
export function entropyWeights(
  columns: Record<IndicatorKey, number[]>,
  keys: IndicatorKey[],
): Record<IndicatorKey, number> {
  const n = columns[keys[0]].length;
  if (n < 2) {
    return equalWeights(keys);
  }
  const k = 1 / Math.log(n);
  const diversification: Record<string, number> = {};

  for (const key of keys) {
    const col = columns[key];
    const total = col.reduce((a, b) => a + b, 0);
    if (total < 1e-12) {
      diversification[key] = 0;
      continue;
    }
    let entropy = 0;
    for (const v of col) {
      const p = v / total;
      if (p > 0) entropy -= p * Math.log(p);
    }
    entropy *= k;
    diversification[key] = Math.max(0, 1 - entropy);
  }

  const sum = keys.reduce((a, key) => a + diversification[key], 0);
  if (sum < 1e-12) return equalWeights(keys);

  return Object.fromEntries(
    keys.map((key) => [key, diversification[key] / sum]),
  ) as Record<IndicatorKey, number>;
}

export function equalWeights(
  keys: IndicatorKey[],
): Record<IndicatorKey, number> {
  const w = 1 / keys.length;
  return Object.fromEntries(keys.map((key) => [key, w])) as Record<
    IndicatorKey,
    number
  >;
}

/** Confidence falls with resolution grade, per the paper's Table 3 ladder. */
const GRADE_CONFIDENCE: Record<string, number> = {
  A: 0.95,
  B: 0.85,
  C: 0.68,
  D: 0.42,
  E: 0.25,
};

/** Small stable hash so a run can be identified the way the backend Run is. */
function contentHash(parts: string[]): string {
  let h = 0x811c9dc5;
  for (const part of parts) {
    for (let i = 0; i < part.length; i += 1) {
      h ^= part.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
  }
  return h.toString(16).padStart(8, "0");
}

export interface WsiOptions {
  method?: WeightingMethod;
  /** Manual overrides applied on top of the derived weights, then renormalised. */
  overrides?: Partial<Record<IndicatorKey, number>>;
  /** Multiplies stress-increasing indicators; used by the scenario selector. */
  stressMultiplier?: number;
}

export function computeWsi(wards: Ward[], options: WsiOptions = {}): WsiRun {
  const { method = "entropy", overrides, stressMultiplier = 1 } = options;
  const keys = INDICATORS.map((i) => i.key);

  // 1. Normalise every indicator across the ward set, reversing direction where
  //    a larger raw value means better service.
  const normalized: Record<IndicatorKey, number[]> = {} as Record<
    IndicatorKey,
    number[]
  >;

  for (const key of keys) {
    const def = INDICATOR_BY_KEY[key];
    const raw = wards.map((w) => w.indicators[key]);
    const min = Math.min(...raw);
    const max = Math.max(...raw);
    const reverse = def.direction === "stress_decreasing";
    normalized[key] = raw.map((v) => {
      const base = normalize(v, min, max, reverse);
      return Math.min(1, Math.max(0, base * stressMultiplier));
    });
  }

  // 2. Derive weights from the observation set.
  let weights =
    method === "entropy"
      ? entropyWeights(normalized, keys)
      : equalWeights(keys);

  if (overrides) {
    const merged = keys.map((key) => {
      const o = overrides[key];
      return [key, o === undefined ? weights[key] : Math.max(0, o)] as const;
    });
    const total = merged.reduce((a, [, v]) => a + v, 0);
    weights = Object.fromEntries(
      merged.map(([key, v]) => [key, total > 0 ? v / total : 0]),
    ) as Record<IndicatorKey, number>;
  }

  // 3. Score each ward and record how every indicator contributed.
  const results: WsiResult[] = wards.map((ward, idx) => {
    const contributions = keys.map((key) => {
      const norm = normalized[key][idx];
      const weight = weights[key];
      return {
        key,
        raw: ward.indicators[key],
        normalized: norm,
        weight,
        contribution: norm * weight,
      };
    });

    const score = contributions.reduce((a, c) => a + c.contribution, 0);

    // Confidence is the weighted mean of each indicator's grade confidence, so
    // a score leaning on grade-E inputs reports lower confidence than one
    // leaning on grade-C inputs.
    const confidence = keys.reduce(
      (a, key) => a + weights[key] * GRADE_CONFIDENCE[INDICATOR_BY_KEY[key].grade],
      0,
    );

    // Synthetic share is the weight sitting on fabricated indicators.
    const syntheticShare = keys.reduce(
      (a, key) => a + (INDICATOR_BY_KEY[key].synthetic ? weights[key] : 0),
      0,
    );

    return {
      wardId: ward.id,
      score,
      rank: 0,
      confidence,
      syntheticShare,
      contributions,
    };
  });

  results.sort((a, b) => b.score - a.score);
  results.forEach((r, i) => {
    r.rank = i + 1;
  });

  const byWard = Object.fromEntries(results.map((r) => [r.wardId, r]));

  return {
    method,
    weights,
    results,
    byWard,
    syntheticShare: results[0]?.syntheticShare ?? 0,
    computedAt: new Date().toISOString(),
    contentHash: contentHash([
      method,
      String(stressMultiplier),
      JSON.stringify(overrides ?? {}),
      String(wards.length),
    ]),
  };
}

/**
 * Rank stability between two runs (paper §4.4: "priority zones are deemed
 * robust if they maintain their classification or ranking under different
 * circumstances"). Returns Spearman's rho.
 */
export function rankCorrelation(a: WsiRun, b: WsiRun): number {
  const ids = a.results.map((r) => r.wardId);
  const n = ids.length;
  if (n < 2) return 1;
  const dSquared = ids.reduce((acc, id) => {
    const d = a.byWard[id].rank - b.byWard[id].rank;
    return acc + d * d;
  }, 0);
  return 1 - (6 * dSquared) / (n * (n * n - 1));
}

/** Five stress classes, used for the map ramp and the priority list. */
export type StressClass = "secure" | "watch" | "elevated" | "high" | "critical";

export function stressClass(score: number): StressClass {
  if (score < 0.28) return "secure";
  if (score < 0.42) return "watch";
  if (score < 0.55) return "elevated";
  if (score < 0.68) return "high";
  return "critical";
}

export const STRESS_LABEL: Record<StressClass, string> = {
  secure: "Secure",
  watch: "Watch",
  elevated: "Elevated",
  high: "High",
  critical: "Critical",
};
