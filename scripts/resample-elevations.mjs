// Re-sample trail elevations using USGS 10m NED data via Open Topo Data API
// Replaces the OpenSkiMap DEM elevations with higher-resolution data
// Usage: node resample-elevations.mjs [slug]  (or no arg for all resorts)

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const TRAILS_DIR = join(import.meta.dirname, '..', 'public', 'trails');
const API_URL = 'https://api.opentopodata.org/v1/ned10m';
const BATCH_SIZE = 100;   // max points per request
const RATE_MS = 1100;     // 1 req/sec rate limit

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchElevations(points) {
  const locations = points.map(p => `${p.lat},${p.lng}`).join('|');
  const url = `${API_URL}?locations=${locations}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  if (data.status !== 'OK') {
    throw new Error(`API status: ${data.status} - ${data.error || ''}`);
  }
  return data.results.map(r => r.elevation);
}

async function processResort(slug) {
  const filePath = join(TRAILS_DIR, `${slug}.json`);
  const resort = JSON.parse(readFileSync(filePath, 'utf8'));

  // Collect all unique points across all trails
  const pointMap = new Map(); // "lat,lng" -> { lat, lng, indices: [{trailIdx, coordIdx, lineIdx?}] }

  for (let ti = 0; ti < resort.trails.length; ti++) {
    const trail = resort.trails[ti];
    const isMulti = trail.coordinates.length > 0 && Array.isArray(trail.coordinates[0][0]);

    if (isMulti) {
      for (let li = 0; li < trail.coordinates.length; li++) {
        const line = trail.coordinates[li];
        for (let ci = 0; ci < line.length; ci++) {
          const [lng, lat] = line[ci];
          const key = `${lat.toFixed(7)},${lng.toFixed(7)}`;
          if (!pointMap.has(key)) {
            pointMap.set(key, { lat, lng, refs: [] });
          }
          pointMap.get(key).refs.push({ ti, li, ci, multi: true });
        }
      }
    } else {
      for (let ci = 0; ci < trail.coordinates.length; ci++) {
        const [lng, lat] = trail.coordinates[ci];
        const key = `${lat.toFixed(7)},${lng.toFixed(7)}`;
        if (!pointMap.has(key)) {
          pointMap.set(key, { lat, lng, refs: [] });
        }
        pointMap.get(key).refs.push({ ti, ci, multi: false });
      }
    }
  }

  const allPoints = [...pointMap.values()];
  const totalBatches = Math.ceil(allPoints.length / BATCH_SIZE);
  console.log(`  ${allPoints.length} unique points, ${totalBatches} batches`);

  // Fetch elevations in batches
  let updated = 0;
  let failed = 0;

  for (let batch = 0; batch < totalBatches; batch++) {
    const start = batch * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, allPoints.length);
    const batchPoints = allPoints.slice(start, end);

    try {
      const elevations = await fetchElevations(batchPoints);

      for (let i = 0; i < batchPoints.length; i++) {
        const elev = elevations[i];
        if (elev === null || elev === undefined) {
          failed++;
          continue;
        }
        const point = batchPoints[i];
        for (const ref of point.refs) {
          if (ref.multi) {
            resort.trails[ref.ti].coordinates[ref.li][ref.ci][2] = elev;
          } else {
            resort.trails[ref.ti].coordinates[ref.ci][2] = elev;
          }
          updated++;
        }
      }
    } catch (err) {
      console.error(`  Batch ${batch + 1}/${totalBatches} failed: ${err.message}`);
      failed += batchPoints.length;
    }

    process.stderr.write(`\r  Batch ${batch + 1}/${totalBatches} (${failed} failed)`);

    if (batch < totalBatches - 1) {
      await sleep(RATE_MS);
    }
  }

  console.log(`\n  Updated ${updated} coordinate refs, ${failed} failed`);

  // Write back
  writeFileSync(filePath, JSON.stringify(resort, null, 0));
  console.log(`  Saved ${filePath}`);
}

// Main
const targetSlug = process.argv[2];

if (targetSlug) {
  console.log(`Processing ${targetSlug}...`);
  await processResort(targetSlug);
} else {
  const files = readdirSync(TRAILS_DIR).filter(f => f.endsWith('.json'));
  console.log(`Processing ${files.length} resorts...`);

  for (const file of files) {
    const slug = file.replace('.json', '');
    console.log(`\n${slug}:`);
    try {
      await processResort(slug);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
  }
}

console.log('\nDone.');
