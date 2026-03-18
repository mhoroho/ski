import { useState } from 'react';
import type { Trail } from '../types';
import { slopeToColor } from '../utils/color';

interface Props {
  trails: Trail[];
  onSelect?: (trail: Trail) => void;
  selectedTrail?: Trail | null;
}

const difficultyIcon: Record<string, string> = {
  novice: '●',
  easy: '●',
  intermediate: '■',
  advanced: '◆',
  expert: '◆◆',
  freeride: '◆◆',
  unknown: '?',
};

const difficultyColor: Record<string, string> = {
  novice: 'text-green-400',
  easy: 'text-green-400',
  intermediate: 'text-blue-400',
  advanced: 'text-black',
  expert: 'text-black',
  freeride: 'text-yellow-400',
  unknown: 'text-sky-500',
};

type SortField = 'name' | 'peakSlope' | 'avgSlope' | 'maxSlope';

function getSortFn(field: SortField, asc: boolean) {
  return (a: Trail, b: Trail) => {
    let cmp: number;
    if (field === 'name') {
      cmp = a.name.localeCompare(b.name);
    } else {
      cmp = a[field] - b[field];
    }
    return asc ? cmp : -cmp;
  };
}

export function TrailList({ trails, onSelect, selectedTrail }: Props) {
  const [sortField, setSortField] = useState<SortField>('peakSlope');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'name'); // name defaults asc, numbers default desc
    }
  };

  const sorted = [...trails].sort(getSortFn(sortField, sortAsc));
  const arrow = (field: SortField) => sortField === field ? (sortAsc ? ' ▲' : ' ▼') : '';

  return (
    <div className="text-xs w-max">
      <table>
        <thead className="sticky top-0 bg-white">
          <tr className="text-sky-500 text-left whitespace-nowrap">
            <th className="py-0.5 px-1 cursor-pointer select-none hover:text-sky-700" onClick={() => handleSort('name')}>Trail{arrow('name')}</th>
            <th className="py-0.5 px-1 text-right cursor-pointer select-none hover:text-sky-700" onClick={() => handleSort('peakSlope')}>Pk{arrow('peakSlope')}</th>
            <th className="py-0.5 px-1 text-right cursor-pointer select-none hover:text-sky-700" onClick={() => handleSort('avgSlope')}>Av{arrow('avgSlope')}</th>
            <th className="py-0.5 px-1 text-right cursor-pointer select-none hover:text-sky-700" onClick={() => handleSort('maxSlope')}>Mx{arrow('maxSlope')}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((trail, i) => (
            <tr key={i} className={`border-t border-sky-200/50 hover:bg-sky-100 cursor-pointer ${selectedTrail?.name === trail.name ? 'bg-sky-100' : ''}`} onClick={() => onSelect?.(trail)}>
              <td className="py-0.5 px-1 flex items-center gap-0.5 whitespace-nowrap">
                <span className={difficultyColor[trail.difficulty] || 'text-sky-500'}>
                  {difficultyIcon[trail.difficulty] || '?'}
                </span>
                <span className="text-sky-900 truncate max-w-[110px]">{trail.name}</span>
              </td>
              <td className="py-0.5 px-1 text-right font-mono whitespace-nowrap" style={{ color: slopeToColor(trail.peakSlope) }}>
                {trail.peakSlope.toFixed(0)}°
              </td>
              <td className="py-0.5 px-1 text-right font-mono whitespace-nowrap" style={{ color: slopeToColor(trail.avgSlope) }}>
                {trail.avgSlope.toFixed(0)}°
              </td>
              <td className="py-0.5 px-1 text-right font-mono whitespace-nowrap" style={{ color: slopeToColor(trail.maxSlope) }}>
                {trail.maxSlope.toFixed(0)}°
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
