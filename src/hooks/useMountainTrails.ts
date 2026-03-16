import { useState, useCallback } from 'react';
import type { Mountain, MountainData } from '../types';
import { loadLocalTrails } from '../services/localTrails';

const CACHE_VERSION = 8; // filter outlier coordinates from bad OpenSkiMap data

interface UseMountainTrailsResult {
  data: MountainData | null;
  loading: boolean;
  error: string | null;
  progress: string;
  loadMountain: (mountain: Mountain) => Promise<void>;
}

function getCacheKey(mountain: Mountain): string {
  return `ski-steepness:v${CACHE_VERSION}:${mountain.name}-${mountain.state}`;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  const loadMountain = useCallback(async (mountain: Mountain) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      setProgress('Loading trail data...');
      const trailResult = await loadLocalTrails(mountain.slug, mountain.lat, mountain.lng);

      if (trailResult.trails.length === 0) {
        setError(`No ski trails found for ${mountain.name}.`);
        setLoading(false);
        return;
      }

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

  return { data, loading, error, progress, loadMountain };
}
