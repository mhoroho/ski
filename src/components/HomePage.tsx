import { useState } from 'react';
import type { Mountain } from '../types';
import { MOUNTAINS } from '../data/mountains';

interface Props {
  onSelectMountain: (mountain: Mountain) => void;
}

// Group mountains by state
function groupByState(mountains: Mountain[]): Map<string, Mountain[]> {
  const groups = new Map<string, Mountain[]>();
  for (const m of mountains) {
    const existing = groups.get(m.state) || [];
    existing.push(m);
    groups.set(m.state, existing);
  }
  return groups;
}

const STATE_NAMES: Record<string, string> = {
  CO: 'Colorado', UT: 'Utah', CA: 'California', MT: 'Montana',
  WY: 'Wyoming', ID: 'Idaho', NM: 'New Mexico', VT: 'Vermont',
  NH: 'New Hampshire', ME: 'Maine', NY: 'New York', WA: 'Washington',
  OR: 'Oregon', AK: 'Alaska', MI: 'Michigan', WV: 'West Virginia',
  BC: 'British Columbia', QC: 'Quebec',
};

export function HomePage({ onSelectMountain }: Props) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? MOUNTAINS.filter((m) =>
        `${m.name} ${m.state} ${STATE_NAMES[m.state] || ''}`.toLowerCase().includes(query.toLowerCase())
      )
    : MOUNTAINS;

  const groups = groupByState(filtered);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⛷</div>
          <h1 className="text-3xl font-bold text-sky-900 mb-2">How steep is it, really?</h1>
          <p className="text-sky-600 text-sm">3D slope-angle heatmaps for 50+ ski mountains</p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search mountains..."
            className="w-full px-4 py-2.5 bg-white border border-sky-300 rounded-lg text-sky-900 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm shadow-sm"
          />
        </div>

        {/* Mountain grid grouped by state */}
        {[...groups.entries()].map(([state, mountains]) => (
          <div key={state} className="mb-6">
            <h2 className="text-xs font-semibold text-sky-500 uppercase tracking-wider mb-2">
              {STATE_NAMES[state] || state}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {mountains.map((m) => (
                <button
                  key={m.slug}
                  onClick={() => onSelectMountain(m)}
                  className="bg-white border border-sky-200 rounded-lg p-3 text-left hover:border-sky-400 hover:shadow-md transition-all group"
                >
                  <div className="font-medium text-sm text-sky-900 group-hover:text-sky-700 truncate">
                    {m.name}
                  </div>
                  <div className="text-xs text-sky-400 mt-0.5">{m.state}</div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center text-sky-400 text-sm py-8">
            No mountains found matching "{query}"
          </div>
        )}
      </div>
    </div>
  );
}
