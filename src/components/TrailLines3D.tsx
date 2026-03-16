import { useMemo } from 'react';
import * as THREE from 'three';
import type { Trail, TrailSegment } from '../types';
import type { TerrainGrid } from '../services/terrain';
import { slopeToColor } from '../utils/color';

interface Props {
  trails: Trail[];
  terrain: TerrainGrid;
  verticalExaggeration?: number;
}

function latLngTo3D(
  lat: number, lng: number, elevation: number,
  terrain: TerrainGrid, vExag: number
): THREE.Vector3 {
  const { bounds, minElev, maxElev } = terrain;
  const elevRange = maxElev - minElev || 1;
  const x = ((lng - bounds.west) / (bounds.east - bounds.west) - 0.5) * 10;
  const z = (0.5 - (lat - bounds.south) / (bounds.north - bounds.south)) * 10;
  const normalizedElev = (elevation - minElev) / elevRange;
  const y = normalizedElev * vExag * 2 + 0.02;
  return new THREE.Vector3(x, y, z);
}

function parseColor(seg: TrailSegment): [number, number, number] {
  const colorStr = slopeToColor(seg.slopeAngle);
  const match = colorStr.match(/rgb\((\d+),(\d+),(\d+)\)/);
  return match
    ? [parseInt(match[1]) / 255, parseInt(match[2]) / 255, parseInt(match[3]) / 255]
    : [1, 1, 1];
}

export function TrailLines3D({ trails, terrain, verticalExaggeration = 1.8 }: Props) {
  const trailMeshes = useMemo(() => {
    const meshes: { geometry: THREE.BufferGeometry }[] = [];

    for (const trail of trails) {
      for (const section of trail.sections) {
        if (section.length === 0) continue;

        const points: THREE.Vector3[] = [];
        const colors: number[] = [];

        for (const seg of section) {
          const p1 = latLngTo3D(seg.start.lat, seg.start.lng, seg.start.elevation, terrain, verticalExaggeration);
          const p2 = latLngTo3D(seg.end.lat, seg.end.lng, seg.end.elevation, terrain, verticalExaggeration);
          points.push(p1, p2);
          const [r, g, b] = parseColor(seg);
          colors.push(r, g, b, r, g, b);
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        meshes.push({ geometry });
      }
    }

    return meshes;
  }, [trails, terrain, verticalExaggeration]);

  return (
    <>
      {trailMeshes.map((mesh, i) => (
        <lineSegments key={i} geometry={mesh.geometry}>
          <lineBasicMaterial vertexColors linewidth={2} />
        </lineSegments>
      ))}
    </>
  );
}
