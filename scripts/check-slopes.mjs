import { readFileSync } from 'fs';

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function slopeAngle(lat1, lng1, e1, lat2, lng2, e2) {
  const d = haversine(lat1, lng1, lat2, lng2);
  if (d < 5) return null;
  return Math.min(Math.atan2(Math.abs(e2-e1), d) * 180/Math.PI, 55);
}

function smooth(arr) {
  if (arr.length <= 2) return [...arr];
  const s = [...arr];
  for (let i = 1; i < arr.length-1; i++) s[i] = (arr[i-1]+arr[i]+arr[i+1])/3;
  return s;
}

const d = JSON.parse(readFileSync('../public/trails/loon-mountain-resort.json', 'utf8'));

for (const t of d.trails) {
  const isMulti = t.coordinates.length > 0 && Array.isArray(t.coordinates[0][0]);
  const lines = isMulti ? t.coordinates : [t.coordinates];

  for (const coords of lines) {
    if (coords.length < 2) continue;
    const rawElevs = coords.map(c => c[2] || 0);
    const se = smooth(rawElevs);
    const pts = coords.map((c, i) => ({ lat: c[1], lng: c[0], elev: se[i] }));

    const ra = [];
    for (let i = 0; i < pts.length-1; i++) {
      ra.push(slopeAngle(pts[i].lat, pts[i].lng, pts[i].elev, pts[i+1].lat, pts[i+1].lng, pts[i+1].elev));
    }

    const sma = ra.map(a => a === null ? 0 : a);
    for (let i = 1; i < sma.length-1; i++) {
      if (ra[i-1] !== null && ra[i] !== null && ra[i+1] !== null) {
        sma[i] = (sma[i-1] + sma[i] + sma[i+1]) / 3;
      }
    }

    let la = 0;
    let maxAngle = 0;
    for (let i = 0; i < pts.length-1; i++) {
      const angle = ra[i] !== null ? sma[i] : la;
      if (ra[i] !== null) la = sma[i];
      if (angle > maxAngle) maxAngle = angle;
      if (angle > 30) {
        const dist = haversine(pts[i].lat, pts[i].lng, pts[i+1].lat, pts[i+1].lng);
        console.log(`${t.name}: seg${i} angle=${angle.toFixed(1)}° dist=${dist.toFixed(1)}m elev=${pts[i].elev.toFixed(1)}->${pts[i+1].elev.toFixed(1)}`);
      }
    }
    if (maxAngle > 25) {
      console.log(`  >> ${t.name} max processed angle: ${maxAngle.toFixed(1)}°`);
    }
  }
}
