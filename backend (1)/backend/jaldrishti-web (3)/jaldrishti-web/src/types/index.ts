/**
 * Domain types for JalDrishti 2030.
 *
 * These mirror the entities named in the research paper so that the frontend
 * contract and the eventual FastAPI contract stay aligned. Every value that
 * reaches the screen carries its resolution grade and synthetic flag.
 */

/** Paper §4.3 / Table 3 — data-availability classification. */
export type Grade = "A" | "B" | "C" | "D" | "E";

export type AccessTier = "public" | "authorized" | "synthetic";

export type SpatialLevel = "ward" | "dma" | "node" | "station" | "city";

/** Paper §4.4 — indicators are stress-increasing or stress-decreasing. */
export type Direction = "stress_increasing" | "stress_decreasing";

export type IndicatorKey =
  | "groundwaterDepletion"
  | "supplyReliability"
  | "nonRevenueWater"
  | "demandPressure"
  | "rainfallDeficit"
  | "tankerDependence";

export interface IndicatorDefinition {
  key: IndicatorKey;
  label: string;
  /** What the number means, in a planner's words. */
  description: string;
  unitHint: string;
  direction: Direction;
  /** Best available public resolution, per the paper's Table 3. */
  grade: Grade;
  synthetic: boolean;
  /** Why this indicator had to be synthesised, quoting the audit finding. */
  sourceNote: string;
}

export interface Ward {
  id: string;
  code: string;
  zone: "Central" | "North" | "South" | "East" | "West";
  areaKm2: number;
  population: number;
  connections: number;
  centroid: [number, number];
  /** Closed ring in WGS84 [lon, lat]. */
  ring: [number, number][];
  indicators: Record<IndicatorKey, number>;
  /** Stands in for the categorical critical-ward notification (Table 3, grade D). */
  notifiedCritical: boolean;
}

/** Output of the Level 1 Water-Stress Twin (paper §4.6). */
export interface WsiResult {
  wardId: string;
  score: number;
  rank: number;
  confidence: number;
  syntheticShare: number;
  contributions: {
    key: IndicatorKey;
    raw: number;
    normalized: number;
    weight: number;
    contribution: number;
  }[];
}

export type WeightingMethod = "entropy" | "equal";

export interface WsiRun {
  method: WeightingMethod;
  weights: Record<IndicatorKey, number>;
  results: WsiResult[];
  byWard: Record<string, WsiResult>;
  syntheticShare: number;
  computedAt: string;
  /** Content hash over inputs + config, mirroring the backend Run model. */
  contentHash: string;
}

/** Paper Table 4 — intervention library. */
export interface InterventionType {
  code: string;
  name: string;
  mechanism: string;
  applicability: string;
  costBand: "Low" | "Low–Medium" | "Medium" | "High";
  equityNote: string;
  requiresHydraulicEval: boolean;
  /** Fractional stress relief, synthetic. Paper gives bands, not numbers. */
  effect: number;
  /** Indicative cost per 1,000 residents in ₹ lakh — synthetic. */
  unitCost: number;
}

export interface PortfolioObjectives {
  totalCost: number;
  residualStress: number;
  populationProtected: number;
  equityWeightedProtection: number;
}

export interface Portfolio extends PortfolioObjectives {
  id: string;
  /** wardId -> intervention code */
  assignments: Record<string, string>;
  wardCount: number;
  hydraulicallyVerified: boolean;
}

/** Paper Table 5 — 2030 planning scenarios. */
export interface Scenario {
  id: "A" | "B" | "C" | "D";
  name: string;
  assumption: string;
  mechanism: string;
  decisionPurpose: string;
  demandMultiplier: number;
  lossMultiplier: number;
  supplyMultiplier: number;
}

/** Paper Table 3, rendered as live data. */
export interface AvailabilityRow {
  variable: string;
  ward: Grade | "—";
  dma: Grade | "—";
  station: Grade | "—";
  best: string;
  limitation: string;
}

export interface DataSource {
  id: string;
  name: string;
  publisher: string;
  tier: AccessTier;
  resolution: string;
  period: string;
  usedFor: string;
  limitation: string;
}

/** Representative hydraulic network (paper §4.7). Not a calibrated model. */
export interface NetworkNode {
  id: string;
  kind: "junction" | "reservoir" | "tank";
  x: number;
  y: number;
  elevation: number;
  baseDemand: number;
}

export interface NetworkLink {
  id: string;
  from: string;
  to: string;
  diameter: number;
  lengthM: number;
}

export interface ProvenanceNode {
  label: string;
  detail: string;
  grade?: Grade;
  synthetic?: boolean;
  children?: ProvenanceNode[];
}
