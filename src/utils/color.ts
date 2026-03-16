/** Map slope angle (degrees) to a hex color.
 *  Muted cool tones for flat terrain, increasingly vivid/hot for steep.
 *  0° = dark slate, 40°+ = electric violet */
export function slopeToColor(angleDeg: number): string {
  const stops: [number, [number, number, number]][] = [
    [0,  [40, 60, 80]],       // #283c50 dark slate — vanishes into terrain
    [6,  [20, 120, 140]],     // #14788c muted teal
    [12, [30, 180, 120]],     // #1eb478 emerald
    [18, [255, 220, 0]],      // #ffdc00 vivid yellow
    [25, [255, 130, 0]],      // #ff8200 hot orange
    [30, [240, 30, 30]],      // #f01e1e bright red
    [35, [255, 0, 140]],      // #ff008c hot magenta
    [40, [160, 0, 255]],      // #a000ff electric violet
  ];

  const clamped = Math.max(0, Math.min(angleDeg, 40));

  // Find surrounding stops
  let lower = stops[0];
  let upper = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i][0] && clamped <= stops[i + 1][0]) {
      lower = stops[i];
      upper = stops[i + 1];
      break;
    }
  }

  const range = upper[0] - lower[0];
  const t = range === 0 ? 0 : (clamped - lower[0]) / range;

  const r = Math.round(lower[1][0] + t * (upper[1][0] - lower[1][0]));
  const g = Math.round(lower[1][1] + t * (upper[1][1] - lower[1][1]));
  const b = Math.round(lower[1][2] + t * (upper[1][2] - lower[1][2]));

  return `rgb(${r},${g},${b})`;
}

/** CSS gradient string for the legend */
export const LEGEND_GRADIENT = `linear-gradient(to top,
  #283c50 0%,
  #14788c 15%,
  #1eb478 30%,
  #ffdc00 45%,
  #ff8200 62%,
  #f01e1e 75%,
  #ff008c 87%,
  #a000ff 100%
)`;
