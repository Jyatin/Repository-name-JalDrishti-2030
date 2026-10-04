import type {
  AvailabilityRow,
  DataSource,
  IndicatorDefinition,
  IndicatorKey,
} from "@/types";

/**
 * Indicator set for the Level 1 Water-Stress Index (paper §4.4).
 *
 * `grade` is the best public resolution the paper's Phase 2 audit found for
 * each variable. Everything graded E is synthesised here, because the audit
 * concluded no usable public ward/DMA series exists — that finding is the
 * reason this prototype exists, so it is surfaced rather than hidden.
 */
export const INDICATORS: IndicatorDefinition[] = [
  {
    key: "groundwaterDepletion",
    label: "Groundwater depletion",
    description:
      "How far the local aquifer has drawn down relative to the rest of the city.",
    unitHint: "0 = stable aquifer, 1 = severe drawdown",
    direction: "stress_increasing",
    grade: "C",
    synthetic: true,
    sourceNote:
      "Audit: station observations exist, but reviewed metadata do not identify Bengaluru Urban stations well enough to assign them to wards.",
  },
  {
    key: "supplyReliability",
    label: "Supply reliability",
    description:
      "Share of planned piped supply hours a ward actually receives.",
    unitHint: "0 = frequent interruption, 1 = dependable supply",
    direction: "stress_decreasing",
    grade: "E",
    synthetic: true,
    sourceNote:
      "Audit: no systematic ward or DMA record of supply hours, interruption frequency or pressure was identified.",
  },
  {
    key: "nonRevenueWater",
    label: "Non-revenue water",
    description:
      "Water put into the network that never reaches a billed connection.",
    unitHint: "0 = negligible loss, 1 = severe loss",
    direction: "stress_increasing",
    grade: "E",
    synthetic: true,
    sourceNote:
      "Audit: only city-level loss evidence was identified; no ward or DMA measurements are published.",
  },
  {
    key: "demandPressure",
    label: "Demand pressure",
    description:
      "Demand per connection measured against the ward's available supply.",
    unitHint: "0 = comfortable margin, 1 = demand exceeds supply",
    direction: "stress_increasing",
    grade: "E",
    synthetic: true,
    sourceNote:
      "Audit: no sufficiently usable public ward or DMA consumption series was identified.",
  },
  {
    key: "rainfallDeficit",
    label: "Rainfall deficit",
    description:
      "Shortfall against the 1991–2020 long-period average of 1,077.1 mm.",
    unitHint: "0 = at or above average, 1 = severe deficit",
    direction: "stress_increasing",
    grade: "C",
    synthetic: false,
    sourceNote:
      "City-level series is real (IMD, republished by OpenCity). The ward-level split shown here is synthetic: Bengaluru shows low spatial rainfall variability, which limits ward discrimination.",
  },
  {
    key: "tankerDependence",
    label: "Tanker dependence",
    description:
      "How far households fall back on tankers and private borewells.",
    unitHint: "0 = piped supply suffices, 1 = heavy tanker reliance",
    direction: "stress_increasing",
    grade: "D",
    synthetic: true,
    sourceNote:
      "Audit: vulnerability evidence exists as a categorical critical-ward notification, not as a measured quantity.",
  },
];

export const INDICATOR_BY_KEY: Record<IndicatorKey, IndicatorDefinition> =
  Object.fromEntries(INDICATORS.map((i) => [i.key, i])) as Record<
    IndicatorKey,
    IndicatorDefinition
  >;

/** Paper Table 3 — the Phase 2 data-availability audit, rendered as data. */
export const AVAILABILITY_AUDIT: AvailabilityRow[] = [
  {
    variable: "Water consumption",
    ward: "E",
    dma: "E",
    station: "—",
    best: "E",
    limitation:
      "No sufficiently usable public ward or DMA monthly or annual consumption series identified.",
  },
  {
    variable: "Groundwater levels",
    ward: "E",
    dma: "E",
    station: "C",
    best: "C",
    limitation:
      "Station observations exist, but reviewed metadata do not sufficiently identify Bengaluru Urban stations for ward assignment.",
  },
  {
    variable: "Groundwater criticality",
    ward: "D",
    dma: "—",
    station: "—",
    best: "D",
    limitation:
      "The critical-ward list is binary and categorical; the underlying quantitative measurements were not published.",
  },
  {
    variable: "Rainfall",
    ward: "C",
    dma: "—",
    station: "C",
    best: "C",
    limitation:
      "Station data can be spatially assigned, but Bengaluru shows low spatial variability, limiting ward discrimination.",
  },
  {
    variable: "Population / exposure",
    ward: "C",
    dma: "—",
    station: "C",
    best: "C",
    limitation:
      "No official ward population download; gridded aggregation is possible but introduces uncertainty.",
  },
  {
    variable: "Supply reliability",
    ward: "E",
    dma: "E",
    station: "—",
    best: "E",
    limitation:
      "No systematic ward or DMA record of supply hours, interruption frequency or pressure identified.",
  },
  {
    variable: "Non-revenue water",
    ward: "E",
    dma: "E",
    station: "—",
    best: "E",
    limitation:
      "Only city-level loss evidence identified; no ward or DMA measurements published.",
  },
  {
    variable: "Network GIS / hydraulics",
    ward: "—",
    dma: "B",
    station: "—",
    best: "B/C",
    limitation:
      "Pipe and network geometry may exist, but access and processing are uncertain; no DMA flow or pressure measurements published.",
  },
];

/** Paper Table 10 — what the study actually used, and what it could not. */
export const DATA_SOURCES: DataSource[] = [
  {
    id: "imd-rainfall",
    name: "Bengaluru monthly rainfall",
    publisher: "IMD, republished by OpenCity",
    tier: "public",
    resolution: "Single city series",
    period: "1901–2024",
    usedFor: "Rainfall deficit against the long-period average",
    limitation: "Not ward or DMA resolved; 2024 incomplete.",
  },
  {
    id: "ksndmc-stations",
    name: "Bengaluru Urban rainfall stations",
    publisher: "KSNDMC, republished by OpenCity",
    tier: "public",
    resolution: "Station / taluk",
    period: "2024",
    usedFor: "Station rainfall context",
    limitation: "Not joined to verified ward boundaries.",
  },
  {
    id: "bwssb-gis",
    name: "Supply-line geometry",
    publisher: "Utility source, republished by OpenCity",
    tier: "public",
    resolution: "Line map, diameter classes",
    period: "2025",
    usedFor: "Spatial network context only",
    limitation:
      "No published DMA flow, pressure, demand or reliability series.",
  },
  {
    id: "cgwb",
    name: "Groundwater monitoring",
    publisher: "Central Ground Water Board",
    tier: "public",
    resolution: "Monitoring wells / stations",
    period: "Periodic",
    usedFor: "Availability documented, not used numerically",
    limitation: "No consistent ward crosswalk in reviewed metadata.",
  },
  {
    id: "ward-boundaries",
    name: "Ward boundary resources",
    publisher: "Municipal / metropolitan authority",
    tier: "public",
    resolution: "Ward polygons",
    period: "2022–2026",
    usedFor: "Spatial reference",
    limitation:
      "Ward schemes change between releases and no matching operational observations exist.",
  },
  {
    id: "synthetic-ops",
    name: "Ward operational series",
    publisher: "JalDrishti synthetic generator",
    tier: "synthetic",
    resolution: "Ward, monthly",
    period: "2021–2026 (generated)",
    usedFor: "Consumption, losses, reliability and tanker dependence",
    limitation:
      "Fabricated under a documented seed. Carries no evidential weight and must not be read as a measurement.",
  },
  {
    id: "representative-network",
    name: "Representative distribution network",
    publisher: "JalDrishti synthetic generator",
    tier: "synthetic",
    resolution: "Network zone",
    period: "Static topology",
    usedFor: "Illustrating the Level 2 hydraulic layer",
    limitation:
      "A stand-in topology. Not a calibrated Bengaluru DMA and not an EPANET solver run.",
  },
];

/**
 * Paper §5.10 / Table 9 — the one genuinely empirical result in the study.
 * These are real reported values, not generated.
 */
export const RAINFALL_RECORD = {
  longPeriodAverageMm: 1077.1,
  completeYears: 33,
  windowLabel: "1991–2023",
  meanMm: 1084.27,
  medianMm: 1068.4,
  minMm: 587.2,
  minYear: 1994,
  maxMm: 1957.7,
  maxYear: 2022,
  yearsBelowAverage: 18,
  source: "IMD series republished by OpenCity",
} as const;
