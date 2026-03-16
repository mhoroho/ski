/** Fetch elevation grid from AWS Terrain Tiles (Terrarium encoding).
 *  Returns a 2D array of elevation values in meters covering the bbox. */

const TILE_SIZE = 256;

interface TerrainGrid {
  elevations: Float32Array; // row-major, width * height
  width: number;
  height: number;
  bounds: { south: number; west: number; north: number; east: number };
  minElev: number;
  maxElev: number;
}

/** Convert lat/lng to tile coordinates at a given zoom */
function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y };
}

/** Convert tile x,y back to lat/lng (NW corner of tile) */
function tileToLatLng(x: number, y: number, zoom: number): { lat: number; lng: number } {
  const n = Math.pow(2, zoom);
  const lng = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const lat = (latRad * 180) / Math.PI;
  return { lat, lng };
}

/** Decode Terrarium RGB to elevation in meters */
function terrariumDecode(r: number, g: number, b: number): number {
  return r * 256 + g + b / 256 - 32768;
}

/** Fetch a single terrain tile as ImageData */
async function fetchTileImageData(x: number, y: number, zoom: number): Promise<ImageData> {
  const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${zoom}/${x}/${y}.png`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Terrain tile fetch failed: ${response.status}`);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
}

/** Fetch a terrain elevation grid for a bounding box.
 *  Uses zoom 12 (~30m resolution) for good detail. */
export async function fetchTerrainGrid(
  bbox: [number, number, number, number],
  onProgress?: (msg: string) => void
): Promise<TerrainGrid> {
  const [south, west, north, east] = bbox;
  const zoom = 12;

  // Find tile range covering the bbox
  const nwTile = latLngToTile(north, west, zoom);
  const seTile = latLngToTile(south, east, zoom);

  const tileMinX = Math.min(nwTile.x, seTile.x);
  const tileMaxX = Math.max(nwTile.x, seTile.x);
  const tileMinY = Math.min(nwTile.y, seTile.y);
  const tileMaxY = Math.max(nwTile.y, seTile.y);

  const tilesWide = tileMaxX - tileMinX + 1;
  const tilesTall = tileMaxY - tileMinY + 1;

  onProgress?.(`Fetching ${tilesWide * tilesTall} terrain tiles...`);

  // Fetch all tiles in parallel
  const tilePromises: Promise<{ x: number; y: number; data: ImageData }>[] = [];
  for (let ty = tileMinY; ty <= tileMaxY; ty++) {
    for (let tx = tileMinX; tx <= tileMaxX; tx++) {
      tilePromises.push(
        fetchTileImageData(tx, ty, zoom).then((data) => ({ x: tx, y: ty, data }))
      );
    }
  }

  const tiles = await Promise.all(tilePromises);

  // Composite tiles into a single grid
  const fullWidth = tilesWide * TILE_SIZE;
  const fullHeight = tilesTall * TILE_SIZE;

  // Calculate the geographic bounds of the full tile grid
  const gridNW = tileToLatLng(tileMinX, tileMinY, zoom);
  const gridSE = tileToLatLng(tileMaxX + 1, tileMaxY + 1, zoom);

  const elevations = new Float32Array(fullWidth * fullHeight);
  let minElev = Infinity;
  let maxElev = -Infinity;

  for (const tile of tiles) {
    const offsetX = (tile.x - tileMinX) * TILE_SIZE;
    const offsetY = (tile.y - tileMinY) * TILE_SIZE;

    for (let py = 0; py < TILE_SIZE; py++) {
      for (let px = 0; px < TILE_SIZE; px++) {
        const srcIdx = (py * TILE_SIZE + px) * 4;
        const r = tile.data.data[srcIdx];
        const g = tile.data.data[srcIdx + 1];
        const b = tile.data.data[srcIdx + 2];
        const elev = terrariumDecode(r, g, b);

        const destIdx = (offsetY + py) * fullWidth + (offsetX + px);
        elevations[destIdx] = elev;

        if (elev < minElev) minElev = elev;
        if (elev > maxElev) maxElev = elev;
      }
    }
  }

  // Now crop to just the bbox portion
  // Map bbox coords to pixel coords in the full grid
  const pxWest = Math.floor(((west - gridNW.lng) / (gridSE.lng - gridNW.lng)) * fullWidth);
  const pxEast = Math.ceil(((east - gridNW.lng) / (gridSE.lng - gridNW.lng)) * fullWidth);
  const pxNorth = Math.floor(((gridNW.lat - north) / (gridNW.lat - gridSE.lat)) * fullHeight);
  const pxSouth = Math.ceil(((gridNW.lat - south) / (gridNW.lat - gridSE.lat)) * fullHeight);

  const cropW = Math.max(1, pxEast - pxWest);
  const cropH = Math.max(1, pxSouth - pxNorth);

  // Downsample to ~200x200 for reasonable mesh size
  const targetSize = 200;
  const stepX = Math.max(1, Math.floor(cropW / targetSize));
  const stepY = Math.max(1, Math.floor(cropH / targetSize));
  const outW = Math.ceil(cropW / stepX);
  const outH = Math.ceil(cropH / stepY);

  const croppedElevations = new Float32Array(outW * outH);
  let cropMin = Infinity;
  let cropMax = -Infinity;

  for (let oy = 0; oy < outH; oy++) {
    for (let ox = 0; ox < outW; ox++) {
      const srcX = Math.min(pxWest + ox * stepX, fullWidth - 1);
      const srcY = Math.min(pxNorth + oy * stepY, fullHeight - 1);
      const elev = elevations[srcY * fullWidth + srcX];
      croppedElevations[oy * outW + ox] = elev;
      if (elev < cropMin) cropMin = elev;
      if (elev > cropMax) cropMax = elev;
    }
  }

  return {
    elevations: croppedElevations,
    width: outW,
    height: outH,
    bounds: { south, west, north, east },
    minElev: cropMin,
    maxElev: cropMax,
  };
}

export type { TerrainGrid };
