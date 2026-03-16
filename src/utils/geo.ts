/** Haversine distance between two points in meters */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/** Calculate slope angle in degrees between two points with elevation.
 *  Returns null if points are too close for a reliable calculation. */
export function slopeAngle(
  lat1: number, lng1: number, elev1: number,
  lat2: number, lng2: number, elev2: number
): number | null {
  const horizontalDist = haversineDistance(lat1, lng1, lat2, lng2);
  if (horizontalDist < 10) return null; // need at least 10m for reliable slope
  const elevChange = Math.abs(elev2 - elev1);
  const angle = Math.atan2(elevChange, horizontalDist) * (180 / Math.PI);
  // Cap at 45° — steepest inbounds ski terrain in the US is ~40-45°
  return Math.min(angle, 45);
}

/** Smooth an array of elevations using a 3-point moving average */
export function smoothElevations(elevations: number[]): number[] {
  if (elevations.length <= 2) return elevations;
  const smoothed = [...elevations];
  for (let i = 1; i < elevations.length - 1; i++) {
    smoothed[i] = (elevations[i - 1] + elevations[i] + elevations[i + 1]) / 3;
  }
  return smoothed;
}
