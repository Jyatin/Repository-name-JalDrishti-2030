/**
 * Equirectangular projection from WGS84 to SVG coordinates.
 *
 * Adequate at city scale and dependency-free. If the map ever needs real tiles
 * or a different projection, this is the only file that has to change.
 */

export interface Projection {
  project: (lon: number, lat: number) => [number, number];
  width: number;
  height: number;
}

export function makeProjection(
  ring: [number, number][],
  width: number,
  height: number,
  padding = 16,
): Projection {
  const lons = ring.map((p) => p[0]);
  const lats = ring.map((p) => p[1]);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  // Correct for longitude convergence at this latitude so wards aren't stretched.
  const midLat = (minLat + maxLat) / 2;
  const kx = Math.cos((midLat * Math.PI) / 180);

  const spanX = (maxLon - minLon) * kx;
  const spanY = maxLat - minLat;

  const inner = { w: width - padding * 2, h: height - padding * 2 };
  const scale = Math.min(inner.w / spanX, inner.h / spanY);

  const offsetX = padding + (inner.w - spanX * scale) / 2;
  const offsetY = padding + (inner.h - spanY * scale) / 2;

  return {
    width,
    height,
    project(lon, lat) {
      const x = offsetX + (lon - minLon) * kx * scale;
      // SVG y grows downward, latitude grows upward.
      const y = offsetY + (maxLat - lat) * scale;
      return [x, y];
    },
  };
}

export function ringToPath(
  ring: [number, number][],
  projection: Projection,
): string {
  if (ring.length === 0) return "";
  const pts = ring.map(([lon, lat]) => projection.project(lon, lat));
  const head = pts[0];
  const rest = pts.slice(1).map(([x, y]) => `L${x.toFixed(2)} ${y.toFixed(2)}`);
  return `M${head[0].toFixed(2)} ${head[1].toFixed(2)}${rest.join("")}Z`;
}

/** Axis-aligned bounds of a projected ring, for the selection marquee. */
export function ringBounds(
  ring: [number, number][],
  projection: Projection,
): { x: number; y: number; w: number; h: number } {
  const pts = ring.map(([lon, lat]) => projection.project(lon, lat));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}
