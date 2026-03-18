// Compute the max peak slope for each mountain using the EXACT same logic
// as localTrails.ts + geo.ts in the app.

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const TRAILS_DIR = join(import.meta.dirname, '..', 'public', 'trails');

// --- Replicate geo.ts ---
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function slopeAngle(lat1, lng1, elev1, lat2, lng2, elev2) {
  const horizontalDist = haversineDistance(lat1, lng1, lat2, lng2);
  if (horizontalDist < 10) return null; // same 10m minimum as app
  const elevChange = Math.abs(elev2 - elev1);
  const angle = Math.atan2(elevChange, horizontalDist) * (180 / Math.PI);
  return Math.min(angle, 45); // same 45° cap as app
}

// --- Replicate localTrails.ts ---
const MAX_SEGMENT_LENGTH = 30;

function subdivideSegment(start, end, angle) {
  const dist = haversineDistance(start.lat, start.lng, end.lat, end.lng);
  const numSubs = Math.max(1, Math.ceil(dist / MAX_SEGMENT_LENGTH));
  if (numSubs === 1) return [{ start, end, slopeAngle: angle }];
  const segments = [];
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

function processCoordinates(coords) {
  if (coords.length < 2) return [];
  const points = coords.map(c => ({ lat: c[1], lng: c[0], elevation: c[2] ?? 0 }));
  const angles = [];
  for (let i = 0; i < points.length - 1; i++) {
    angles.push(slopeAngle(
      points[i].lat, points[i].lng, points[i].elevation,
      points[i + 1].lat, points[i + 1].lng, points[i + 1].elevation
    ));
  }
  const firstValid = angles.find(a => a !== null) ?? 0;
  const segments = [];
  let lastAngle = firstValid;
  for (let i = 0; i < points.length - 1; i++) {
    const segAngle = angles[i] !== null ? angles[i] : lastAngle;
    if (angles[i] !== null) lastAngle = angles[i];
    segments.push(...subdivideSegment(points[i], points[i + 1], segAngle));
  }
  return segments;
}

function computePeakSlope(sections) {
  const WINDOW = 100;
  let peak = 0;
  for (const section of sections) {
    if (section.length === 0) continue;
    const dists = [0];
    for (let i = 0; i < section.length; i++) {
      const seg = section[i];
      const d = haversineDistance(seg.start.lat, seg.start.lng, seg.end.lat, seg.end.lng);
      dists.push(dists[dists.length - 1] + d);
    }
    let left = 0;
    for (let right = 0; right < section.length; right++) {
      while (dists[right + 1] - dists[left] > WINDOW && left < right) left++;
      const windowDist = dists[right + 1] - dists[left];
      if (windowDist < 20) continue;
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

// --- Replicate the grouping + isNearMountain logic ---
// We need mountain center coords to filter. Import from mountains data.
const mountainsFile = readFileSync(join(import.meta.dirname, '..', 'src', 'data', 'mountains.ts'), 'utf8');
const mountainCenters = {};
const re = /name:\s*"([^"]+)".*?lat:\s*([\d.-]+).*?lng:\s*([\d.-]+).*?slug:\s*"([^"]+)"/g;
let match;
while ((match = re.exec(mountainsFile)) !== null) {
  mountainCenters[match[4]] = { lat: parseFloat(match[2]), lng: parseFloat(match[3]) };
}

function isNearMountain(line, centerLat, centerLng) {
  const MAX_DIST = 0.5;
  for (const c of line) {
    if (Math.abs(c[1] - centerLat) > MAX_DIST || Math.abs(c[0] - centerLng) > MAX_DIST) return false;
  }
  return true;
}

// --- Main ---
const results = {};
const files = readdirSync(TRAILS_DIR).filter(f => f.endsWith('.json'));

for (const file of files) {
  const slug = file.replace('.json', '');
  const data = JSON.parse(readFileSync(join(TRAILS_DIR, file), 'utf8'));
  const center = mountainCenters[slug];

  // Group same-named trails (same as app)
  const groups = new Map();
  let unnamedCounter = 0;

  for (const raw of data.trails) {
    const isUnnamed = !raw.name || raw.name === 'Unnamed';
    const key = isUnnamed ? `__unnamed_${unnamedCounter++}` : raw.name;
    const isMulti = raw.coordinates.length > 0 && Array.isArray(raw.coordinates[0]?.[0]);
    const lineStrings = isMulti ? raw.coordinates : [raw.coordinates];
    const validLines = center
      ? lineStrings.filter(line => isNearMountain(line, center.lat, center.lng))
      : lineStrings;
    if (validLines.length === 0) continue;
    const existing = groups.get(key);
    if (existing) {
      existing.push(...validLines);
    } else {
      groups.set(key, [...validLines]);
    }
  }

  // Process each trail group and find max peakSlope
  let mountainPeak = 0;
  for (const [, coordSets] of groups) {
    const sections = coordSets.map(coords => processCoordinates(coords)).filter(s => s.length > 0);
    const pk = computePeakSlope(sections);
    if (pk > mountainPeak) mountainPeak = pk;
  }

  results[slug] = Math.round(mountainPeak * 10) / 10;
  console.log(`${slug}: ${results[slug]}°`);
}

writeFileSync(join(import.meta.dirname, 'peak-slopes.json'), JSON.stringify(results, null, 2));
console.log('\nSaved peak-slopes.json');
