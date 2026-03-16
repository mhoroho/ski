import { useState, useCallback } from 'react';
import type { Mountain, MountainData } from '../types';
import type { TerrainGrid } from '../services/terrain';
import { loadLocalTrails } from '../services/localTrails';
import { fetchTerrainGrid } from '../services/terrain';

const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

interface UseMountainTrailsResult {
  data: MountainData | null;
  terrain: TerrainGrid | null;
  loading: boolean;
  error: string | null;
  progress: string;
  loadMountain: (mountain: Mountain) => Promise<void>;
}

const CACHE_VERSION = 8; // filter outlier coordinates from bad OpenSkiMap data

function getCacheKey(mountain: Mountain): string {
  return `ski-steepness:v${CACHE_VERSION}:${mountain.name}-${mountain.state}`;
}

function loadFromCache(mountain: Mountain): MountainData | null {
  try {
    const key = getCacheKey(mountain);
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const parsed: MountainData = JSON.parse(cached);
    if (Date.now() - parsed.fetchedAt > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveToCache(data: MountainData): void {
  try {
    const key = getCacheKey(data.mountain);
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

export function useMountainTrails(): UseMountainTrailsResult {
  const [data, setData] = useState<MountainData | null>(null);
  const [terrain, setTerrain] = useState<TerrainGrid | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  const loadMountain = useCallback(async (mountain: Mountain) => {
    setLoading(true);
    setError(null);
    setData(null);
    setTerrain(null);

    try {
      // Load trail data first to get the actual bbox
      setProgress('Loading trail data...');
      const trailResult = await loadLocalTrails(mountain.slug, mountain.lat, mountain.lng);

      if (trailResult.trails.length === 0) {
        setError(`No ski trails found for ${mountain.name}.`);
        setLoading(false);
        return;
      }

      // Use the trail-derived bbox for terrain (covers all trail coordinates)
      setProgress('Loading terrain...');
      const terrainGrid = await fetchTerrainGrid(trailResult.bbox, (msg) => setProgress(msg));

      setTerrain(terrainGrid);

      const result: MountainData = {
        mountain: { ...mountain, bbox: trailResult.bbox },
        trails: trailResult.trails,
        fetchedAt: Date.now(),
      };

      saveToCache(result);
      setData(result);
      setProgress('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, terrain, loading, error, progress, loadMountain };
}
