import { useEffect, useState } from 'react';
import type { Mountain, Trail } from '../types';
import { MountainSearch } from './MountainSearch';
import { MountainView3D } from './MountainView3D';
import { TrailList } from './TrailList';
import { LoadingOverlay } from './LoadingOverlay';
import { useMountainTrails } from '../hooks/useMountainTrails';

interface Props {
  label: string;
  initial?: Mountain;
  trailListSide?: 'left' | 'right';
}

export function MountainPane({ label, initial, trailListSide = 'right' }: Props) {
  const { data, loading, error, progress, loadMountain } = useMountainTrails();
  const selected = data?.mountain ?? initial ?? null;
  const [focusTrail, setFocusTrail] = useState<Trail | null>(null);
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);

  const handleTrailSelect = (trail: Trail) => {
    if (selectedTrail?.name === trail.name) {
      setSelectedTrail(null);
    } else {
      setSelectedTrail(trail);
    }
  };

  useEffect(() => {
    if (initial) {
      loadMountain(initial);
    }
  }, [initial, loadMountain]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <MountainSearch
              label={label}
              selected={selected}
              onSelect={loadMountain}
            />
          </div>
        </div>
        {data && (
          <div className="mt-2 text-xs text-slate-400">
            {data.trails.length} trails loaded
          </div>
        )}
      </div>

      <div className="flex-1 flex min-h-0">
        {data && trailListSide === 'left' && (
          <div className="bg-slate-800 border-r border-slate-700 overflow-y-auto">
            <TrailList trails={data.trails} onSelect={handleTrailSelect} selectedTrail={selectedTrail} />
          </div>
        )}

        <div className="flex-1 relative">
          {data ? (
            <MountainView3D data={data} focusTrail={focusTrail} onFocusHandled={() => setFocusTrail(null)} selectedTrail={selectedTrail} />
          ) : !loading && !error ? (
            <div className="flex items-center justify-center h-full bg-slate-900 text-slate-500">
              <div className="text-center">
                <div className="text-4xl mb-2">⛷</div>
                <div className="text-sm">Search for a mountain above</div>
              </div>
            </div>
          ) : null}

          {loading && <LoadingOverlay progress={progress} />}

          {error && (
            <div className="flex items-center justify-center h-full bg-slate-900">
              <div className="text-center p-4 max-w-xs">
                <div className="text-red-400 text-sm mb-2">Error</div>
                <div className="text-slate-300 text-xs">{error}</div>
              </div>
            </div>
          )}
        </div>

        {data && trailListSide === 'right' && (
          <div className="bg-slate-800 border-l border-slate-700 overflow-y-auto">
            <TrailList trails={data.trails} onSelect={handleTrailSelect} selectedTrail={selectedTrail} />
          </div>
        )}
      </div>
    </div>
  );
}
