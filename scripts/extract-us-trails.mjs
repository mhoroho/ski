// Extract trails for US ski resorts from the OpenSkiMap runs.geojson
// Outputs one JSON file per resort into public/trails/

import { createReadStream, mkdirSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';

const OUTPUT_DIR = '../public/trails';
mkdirSync(OUTPUT_DIR, { recursive: true });

// Our target ski areas — match by name in the skiAreas property
const TARGET_AREAS = [
  "Vail", "Breckenridge", "Keystone", "Copper Mountain", "Arapahoe Basin",
  "Aspen Mountain", "Aspen Highlands", "Snowmass", "Telluride Ski Area",
  "Steamboat", "Winter Park", "Beaver Creek", "Crested Butte Mountain Resort",
  "Purgatory Resort", "Park City", "Snowbird", "Alta Ski Area", "Brighton Resort",
  "Solitude Mountain Resort", "Deer Valley Resort", "Palisades Tahoe",
  "Mammoth Mountain", "Heavenly Mountain Resort", "Kirkwood Mountain Resort",
  "Northstar California", "Big Sky Resort", "Whitefish Mountain Resort",
  "Jackson Hole Mountain Resort", "Sun Valley", "Taos Ski Valley",
  "Stowe Mountain Resort", "Killington", "Sugarbush Resort", "Jay Peak Resort",
  "Mad River Glen", "Cannon Mountain", "Wildcat Mountain", "Loon Mountain Resort",
  "Sugarloaf", "Sunday River", "Whiteface Mountain", "Gore Mountain",
  "Hunter Mountain", "Crystal Mountain", "Stevens Pass", "Mt. Bachelor",
  "Mt. Hood Meadows", "Alyeska Resort", "Boyne Mountain Resort", "Snowshoe Mountain"
];

// Normalize for matching
function normalize(name) {
  return name.toLowerCase()
    .replace(/\s+(ski\s+)?(resort|area|mountain|ski area|mountain resort)/gi, '')
    .trim();
}

const targetSet = new Set(TARGET_AREAS.map(normalize));

// Also try partial matching for flexibility
function matchesTarget(skiAreaName) {
  const norm = normalize(skiAreaName);
  if (targetSet.has(norm)) return skiAreaName;
  // Try partial match
  for (const target of TARGET_AREAS) {
    const tn = normalize(target);
    if (norm.includes(tn) || tn.includes(norm)) return target;
  }
  return null;
}

// Stream-parse the file line by line since it's 878MB
// The file is one big FeatureCollection. We'll parse feature-by-feature.
console.log('Reading runs.geojson...');

const results = new Map(); // skiAreaName -> trails[]

// Read the whole file in chunks and extract features
const stream = createReadStream('runs.geojson', { encoding: 'utf8' });
let buffer = '';
let featureCount = 0;
let matchCount = 0;

stream.on('data', (chunk) => {
  buffer += chunk;

  // Find complete features by looking for },\n{ patterns
  let startIdx = 0;
  while (true) {
    // Find start of a feature
    const featureStart = buffer.indexOf('{"type":"Feature"', startIdx);
    if (featureStart === -1) break;

    // Find the end - look for the start of next feature or end of array
    let nextFeature = buffer.indexOf('\n{"type":"Feature"', featureStart + 1);
    let endOfArray = buffer.indexOf('\n]}', featureStart + 1);

    let featureEnd;
    if (nextFeature !== -1 && (endOfArray === -1 || nextFeature < endOfArray)) {
      // There's a comma and newline before the next feature
      featureEnd = nextFeature;
    } else if (endOfArray !== -1) {
      featureEnd = endOfArray;
    } else {
      // Feature not complete yet, keep in buffer
      buffer = buffer.substring(featureStart);
      break;
    }

    let featureStr = buffer.substring(featureStart, featureEnd).trim();
    if (featureStr.endsWith(',')) featureStr = featureStr.slice(0, -1);

    try {
      const feature = JSON.parse(featureStr);
      featureCount++;

      if (featureCount % 10000 === 0) {
        process.stderr.write(`\rProcessed ${featureCount} features, matched ${matchCount}...`);
      }

      // Check if this is a US downhill run
      const props = feature.properties || {};
      const uses = props.uses || [];
      if (!uses.includes('downhill')) {
        startIdx = featureEnd;
        continue;
      }

      // Check if it belongs to one of our target ski areas
      const skiAreas = props.skiAreas || [];
      let matchedArea = null;
      for (const sa of skiAreas) {
        const saName = sa?.properties?.name;
        if (saName) {
          matchedArea = matchesTarget(saName);
          if (matchedArea) break;
        }
      }

      if (!matchedArea) {
        startIdx = featureEnd;
        continue;
      }

      matchCount++;

      // Extract just what we need
      const trail = {
        name: props.name || 'Unnamed',
        difficulty: props.difficulty || 'unknown',
        coordinates: feature.geometry?.coordinates || [], // [lng, lat, elev]
      };

      if (!results.has(matchedArea)) results.set(matchedArea, []);
      results.get(matchedArea).push(trail);

    } catch (e) {
      // Parse error, skip this feature
    }

    startIdx = featureEnd;
  }

  if (startIdx > 0) {
    buffer = buffer.substring(startIdx);
  }
  // Prevent buffer from growing too large
  if (buffer.length > 50 * 1024 * 1024) {
    buffer = buffer.substring(buffer.length - 10 * 1024 * 1024);
  }
});

stream.on('end', () => {
  console.log(`\nDone. Processed ${featureCount} features, matched ${matchCount} trails.`);

  // Write per-resort files
  for (const [areaName, trails] of results) {
    const slug = areaName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    const outPath = `${OUTPUT_DIR}/${slug}.json`;
    writeFileSync(outPath, JSON.stringify({ name: areaName, trails }, null, 0));
    console.log(`  ${areaName}: ${trails.length} trails -> ${outPath}`);
  }
});
