import type { PaperStatus } from "@/components/provenance/StatusBadge";

/**
 * Paper metadata for the research-story landing page.
 *
 * Nothing here is a research finding — it's citation and mapping data, used to
 * connect what the website shows to what the paper claims. Figure paths are
 * placeholders: drop the real files at the given path and the section renders
 * them with no code change.
 */

export const PAPER_META = {
  title:
    "JalDrishti 2030: An IoT–AI Digital Twin for Predictive Water-Stress and Intervention Planning in Bengaluru",
  competition: "BRICS SMART CITY 2030 — Category 3: Smart-City Technologies and Services",
  author: "Jyatin Kumar Singh",
  supervisor: "Dr. Parveen Kumar, Mittal School of Business, Lovely Professional University",
} as const;

export interface StoryStep {
  id: string;
  index: number;
  eyebrow: string;
  title: string;
  status: PaperStatus;
  summary: string;
  paperRef: string;
  linkHref?: string;
  linkLabel?: string;
}

/** The 10-step presentation narrative, in order. */
export const STORY_STEPS: StoryStep[] = [
  {
    id: "problem",
    index: 1,
    eyebrow: "The problem",
    title: "Water stress in Bengaluru isn't one number",
    status: "real",
    summary:
      "A citywide supply-demand balance hides which specific wards run dry. In 2024 a large share of the city's borewells failed while a groundwater assessment flagged dozens of wards and peripheral areas as critical — even as aggregate supply capacity was being increased elsewhere. Adding water to the system doesn't route it to the neighbourhood that has none.",
    paperRef: "§1 Introduction",
  },
  {
    id: "framework",
    index: 2,
    eyebrow: "Research concept",
    title: "A planning layer, not a control system",
    status: "proposed",
    summary:
      "JalDrishti proposes a six-stage cycle sitting above existing utility infrastructure: Sense → Integrate → Predict → Simulate → Optimise → Decide. It recommends where to intervene and why, for human review — it does not operate the network.",
    paperRef: "§4.1 Analytical framework",
  },
  {
    id: "wsi",
    index: 3,
    eyebrow: "Water-stress index",
    title: "Ranking wards from their indicators",
    status: "real",
    summary:
      "Six indicators, normalised with direction reversal so a larger number always means more stress, weighted by entropy derived from the ward set itself rather than assigned by hand. The arithmetic is real and runs live below. Most of the indicators feeding it are synthetic — see the data-availability step.",
    paperRef: "§4.4 Water-Stress Index",
    linkHref: "/stress",
    linkLabel: "Open the full ward map",
  },
  {
    id: "prediction",
    index: 4,
    eyebrow: "Prediction",
    title: "A model has to earn its place",
    status: "real",
    summary:
      "Demand forecasts are validated against a simple seasonal baseline on a held-out chronological window. A more complex model is only adopted if it beats that baseline — otherwise the baseline ships. This rule is implemented and enforced in code, not just described.",
    paperRef: "§4.5 Predictive modelling",
    linkHref: "/stress",
    linkLabel: "See a ward's forecast",
  },
  {
    id: "twin",
    index: 5,
    eyebrow: "Digital twin",
    title: "A representative network, not a calibrated one",
    status: "synthetic",
    summary:
      "The Level 2 hydraulic layer is a stand-in distribution topology you can stress with a leak, a pump outage or a supply cut, with a minimum-pressure feasibility gate. Its pressures come from an illustrative falloff formula today. The paper's proposal is a full EPANET/WNTR solve — that integration hasn't been built yet.",
    paperRef: "§4.7 Level 2 — hydraulic digital twin",
    linkHref: "/network",
    linkLabel: "Open the network view",
  },
  {
    id: "scenarios",
    index: 6,
    eyebrow: "2030 scenarios",
    title: "Four futures, not one forecast",
    status: "proposed",
    summary:
      "Business as usual, supply augmentation, predictive intervention, and integrated water resilience. Each shifts demand, loss and supply multipliers through the index and the network so a plan can be tested against more than one assumption about how the next four years go.",
    paperRef: "§4.13 Scenarios (Table 5)",
    linkHref: "/stress",
    linkLabel: "Compare scenarios on the map",
  },
  {
    id: "optimisation",
    index: 7,
    eyebrow: "Intervention planning",
    title: "There is no single best plan",
    status: "synthetic",
    summary:
      "A prototype multi-objective portfolio search generates candidate intervention sets and keeps only those nothing else beats on every objective at once — cost, residual stress, reach, and equity. The non-dominated sort is real. The intervention effect sizes and costs it searches over are fabricated: the paper gives relative cost bands, not benefit figures. The planned NSGA-II solver and hydraulic verification of leading solutions are not yet built.",
    paperRef: "§4.10–4.11 Optimisation & equity",
    linkHref: "/optimise",
    linkLabel: "Open the Pareto explorer",
  },
  {
    id: "data",
    index: 8,
    eyebrow: "Data availability",
    title: "The finding underneath everything else",
    status: "real",
    summary:
      "A Phase 2 audit graded every variable this model needs against the resolution it needs it at. Ward consumption, non-revenue water and supply reliability all came back at the bottom of the scale — not published anywhere at ward or DMA resolution. This negative result is the reason the rest of the site is built the way it is.",
    paperRef: "§4.3 Phase 2 data-availability audit (Table 3)",
    linkHref: "/data",
    linkLabel: "See the full audit",
  },
  {
    id: "roadmap",
    index: 9,
    eyebrow: "Roadmap",
    title: "Three phases from prototype to validated twin",
    status: "proposed",
    summary:
      "Phase 1, this site, demonstrates the methodology end to end on synthetic and real public data. Phase 2 adds a backend, real ingestion and a persisted analytical engine. Phase 3 adds the real hydraulic solver and optimiser and produces the first results that could earn a Validated label.",
    paperRef: "§7 Future work",
  },
  {
    id: "traceability",
    index: 10,
    eyebrow: "Research paper",
    title: "Every feature traces back to a section",
    status: "real",
    summary:
      "None of this website's mechanics were invented for the demo. Each module below implements a specific, citable part of the paper.",
    paperRef: "Full paper",
  },
];

/** Feature -> paper section, for the traceability table in step 10. */
export const TRACEABILITY: { feature: string; paperRef: string; status: PaperStatus }[] = [
  { feature: "Six-stage Sense→Decide framework", paperRef: "§4.1", status: "proposed" },
  { feature: "Phase 2 data-availability audit", paperRef: "§4.3, Table 3", status: "real" },
  { feature: "Water-Stress Index (normalisation + entropy weighting)", paperRef: "§4.4", status: "real" },
  { feature: "Forecast baseline-vs-candidate validation rule", paperRef: "§4.5", status: "real" },
  { feature: "Level 2 hydraulic digital twin", paperRef: "§4.7", status: "proposed" },
  { feature: "Intervention library & cost bands", paperRef: "§4.9, Table 4", status: "real" },
  { feature: "Multi-objective optimisation objectives", paperRef: "§4.10", status: "proposed" },
  { feature: "Equity-weighted vulnerability index", paperRef: "§4.11", status: "synthetic" },
  { feature: "Sensitivity / rank-stability check", paperRef: "§4.12", status: "real" },
  { feature: "Four 2030 scenarios", paperRef: "§4.13, Table 5", status: "proposed" },
  { feature: "Governance — decision support, not control", paperRef: "§6.5", status: "real" },
];
