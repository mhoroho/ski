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
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      <div className="p-3 bg-white border-b border-sky-200 shadow-sm">
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
          <div className="mt-2 text-xs text-sky-500">
            {data.trails.length} trails loaded
          </div>
        )}
      </div>

      {/* Desktop: side panel layout */}
      <div className="flex-1 hidden md:flex min-h-0">
        {data && trailListSide === 'left' && (
          <div className="bg-white border-r border-sky-200 overflow-y-auto">
            <TrailList trails={data.trails} onSelect={handleTrailSelect} selectedTrail={selectedTrail} />
          </div>
        )}

        <div className="flex-1 relative">
          {data ? (
            <MountainView3D data={data} focusTrail={focusTrail} onFocusHandled={() => setFocusTrail(null)} selectedTrail={selectedTrail} />
          ) : !loading && !error ? (
            <div className="flex items-center justify-center h-full bg-sky-50 text-sky-400">
              <div className="text-center">
                <div className="text-4xl mb-2">⛷</div>
                <div className="text-sm">Search for a mountain above</div>
              </div>
            </div>
          ) : null}

          {loading && <LoadingOverlay progress={progress} />}

          {error && (
            <div className="flex items-center justify-center h-full bg-sky-50">
              <div className="text-center p-4 max-w-xs">
                <div className="text-red-500 text-sm mb-2">Error</div>
                <div className="text-sky-700 text-xs">{error}</div>
              </div>
            </div>
          )}
        </div>

        {data && trailListSide === 'right' && (
          <div className="bg-white border-l border-sky-200 overflow-y-auto">
            <TrailList trails={data.trails} onSelect={handleTrailSelect} selectedTrail={selectedTrail} />
          </div>
        )}
      </div>

      {/* Mobile: top drawer + map */}
      <div className="flex-1 flex flex-col md:hidden min-h-0">
        {data && (
          <div className={`bg-white border-b border-sky-200 transition-all duration-200 overflow-hidden ${drawerOpen ? 'max-h-48' : 'h-7'}`}>
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="w-full flex items-center justify-center gap-1 h-7 text-xs text-sky-500 hover:text-sky-700"
            >
              <span>{drawerOpen ? '▲' : '▼'}</span>
              <span>Trails ({data.trails.length})</span>
            </button>
            {drawerOpen && (
              <div className="overflow-y-auto max-h-36 px-1">
                <TrailList trails={data.trails} onSelect={handleTrailSelect} selectedTrail={selectedTrail} />
              </div>
            )}
          </div>
        )}

        <div className="flex-1 relative">
          {data ? (
            <MountainView3D data={data} focusTrail={focusTrail} onFocusHandled={() => setFocusTrail(null)} selectedTrail={selectedTrail} />
          ) : !loading && !error ? (
            <div className="flex items-center justify-center h-full bg-sky-50 text-sky-400">
              <div className="text-center">
                <div className="text-4xl mb-2">⛷</div>
                <div className="text-sm">Search for a mountain above</div>
              </div>
            </div>
          ) : null}

          {loading && <LoadingOverlay progress={progress} />}

          {error && (
            <div className="flex items-center justify-center h-full bg-sky-50">
              <div className="text-center p-4 max-w-xs">
                <div className="text-red-500 text-sm mb-2">Error</div>
                <div className="text-sky-700 text-xs">{error}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
