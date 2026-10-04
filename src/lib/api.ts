/** The FastAPI service currently exposes health only; analytical data stays local. */

import { AVAILABILITY_AUDIT, DATA_SOURCES, INDICATORS, RAINFALL_RECORD } from "@/data/catalogue";
import { INTERVENTIONS, NETWORK_LINKS, NETWORK_META, NETWORK_NODES, SCENARIOS } from "@/data/interventions";
import { CITY_BOUNDARY, WARDS, WARD_GENERATOR, WARD_LATTICE_SEED } from "@/data/wards";

const configuredApiUrl =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

/** The URL must include the API prefix, e.g. https://api.example.com/api/v1. */
export const API_BASE_URL = configuredApiUrl?.replace(/\/+$/, "") || null;

/** All analytical screens still use prototype fixtures, whether the API is online or not. */
export const IS_FIXTURE_MODE = true;

export interface HealthResponse {
  status: string;
  environment: string;
  database: string;
}

function isHealthResponse(value: unknown): value is HealthResponse {
  if (typeof value !== "object" || value === null) return false;
  const health = value as Record<string, unknown>;
  return (
    typeof health.status === "string" &&
    typeof health.environment === "string" &&
    typeof health.database === "string"
  );
}

export async function getBackendHealth(
  signal?: AbortSignal,
): Promise<HealthResponse> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const response = await fetch(`${API_BASE_URL}/health`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Backend health request failed (HTTP ${response.status}).`);
  }

  const body: unknown = await response.json();
  if (!isHealthResponse(body)) {
    throw new Error("Backend health response did not match the expected schema.");
  }

  return body;
}

/** Fixture-backed adapters retained until matching backend data routes exist. */
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
