import { useState } from 'react';
import { MountainPane } from './components/MountainPane';
import { ColorLegend } from './components/ColorLegend';

function App() {
  const [page, setPage] = useState<'explore' | 'compare'>('explore');

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white">
      {/* Nav bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border-b border-slate-700">
        <button
          onClick={() => setPage('explore')}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            page === 'explore'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Explore
        </button>
        <button
          onClick={() => setPage('compare')}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            page === 'compare'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Compare
        </button>
      </div>

      {/* Page content */}
      <div className="flex-1 flex min-h-0">
        {page === 'explore' ? (
          <div className="w-full flex flex-col">
            <MountainPane label="Mountain" trailListSide="right" />
          </div>
        ) : (
          <>
            <div className="w-1/2 flex flex-col border-r border-slate-700">
              <MountainPane label="" trailListSide="left" />
            </div>
            <div className="w-1/2 flex flex-col">
              <MountainPane label="" trailListSide="right" />
            </div>
          </>
        )}
      </div>

      <ColorLegend />
    </div>
  );
}

export default App;
