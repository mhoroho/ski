import { LEGEND_GRADIENT } from '../utils/color';

export function ColorLegend() {
  const labels = [
    { angle: '40°+', pos: '0%' },
    { angle: '35°', pos: '13%' },
    { angle: '30°', pos: '25%' },
    { angle: '25°', pos: '38%' },
    { angle: '18°', pos: '55%' },
    { angle: '12°', pos: '70%' },
    { angle: '6°', pos: '85%' },
    { angle: '0°', pos: '100%' },
  ];

  return (
    <div className="absolute bottom-6 right-6 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-sky-200">
      <div className="text-xs font-semibold text-sky-700 mb-2 text-center">
        Slope Angle
      </div>
      <div className="flex items-stretch gap-2">
        <div
          className="w-4 rounded-sm"
          style={{
            background: LEGEND_GRADIENT,
            minHeight: '120px',
          }}
        />
        <div className="flex flex-col justify-between text-xs text-sky-700">
          {labels.map((l) => (
            <span key={l.angle}>{l.angle}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
