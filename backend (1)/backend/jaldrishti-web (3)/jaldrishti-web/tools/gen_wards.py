"""
Generates a SCHEMATIC ward lattice for the JalDrishti frontend prototype.

This is deliberately NOT official BBMP/GBA ward geometry. The paper's Phase 2
audit (Table 3) found no usable public ward/DMA operational series, so the
prototype ships clearly-labelled synthetic geometry and synthetic indicators.

Output: TypeScript module with GeoJSON-shaped ward features in WGS84, so the
file can later be swapped for real BBMP GeoJSON without touching the UI.
"""
import json
import math

import numpy as np
from scipy.spatial import Voronoi

SEED = 20300322
N_WARDS = 36

# Rough Bengaluru urban centroid; the lattice is star-shaped about this point.
CX, CY = 77.5946, 12.9716
RX, RY = 0.145, 0.135  # degrees, ~15.7 km x ~15.0 km radius

rng = np.random.default_rng(SEED)


def city_boundary(n=220):
    """Star-shaped blob about (CX, CY): smooth radial noise, guaranteed
    star-shaped so convex-cell intersections stay connected."""
    theta = np.linspace(0, 2 * math.pi, n, endpoint=False)
    r = np.ones(n)
    for k, amp in ((2, 0.085), (3, 0.055), (5, 0.035), (7, 0.022)):
        r += amp * np.sin(k * theta + rng.uniform(0, 2 * math.pi))
    r = np.clip(r, 0.72, 1.28)
    return np.column_stack([CX + RX * r * np.cos(theta), CY + RY * r * np.sin(theta)])


BOUNDARY = city_boundary()


def point_in_poly(pt, poly):
    x, y = pt
    inside = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > y) != (yj > y):
            if x < (xj - xi) * (y - yi) / (yj - yi + 1e-18) + xi:
                inside = not inside
        j = i
    return inside


def sutherland_hodgman(subject, clipper):
    """Clip concave `subject` against CONVEX `clipper` (CCW)."""
    out = [tuple(p) for p in subject]
    m = len(clipper)
    for i in range(m):
        a, b = clipper[i], clipper[(i + 1) % m]
        ex, ey = b[0] - a[0], b[1] - a[1]

        def inside(p):
            return ex * (p[1] - a[1]) - ey * (p[0] - a[0]) >= -1e-15

        def isect(p, q):
            dx, dy = q[0] - p[0], q[1] - p[1]
            den = ex * dy - ey * dx
            if abs(den) < 1e-18:
                return q
            t = (ex * (p[1] - a[1]) - ey * (p[0] - a[0])) / den
            return (p[0] - dx * t, p[1] - dy * t)

        inp, out = out, []
        if not inp:
            return []
        prev = inp[-1]
        for cur in inp:
            if inside(cur):
                if not inside(prev):
                    out.append(isect(prev, cur))
                out.append(cur)
            elif inside(prev):
                out.append(isect(prev, cur))
            prev = cur
    return out


def poly_area_centroid(poly):
    """Shoelace area (deg^2) and centroid."""
    a = cx = cy = 0.0
    n = len(poly)
    for i in range(n):
        x0, y0 = poly[i]
        x1, y1 = poly[(i + 1) % n]
        cr = x0 * y1 - x1 * y0
        a += cr
        cx += (x0 + x1) * cr
        cy += (y0 + y1) * cr
    a *= 0.5
    if abs(a) < 1e-15:
        return 0.0, poly[0]
    return a, (cx / (6 * a), cy / (6 * a))


def deg2_to_km2(area_deg2, lat):
    kx = 111.320 * math.cos(math.radians(lat))
    return abs(area_deg2) * kx * 110.574


# ---- Lloyd-relaxed seeds inside the boundary -------------------------------
def sample_seeds(n):
    pts = []
    while len(pts) < n:
        p = (rng.uniform(CX - RX * 1.3, CX + RX * 1.3),
             rng.uniform(CY - RY * 1.3, CY + RY * 1.3))
        if point_in_poly(p, BOUNDARY):
            pts.append(p)
    return np.array(pts)


def voronoi_cells(seeds):
    """Voronoi with far-away mirror points so all real cells are bounded."""
    far = np.array([[CX, CY + 40], [CX, CY - 40], [CX + 40, CY], [CX - 40, CY]])
    vor = Voronoi(np.vstack([seeds, far]))
    cells = []
    for i in range(len(seeds)):
        region = vor.regions[vor.point_region[i]]
        if not region or -1 in region:
            cells.append(None)
            continue
        pts = vor.vertices[region]
        # Sutherland-Hodgman needs the clipper in consistent CCW order.
        c = pts.mean(axis=0)
        ang = np.arctan2(pts[:, 1] - c[1], pts[:, 0] - c[0])
        cells.append(pts[np.argsort(ang)])
    return cells


seeds = sample_seeds(N_WARDS)
for _ in range(14):  # Lloyd relaxation -> even, organic ward sizes
    new = []
    for i, cell in enumerate(voronoi_cells(seeds)):
        if cell is None:
            new.append(seeds[i])
            continue
        clipped = sutherland_hodgman(BOUNDARY, cell)
        if len(clipped) < 3:
            new.append(seeds[i])
            continue
        _, c = poly_area_centroid(clipped)
        new.append(c)
    seeds = np.array(new)

wards = []
for i, cell in enumerate(voronoi_cells(seeds)):
    clipped = sutherland_hodgman(BOUNDARY, cell)
    if len(clipped) < 3:
        continue
    area_deg2, centroid = poly_area_centroid(clipped)
    wards.append({
        "ring": [[round(x, 5), round(y, 5)] for x, y in clipped],
        "centroid": [round(centroid[0], 5), round(centroid[1], 5)],
        "area_km2": round(deg2_to_km2(area_deg2, centroid[1]), 2),
    })

# Order wards north -> south so codes read sensibly on the map.
wards.sort(key=lambda w: (-w["centroid"][1], w["centroid"][0]))


def zone_of(cx, cy):
    dx, dy = (cx - CX) / RX, (cy - CY) / RY
    if math.hypot(dx, dy) < 0.42:
        return "Central"
    ang = math.degrees(math.atan2(dy, dx))
    if -45 <= ang < 45:
        return "East"
    if 45 <= ang < 135:
        return "North"
    if ang >= 135 or ang < -135:
        return "West"
    return "South"


# ---- Seeded synthetic indicators ------------------------------------------
# Spatial prior only: the paper's ref [1] reports deeper projected groundwater
# decline toward the periphery. Used here as the SHAPE of synthetic data.
# These are not measurements and are labelled synthetic throughout the UI.
features = []
for i, w in enumerate(wards):
    cx, cy = w["centroid"]
    radial = min(1.0, math.hypot((cx - CX) / RX, (cy - CY) / RY))
    jitter = rng.normal(0, 0.11)

    gw_depletion = float(np.clip(0.22 + 0.62 * radial + jitter, 0.02, 0.99))
    supply_reliability = float(np.clip(0.88 - 0.55 * radial - jitter * 0.8, 0.05, 0.99))
    nrw = float(np.clip(0.28 + 0.34 * radial + rng.normal(0, 0.09), 0.05, 0.95))
    demand_pressure = float(np.clip(0.30 + 0.45 * radial + rng.normal(0, 0.13), 0.05, 0.99))
    rainfall_deficit = float(np.clip(0.34 + rng.normal(0, 0.06), 0.05, 0.85))
    tanker_dependence = float(np.clip(0.12 + 0.68 * radial + rng.normal(0, 0.1), 0.02, 0.99))

    population = int(rng.integers(22_000, 78_000))
    connections = int(population * rng.uniform(0.16, 0.26))

    features.append({
        "id": f"W{i + 1:02d}",
        "code": f"BLR-W{i + 1:02d}",
        "zone": zone_of(cx, cy),
        "areaKm2": w["area_km2"],
        "population": population,
        "connections": connections,
        "centroid": w["centroid"],
        "ring": w["ring"],
        "indicators": {
            "groundwaterDepletion": round(gw_depletion, 4),
            "supplyReliability": round(supply_reliability, 4),
            "nonRevenueWater": round(nrw, 4),
            "demandPressure": round(demand_pressure, 4),
            "rainfallDeficit": round(rainfall_deficit, 4),
            "tankerDependence": round(tanker_dependence, 4),
        },
    })

# A subset flagged as groundwater-critical: stands in for the categorical
# ward list the paper grades D (evidence of vulnerability, not measurement).
crit = sorted(features, key=lambda f: -f["indicators"]["groundwaterDepletion"])
critical_ids = {f["id"] for f in crit[:11]}
for f in features:
    f["notifiedCritical"] = f["id"] in critical_ids

out = {
    "seed": SEED,
    "generator": "gen_wards.py",
    "generatorVersion": "1.0.0",
    "wardCount": len(features),
    "boundary": [[round(x, 5), round(y, 5)] for x, y in BOUNDARY],
    "wards": features,
}
print(json.dumps(out))
