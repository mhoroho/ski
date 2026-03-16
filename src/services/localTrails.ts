import type { Trail, TrailSection, TrailSegment, TrailPoint } from '../types';
import { slopeAngle, haversineDistance } from '../utils/geo';

interface RawLocalTrail {
  name: string;
  difficulty: string;
  coordinates: number[][] | number[][][]; // LineString or MultiLineString
}

interface LocalTrailFile {
  name: string;
  trails: RawLocalTrail[];
}

const MAX_SEGMENT_LENGTH = 30;

function subdivideSegment(start: TrailPoint, end: TrailPoint, angle: number): TrailSegment[] {
  const dist = haversineDistance(start.lat, start.lng, end.lat, end.lng);
  const numSubs = Math.max(1, Math.ceil(dist / MAX_SEGMENT_LENGTH));
  if (numSubs === 1) return [{ start, end, slopeAngle: angle }];

  const segments: TrailSegment[] = [];
  for (let j = 0; j < numSubs; j++) {
    const t0 = j / numSubs;
    const t1 = (j + 1) / numSubs;
    segments.push({
      start: {
        lat: start.lat + t0 * (end.lat - start.lat),
        lng: start.lng + t0 * (end.lng - start.lng),
        elevation: start.elevation + t0 * (end.elevation - start.elevation),
      },
      end: {
        lat: start.lat + t1 * (end.lat - start.lat),
        lng: start.lng + t1 * (end.lng - start.lng),
        elevation: start.elevation + t1 * (end.elevation - start.elevation),
      },
      slopeAngle: angle,
    });
  }
  return segments;
}

function processCoordinates(coords: number[][]): TrailSection {
  if (coords.length < 2) return [];

  const points: TrailPoint[] = coords.map((c) => ({
    lat: c[1],
    lng: c[0],
    elevation: c[2] ?? 0,
  }));

  // Pre-compute all angles
  const angles: (number | null)[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    angles.push(slopeAngle(
      points[i].lat, points[i].lng, points[i].elevation,
      points[i + 1].lat, points[i + 1].lng, points[i + 1].elevation
    ));
  }

  // Find first valid angle to use as default for leading null segments
  const firstValid = angles.find((a) => a !== null) ?? 0;

  const segments: TrailSegment[] = [];
  let lastAngle = firstValid;
  for (let i = 0; i < points.length - 1; i++) {
    const segAngle = angles[i] !== null ? angles[i]! : lastAngle;
    if (angles[i] !== null) lastAngle = angles[i]!;
    segments.push(...subdivideSegment(points[i], points[i + 1], segAngle));
  }

  return segments;
}

/** Find the steepest average slope over any ~100m continuous window */
function computePeakSlope(sections: TrailSection[]): number {
  const WINDOW = 100; // meters
  let peak = 0;

  for (const section of sections) {
    if (section.length === 0) continue;

    // Build cumulative distance array for this section
    const dists: number[] = [0];
    for (let i = 0; i < section.length; i++) {
      const seg = section[i];
      const d = haversineDistance(seg.start.lat, seg.start.lng, seg.end.lat, seg.end.lng);
      dists.push(dists[dists.length - 1] + d);
    }

    // Sliding window: find the window with highest weighted-average slope
    let left = 0;
    for (let right = 0; right < section.length; right++) {
      while (dists[right + 1] - dists[left] > WINDOW && left < right) {
        left++;
      }
      const windowDist = dists[right + 1] - dists[left];
      if (windowDist < 20) continue; // skip tiny windows

      // Distance-weighted average of slopes in window
      let weightedSum = 0;
      for (let i = left; i <= right; i++) {
        const segDist = dists[i + 1] - dists[i];
        weightedSum += section[i].slopeAngle * segDist;
      }
      const avg = weightedSum / windowDist;
      if (avg > peak) peak = avg;
    }
  }

  return peak;
}

export interface LocalTrailResult {
  trails: Trail[];
  bbox: [number, number, number, number]; // [south, west, north, east] computed from trail coords
}

/** Check if a coordinate line is near the mountain center (within ~50km) */
function isNearMountain(line: number[][], centerLat: number, centerLng: number): boolean {
  const MAX_DIST = 0.5; // ~50km in degrees
  for (const c of line) {
    if (Math.abs(c[1] - centerLat) > MAX_DIST || Math.abs(c[0] - centerLng) > MAX_DIST) {
      return false;
    }
  }
  return true;
}

/** Load trails from a local JSON file and process into Trail objects */
export async function loadLocalTrails(
  slug: string,
  centerLat: number,
  centerLng: number,
): Promise<LocalTrailResult> {
  const response = await fetch(`/trails/${slug}.json`);
  if (!response.ok) {
    throw new Error(`Trail data not found for ${slug}`);
  }

  const file: LocalTrailFile = await response.json();

  // Group same-named trails together (OpenSkiMap may split them into multiple features)
  const groups = new Map<string, { difficulty: string; coordSets: number[][][] }>();
  let unnamedCounter = 0;

  // Track actual bounds from all coordinates
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

  for (const raw of file.trails) {
    const isUnnamed = !raw.name || raw.name === 'Unnamed';
    const key = isUnnamed ? `__unnamed_${unnamedCounter++}` : raw.name;

    // Normalize: MultiLineString coords are number[][][] while LineString is number[][]
    const isMulti = raw.coordinates.length > 0 && Array.isArray(raw.coordinates[0][0]);
    const lineStrings: number[][][] = isMulti
      ? (raw.coordinates as number[][][])
      : [raw.coordinates as number[][]];

    // Filter out lines with coordinates far from the mountain (bad data)
    const validLines = lineStrings.filter((line) => isNearMountain(line, centerLat, centerLng));
    if (validLines.length === 0) continue;

    for (const line of validLines) {
      for (const c of line) {
        const lng = c[0], lat = c[1];
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
      }
    }

    const existing = groups.get(key);
    if (existing) {
      existing.coordSets.push(...validLines);
    } else {
      groups.set(key, {
        difficulty: raw.difficulty,
        coordSets: [...validLines],
      });
    }
  }

  // Add a small padding around the trail bounds
  const latPad = (maxLat - minLat) * 0.1;
  const lngPad = (maxLng - minLng) * 0.1;
  const bbox: [number, number, number, number] = [
    minLat - latPad, minLng - lngPad,
    maxLat + latPad, maxLng + lngPad,
  ];

  const trails: Trail[] = [];
  for (const [key, group] of groups) {
    const sections: TrailSection[] = group.coordSets
      .map((coords) => processCoordinates(coords))
      .filter((s) => s.length > 0);

    const allSlopes = sections.flatMap((s) => s.map((seg) => seg.slopeAngle));
    const avgSlope = allSlopes.length > 0
      ? allSlopes.reduce((a, b) => a + b, 0) / allSlopes.length
      : 0;
    const maxSlope = allSlopes.length > 0 ? Math.max(...allSlopes) : 0;

    const peakSlope = computePeakSlope(sections);

    trails.push({
      name: key.startsWith('__unnamed_') ? 'Unnamed Trail' : key,
      difficulty: group.difficulty,
      sections,
      avgSlope,
      maxSlope,
      peakSlope,
    });
  }

  return { trails, bbox };
}
