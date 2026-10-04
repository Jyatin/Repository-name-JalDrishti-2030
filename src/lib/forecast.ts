/**
 * Demand and stress forecasting — paper §4.5 and §5.3.
 *
 * The paper's rule is that a more complex model may only be adopted if it beats
 * a simple baseline under chronological validation. The prototype honours the
 * shape of that rule: it computes a seasonal-naive baseline and a damped-trend
 * candidate over the same series, scores both with MAE and RMSE on a held-out
 * chronological tail, and reports which one won.
 *
 * No Bengaluru accuracy figure is being claimed. The series is synthetic; what
 * is real is the validation procedure.
 */

import type { Ward } from "@/types";

export interface SeriesPoint {
  period: string;
  value: number;
}

export interface ForecastPoint extends SeriesPoint {
  lower: number;
  upper: number;
}

export interface ForecastRun {
  history: SeriesPoint[];
  forecast: ForecastPoint[];
  baselineMae: number;
  baselineRmse: number;
  candidateMae: number;
  candidateRmse: number;
  /** True when the candidate earned its place over the baseline (§4.5). */
  candidateAdopted: boolean;
  horizonMonths: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function label(index: number, startYear: number): string {
  return `${MONTHS[index % 12]} ${startYear + Math.floor(index / 12)}`;
}

/** Stable per-ward pseudo-noise so the series is deterministic across renders. */
function noise(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x) - 0.5;
}

function seedOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h % 9973) + 7;
}

/**
 * Builds a synthetic monthly demand series for a ward: a level set by its
 * connection count, a monsoon-shaped seasonal term, a mild growth trend and
 * bounded noise.
 */
export function buildHistory(ward: Ward, months = 48, startYear = 2022): SeriesPoint[] {
  const seed = seedOf(ward.id);
  const level = ward.connections * 0.0185;
  const out: SeriesPoint[] = [];
  for (let i = 0; i < months; i += 1) {
    const m = i % 12;
    // Demand dips through the June–September monsoon and peaks in the dry months.
    const seasonal = Math.cos(((m - 3) / 12) * 2 * Math.PI) * 0.14;
    const trend = (i / months) * 0.09 * (0.6 + ward.indicators.demandPressure);
    const value = level * (1 + seasonal + trend + noise(seed, i) * 0.05);
    out.push({ period: label(i, startYear), value: Math.round(value * 100) / 100 });
  }
  return out;
}

function mae(actual: number[], predicted: number[]): number {
  const n = actual.length;
  return actual.reduce((a, v, i) => a + Math.abs(v - predicted[i]), 0) / n;
}

function rmse(actual: number[], predicted: number[]): number {
  const n = actual.length;
  return Math.sqrt(
    actual.reduce((a, v, i) => a + (v - predicted[i]) ** 2, 0) / n,
  );
}

/** Seasonal naive: this month equals the same month one year ago. */
function seasonalNaive(series: number[], from: number, horizon: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < horizon; i += 1) {
    out.push(series[from + i - 12]);
  }
  return out;
}

/** Seasonal naive plus a damped linear trend fitted on the training window. */
function dampedTrend(
  series: number[],
  from: number,
  horizon: number,
  damping = 0.86,
): number[] {
  const window = series.slice(Math.max(0, from - 24), from);
  const n = window.length;
  const meanX = (n - 1) / 2;
  const meanY = window.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    num += (i - meanX) * (window[i] - meanY);
    den += (i - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;

  const out: number[] = [];
  let carried = 0;
  for (let i = 0; i < horizon; i += 1) {
    carried = carried * damping + slope;
    out.push(series[from + i - 12] + carried);
  }
  return out;
}

export function forecastWard(ward: Ward, horizonMonths = 12): ForecastRun {
  const history = buildHistory(ward);
  const values = history.map((p) => p.value);

  // Chronological validation: hold out the final 12 observed months.
  const holdout = 12;
  const splitAt = values.length - holdout;
  const actual = values.slice(splitAt);

  const basePred = seasonalNaive(values, splitAt, holdout);
  const candPred = dampedTrend(values, splitAt, holdout);

  const baselineMae = mae(actual, basePred);
  const baselineRmse = rmse(actual, basePred);
  const candidateMae = mae(actual, candPred);
  const candidateRmse = rmse(actual, candPred);

  // Paper §4.5: adopt the more complex model only on a defensible advantage.
  const candidateAdopted = candidateMae < baselineMae * 0.98;

  // Forward forecast from the full series using whichever model won.
  const extended = [...values];
  const forecast: ForecastPoint[] = [];
  const residual = candidateAdopted ? candidateRmse : baselineRmse;

  for (let i = 0; i < horizonMonths; i += 1) {
    const at = extended.length;
    const point = candidateAdopted
      ? dampedTrend(extended, at, 1)[0]
      : seasonalNaive(extended, at, 1)[0];
    extended.push(point);
    // Interval widens with horizon, as forecast uncertainty should (§4.12).
    const spread = residual * 1.28 * Math.sqrt(i + 1);
    forecast.push({
      period: label(values.length + i, 2022),
      value: Math.round(point * 100) / 100,
      lower: Math.round((point - spread) * 100) / 100,
      upper: Math.round((point + spread) * 100) / 100,
    });
  }

  return {
    history,
    forecast,
    baselineMae,
    baselineRmse,
    candidateMae,
    candidateRmse,
    candidateAdopted,
    horizonMonths,
  };
}

/**
 * Illustrative pressure field for the Level 2 view.
 *
 * IMPORTANT: this is a distance-and-diameter falloff, not a hydraulic solve.
 * EPANET/WNTR runs server-side in a later phase. The UI labels it accordingly.
 */
export function illustrativePressure(
  distanceFromSource: number,
  elevation: number,
  demandMultiplier: number,
): number {
  const head = 118 - elevation;
  const loss = distanceFromSource * 0.017 * demandMultiplier;
  return Math.max(2, Math.round((head - loss) * 10) / 10);
}
