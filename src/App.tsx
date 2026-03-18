import { useState } from 'react';
import { MountainPane } from './components/MountainPane';
import { ColorLegend } from './components/ColorLegend';
import { FeedbackBar } from './components/FeedbackBar';

function App() {
  const [page, setPage] = useState<'explore' | 'compare'>('explore');

  return (
    <div className="flex flex-col h-screen bg-sky-50 text-sky-900">
      {/* Nav bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border-b border-sky-200 shadow-sm">
        <button
          onClick={() => setPage('explore')}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            page === 'explore'
              ? 'bg-sky-600 text-white'
              : 'bg-sky-100 text-sky-700 hover:bg-sky-200'
          }`}
        >
          Explore
        </button>
        <button
          onClick={() => setPage('compare')}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            page === 'compare'
              ? 'bg-sky-600 text-white'
              : 'bg-sky-100 text-sky-700 hover:bg-sky-200'
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
            {/* Desktop: side by side */}
            <div className="hidden md:flex w-full">
              <div className="w-1/2 flex flex-col border-r border-sky-200">
                <MountainPane label="" trailListSide="left" />
              </div>
              <div className="w-1/2 flex flex-col">
                <MountainPane label="" trailListSide="right" />
              </div>
            </div>
            {/* Mobile: stacked */}
            <div className="flex md:hidden flex-col w-full">
              <div className="h-1/2 flex flex-col border-b border-sky-200">
                <MountainPane label="" trailListSide="right" />
              </div>
              <div className="h-1/2 flex flex-col">
                <MountainPane label="" trailListSide="right" />
              </div>
            </div>
          </>
        )}
      </div>

      <ColorLegend />
      <FeedbackBar />
    </div>
  );
}

export default App;
