"use client";

import { useEffect, useState } from "react";
import {
  API_BASE_URL,
  getBackendHealth,
  type HealthResponse,
} from "@/lib/api";

type BackendStatus =
  | { kind: "not-configured" }
  | { kind: "checking" }
  | { kind: "available"; health: HealthResponse }
  | { kind: "unavailable" };

export function DataSystemStatus({
  syntheticShare,
}: {
  syntheticShare: number;
}) {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>(
    API_BASE_URL ? { kind: "checking" } : { kind: "not-configured" },
  );

  useEffect(() => {
    if (!API_BASE_URL) return;

    const controller = new AbortController();
    void getBackendHealth(controller.signal)
      .then((health) => {
        if (!controller.signal.aborted) {
          setBackendStatus({ kind: "available", health });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setBackendStatus({ kind: "unavailable" });
        }
      });

    return () => controller.abort();
  }, []);

  const apiLabel =
    backendStatus.kind === "not-configured"
      ? "Not configured"
      : backendStatus.kind === "checking"
        ? "Checking"
        : backendStatus.kind === "unavailable"
          ? "Unavailable"
          : "Available";
  const databaseLabel =
    backendStatus.kind === "available"
      ? backendStatus.health.database === "ok"
        ? "Database available"
        : "Database unavailable"
      : null;

  return (
    <section
      aria-labelledby="data-system-status-title"
      className="hair-t shrink-0 bg-panel px-4 py-2.5 sm:px-5"
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-5 gap-y-1.5">
        <h2
          id="data-system-status-title"
          className="text-[10.5px] font-semibold tracking-[0.03em] text-ink-2"
        >
          Data &amp; system status
        </h2>
        <p className="text-[10.5px] text-ink-2">
          Data: <span className="font-medium text-ink">Prototype / synthetic</span>
        </p>
        <p className="text-[10.5px] text-ink-2" aria-live="polite">
          API: <span className="font-medium text-ink">{apiLabel}</span>
          {databaseLabel && (
            <span className="text-ink-3"> · {databaseLabel}</span>
          )}
        </p>
        <p className="figure text-[10.5px] text-ink-2">
          {Math.round(syntheticShare * 100)}% synthetic
        </p>
        <p className="basis-full text-[10.5px] leading-snug text-ink-3">
          Analytical outputs are prototype/simulated and demonstrate the
          JalDrishti digital-twin workflow; they are not current real-world
          measurements or validated operational predictions.
        </p>
      </div>
    </section>
  );
}
