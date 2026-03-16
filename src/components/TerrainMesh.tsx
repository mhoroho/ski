import { useMemo } from 'react';
import * as THREE from 'three';
import type { TerrainGrid } from '../services/terrain';

interface Props {
  terrain: TerrainGrid;
  verticalExaggeration?: number;
}

/** Niehues-inspired color for a given elevation + slope.
 *  Snow on high/steep, evergreen forest on mid-elevation,
 *  meadow/rock on exposed terrain. */
function terrainColor(
  elevation: number,
  normalizedElev: number,  // 0-1 within mountain range
  slopeAngle: number,      // degrees
): [number, number, number] {
  // Snow: high elevation or very steep (exposed rock gets snow)
  // Treeline roughly at 70% of the elevation range
  const treeline = 0.65;
  const snowline = 0.82;

  if (normalizedElev > snowline) {
    // Above snowline: bright white snow with slight blue tint in shadows
    const snowBright = 0.92 + 0.08 * (1 - slopeAngle / 45);
    return [snowBright, snowBright, snowBright * 0.98];
  }

  if (normalizedElev > treeline) {
    // Alpine zone: mix of rock, tundra, and snow patches
    const rockMix = slopeAngle / 40;
    const snowPatch = Math.max(0, normalizedElev - 0.75) * 8;
    const r = 0.45 + rockMix * 0.15 + snowPatch * 0.4;
    const g = 0.42 + rockMix * 0.08 + snowPatch * 0.4;
    const b = 0.38 + rockMix * 0.1 + snowPatch * 0.42;
    return [Math.min(r, 0.95), Math.min(g, 0.95), Math.min(b, 0.97)];
  }

  // Forest zone: dark evergreens with variation
  // Steeper = more exposed rock/lighter trees
  // Niehues uses rich dark greens with subtle warm undertones
  const forestDepth = 1 - normalizedElev / treeline; // 0 at treeline, 1 at base
  const slopeFactor = Math.min(slopeAngle / 35, 1);

  // Base forest green — dark, rich, Niehues-style
  let r = 0.12 + forestDepth * 0.06 + slopeFactor * 0.08;
  let g = 0.22 + forestDepth * 0.1 + slopeFactor * 0.05;
  let b = 0.08 + forestDepth * 0.04 + slopeFactor * 0.06;

  // Add slight variation for natural look (pseudo-random from elevation)
  const noise = (Math.sin(elevation * 0.1) * 0.5 + 0.5) * 0.04;
  r += noise;
  g += noise * 0.7;

  // Cleared runs would be lighter (handled by trail overlay)
  return [r, g, b];
}

export function TerrainMesh({ terrain, verticalExaggeration = 1.8 }: Props) {
  const { geometry, colors } = useMemo(() => {
    const { width, height, elevations, minElev, maxElev } = terrain;
    const elevRange = maxElev - minElev || 1;

    // Create plane geometry
    const geo = new THREE.PlaneGeometry(10, 10, width - 1, height - 1);
    geo.rotateX(-Math.PI / 2); // lay flat

    const positions = geo.attributes.position;
    const colorArr = new Float32Array(positions.count * 3);

    // Set Y (height) from elevation data and compute colors
    for (let i = 0; i < positions.count; i++) {
      const col = i % width;
      const row = Math.floor(i / width);
      const elev = elevations[row * width + col];
      const normalizedElev = (elev - minElev) / elevRange;

      // Set height with vertical exaggeration
      positions.setY(i, normalizedElev * verticalExaggeration * 2);

      // Compute local slope from neighbors
      let slope = 0;
      if (col > 0 && col < width - 1 && row > 0 && row < height - 1) {
        const left = elevations[row * width + (col - 1)];
        const right = elevations[row * width + (col + 1)];
        const up = elevations[(row - 1) * width + col];
        const down = elevations[(row + 1) * width + col];
        const dx = (right - left) / 2;
        const dy = (down - up) / 2;
        slope = Math.atan(Math.sqrt(dx * dx + dy * dy) / 30) * (180 / Math.PI);
      }

      const [r, g, b] = terrainColor(elev, normalizedElev, slope);
      colorArr[i * 3] = r;
      colorArr[i * 3 + 1] = g;
      colorArr[i * 3 + 2] = b;
    }

    positions.needsUpdate = true;
    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));

    return { geometry: geo, colors: colorArr };
  }, [terrain, verticalExaggeration]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        side={THREE.DoubleSide}
        roughness={0.85}
        metalness={0.05}
      />
    </mesh>
  );
}
