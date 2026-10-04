import type {
  InterventionType,
  NetworkLink,
  NetworkNode,
  Scenario,
} from "@/types";

/**
 * Paper Table 4 — intervention library.
 *
 * Mechanism, applicability, cost band and equity note are taken from the paper.
 * `effect` and `unitCost` are NOT in the paper: it gives relative cost bands and
 * states that no benefit should be claimed without local justification. They are
 * synthetic placeholders so the optimiser has something to search over.
 */
export const INTERVENTIONS: InterventionType[] = [
  {
    code: "PRESSURE",
    name: "Pressure management",
    mechanism: "Controls pressure conditions in selected network areas.",
    applicability: "Network zones where pressure conditions justify action.",
    costBand: "Low–Medium",
    equityNote:
      "Can prioritise areas with poor service reliability or pressure-related inequity.",
    requiresHydraulicEval: true,
    effect: 0.14,
    unitCost: 3.2,
  },
  {
    code: "LEAKAGE",
    name: "Leakage control",
    mechanism:
      "Targets distribution losses through detection, repair or operational measures.",
    applicability: "Network segments with credible loss evidence.",
    costBand: "Medium",
    equityNote:
      "Can protect service where losses drive unreliable supply.",
    requiresHydraulicEval: true,
    effect: 0.22,
    unitCost: 7.8,
  },
  {
    code: "DEMAND",
    name: "Demand management",
    mechanism:
      "Reduces or shifts water demand through behavioural or service measures.",
    applicability: "Neighbourhoods where demand measures are applicable.",
    costBand: "Low–Medium",
    equityNote:
      "Can reduce household and system burden, but acceptance must be assessed.",
    requiresHydraulicEval: false,
    effect: 0.11,
    unitCost: 2.1,
  },
  {
    code: "RWH",
    name: "Rainwater harvesting",
    mechanism: "Adds local rainwater capture for applicable uses.",
    applicability: "Buildings and areas with suitable collection potential.",
    costBand: "Medium",
    equityNote:
      "Useful where supply reliability is low; feasibility depends on site conditions.",
    requiresHydraulicEval: false,
    effect: 0.17,
    unitCost: 6.4,
  },
  {
    code: "SUPPLY",
    name: "Supply augmentation",
    mechanism: "Adds verified external or centralised source capacity.",
    applicability: "Zones that can physically receive additional supply.",
    costBand: "High",
    equityNote:
      "May reduce shortage exposure, but benefits depend on local distribution.",
    requiresHydraulicEval: true,
    effect: 0.29,
    unitCost: 18.5,
  },
];

export const INTERVENTION_BY_CODE: Record<string, InterventionType> =
  Object.fromEntries(INTERVENTIONS.map((i) => [i.code, i]));

/** Paper Table 5 — the four 2030 planning scenarios. */
export const SCENARIOS: Scenario[] = [
  {
    id: "A",
    name: "Business as usual",
    assumption: "Existing management and verified programmes continue.",
    mechanism: "Reference trajectory.",
    decisionPurpose: "Baseline for comparison.",
    demandMultiplier: 1.0,
    lossMultiplier: 1.0,
    supplyMultiplier: 1.0,
  },
  {
    id: "B",
    name: "Supply augmentation",
    assumption: "Verified supply additions occur.",
    mechanism: "Increased source availability.",
    decisionPurpose: "Test the supply-side response.",
    demandMultiplier: 1.04,
    lossMultiplier: 1.0,
    supplyMultiplier: 0.82,
  },
  {
    id: "C",
    name: "Predictive intervention",
    assumption: "Forecasts guide intervention priorities.",
    mechanism: "Earlier spatial targeting.",
    decisionPurpose: "Test the value of predictive planning.",
    demandMultiplier: 0.97,
    lossMultiplier: 0.86,
    supplyMultiplier: 0.95,
  },
  {
    id: "D",
    name: "Integrated water resilience",
    assumption:
      "Supply, demand, loss, recharge and equity measures are combined.",
    mechanism: "Portfolio-based resilience.",
    decisionPurpose: "Compare integrated pathways.",
    demandMultiplier: 0.92,
    lossMultiplier: 0.74,
    supplyMultiplier: 0.86,
  },
];

/**
 * Representative distribution network for the Level 2 layer (paper §4.7).
 *
 * A stand-in topology in local millimetre coordinates. It is not a Bengaluru
 * DMA, it is not calibrated, and the pressures shown in the UI come from a
 * simple illustrative head-loss falloff — not from an EPANET/WNTR solve.
 * The real solver runs server-side in a later phase.
 */
const RESERVOIR = { x: 60, y: 120 };

function buildNetwork(): { nodes: NetworkNode[]; links: NetworkLink[] } {
  const nodes: NetworkNode[] = [
    {
      id: "R1",
      kind: "reservoir",
      x: RESERVOIR.x,
      y: RESERVOIR.y,
      elevation: 118,
      baseDemand: 0,
    },
  ];
  const links: NetworkLink[] = [];

  // Three trunk branches, each fanning into distribution junctions.
  const branches = [
    { angle: -34, count: 7 },
    { angle: 2, count: 8 },
    { angle: 36, count: 7 },
  ];

  let n = 0;
  branches.forEach((branch, bi) => {
    let prev = "R1";
    for (let i = 0; i < branch.count; i += 1) {
      n += 1;
      const id = `J${n.toString().padStart(2, "0")}`;
      const spread = (i % 3) - 1;
      const rad = ((branch.angle + spread * 9) * Math.PI) / 180;
      const dist = 62 + i * 46;
      nodes.push({
        id,
        kind: "junction",
        x: RESERVOIR.x + Math.cos(rad) * dist,
        y: RESERVOIR.y + Math.sin(rad) * dist,
        elevation: 96 - i * 1.4 + spread * 2,
        baseDemand: 3.1 + ((n * 7) % 11) * 0.42,
      });
      links.push({
        id: `P${links.length + 1}`,
        from: prev,
        to: id,
        diameter: 500 - i * 45 - bi * 20,
        lengthM: Math.round(dist * 3.4),
      });
      prev = id;
    }
  });

  // Two cross-connections so the network is looped, not purely branched.
  links.push({ id: "P90", from: "J05", to: "J12", diameter: 200, lengthM: 640 });
  links.push({ id: "P91", from: "J13", to: "J19", diameter: 200, lengthM: 710 });

  return { nodes, links };
}

export const { nodes: NETWORK_NODES, links: NETWORK_LINKS } = buildNetwork();

export const NETWORK_META = {
  name: "Representative zone RZ-1",
  calibrated: false,
  provenanceNote:
    "Stand-in topology used to exercise the Level 2 layer. Not a calibrated Bengaluru DMA, and not an EPANET/WNTR solver run.",
  nodeCount: NETWORK_NODES.length,
  linkCount: NETWORK_LINKS.length,
} as const;
