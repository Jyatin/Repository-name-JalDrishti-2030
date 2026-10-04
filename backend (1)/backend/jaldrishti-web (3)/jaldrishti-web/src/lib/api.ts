/**
 * The seam between the UI and its data.
 *
 * Each function returns exactly the shape the corresponding FastAPI endpoint
 * will return, so swapping a fixture for a fetch is a one-line change inside
 * this file and nothing else moves.
 *
 * Current state, stated plainly: the page components still import their
 * fixtures from `src/data` directly, because nothing is async yet and adding a
 * loading state for a synchronous constant would be theatre. Phase 2 converts
 * the pages to read through these functions at the same time as it points them
 * at the live service — that is one mechanical pass over four files.
 */

import { AVAILABILITY_AUDIT, DATA_SOURCES, INDICATORS, RAINFALL_RECORD } from "@/data/catalogue";
import { INTERVENTIONS, NETWORK_LINKS, NETWORK_META, NETWORK_NODES, SCENARIOS } from "@/data/interventions";
import { CITY_BOUNDARY, WARDS, WARD_GENERATOR, WARD_LATTICE_SEED } from "@/data/wards";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? null;

/** True while the app is running on local fixtures rather than a live service. */
export const IS_FIXTURE_MODE = API_BASE_URL === null;

/**
 * Backend contract. Kept here so the two sides of the swap stay in step.
 *   GET /spatial/wards            -> getWards()
 *   GET /data/availability        -> getAvailabilityAudit()
 *   GET /data/sources             -> getDataSources()
 *   GET /interventions/types      -> getInterventions()
 *   GET /network/models/{id}      -> getNetwork()
 *   GET /scenarios                -> getScenarios()
 */

export async function getWards() {
  return {
    boundary: CITY_BOUNDARY,
    wards: WARDS,
    meta: {
      schematic: true,
      seed: WARD_LATTICE_SEED,
      generator: WARD_GENERATOR,
      note:
        "Schematic ward lattice in real WGS84 coordinates. Not official ward boundary data.",
    },
  };
}

export async function getIndicators() {
  return INDICATORS;
}

export async function getAvailabilityAudit() {
  return AVAILABILITY_AUDIT;
}

export async function getDataSources() {
  return DATA_SOURCES;
}

export async function getRainfallRecord() {
  return RAINFALL_RECORD;
}

export async function getInterventions() {
  return INTERVENTIONS;
}

export async function getScenarios() {
  return SCENARIOS;
}

export async function getNetwork() {
  return { nodes: NETWORK_NODES, links: NETWORK_LINKS, meta: NETWORK_META };
}
