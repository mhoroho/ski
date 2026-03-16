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
  unknown: 'text-slate-400',
};

export function TrailList({ trails, onSelect, selectedTrail }: Props) {
  const sorted = [...trails].sort((a, b) => b.peakSlope - a.peakSlope);

  return (
    <div className="text-xs w-max">
      <table>
        <thead className="sticky top-0 bg-slate-800">
          <tr className="text-slate-400 text-left whitespace-nowrap">
            <th className="py-0.5 px-1">Trail</th>
            <th className="py-0.5 px-1 text-right">Pk</th>
            <th className="py-0.5 px-1 text-right">Av</th>
            <th className="py-0.5 px-1 text-right">Mx</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((trail, i) => (
            <tr key={i} className={`border-t border-slate-700/50 hover:bg-slate-700/30 cursor-pointer ${selectedTrail?.name === trail.name ? 'bg-slate-700/50' : ''}`} onClick={() => onSelect?.(trail)}>
              <td className="py-0.5 px-1 flex items-center gap-0.5 whitespace-nowrap">
                <span className={difficultyColor[trail.difficulty] || 'text-slate-400'}>
                  {difficultyIcon[trail.difficulty] || '?'}
                </span>
                <span className="text-white truncate max-w-[110px]">{trail.name}</span>
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
