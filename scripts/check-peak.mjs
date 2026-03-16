import { readFileSync } from 'fs';

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function sa(lat1, lng1, e1, lat2, lng2, e2) {
  const d = haversine(lat1, lng1, lat2, lng2);
  if (d < 10) return null;
  return Math.min(Math.atan2(Math.abs(e2-e1), d) * 180/Math.PI, 45);
}

function smooth(arr) {
  if (arr.length <= 2) return [...arr];
  const s = [...arr];
  for (let i = 1; i < arr.length-1; i++) s[i] = (arr[i-1]+arr[i]+arr[i+1])/3;
  return s;
}

const d = JSON.parse(readFileSync('../public/trails/loon-mountain-resort.json', 'utf8'));

const results = d.trails.map(t => {
  const isMulti = t.coordinates.length > 0 && Array.isArray(t.coordinates[0][0]);
  const lines = isMulti ? t.coordinates : [t.coordinates];
  let peak = 0;
  for (const coords of lines) {
    if (coords.length < 2) continue;
    const segs = [];
    for (let i = 0; i < coords.length-1; i++) {
      const dist = haversine(coords[i][1], coords[i][0], coords[i+1][1], coords[i+1][0]);
      const angle = sa(coords[i][1], coords[i][0], coords[i][2], coords[i+1][1], coords[i+1][0], coords[i+1][2]);
      if (angle === null) continue;
      segs.push({ angle, dist });
    }
    const cumDist = [0];
    for (const s of segs) cumDist.push(cumDist[cumDist.length-1] + s.dist);
    let left = 0;
    for (let right = 0; right < segs.length; right++) {
      while (cumDist[right+1] - cumDist[left] > 100 && left < right) left++;
      const wd = cumDist[right+1] - cumDist[left];
      if (wd < 20) continue;
      let ws = 0;
      for (let i = left; i <= right; i++) ws += segs[i].angle * (cumDist[i+1] - cumDist[i]);
      const avg = ws / wd;
      if (avg > peak) peak = avg;
    }
  }
  return { name: t.name, diff: t.difficulty, peak: peak.toFixed(1) };
});

results.sort((a, b) => parseFloat(b.peak) - parseFloat(a.peak));
console.log('Top 20 by peak slope (10m NED):');
results.slice(0, 20).forEach((t, i) => console.log(`${i+1}. ${t.name} | ${t.diff} | peak: ${t.peak}°`));
const rip = results.find(r => r.name.includes('Rip'));
console.log(`\nRip Saw rank: ${results.indexOf(rip) + 1}`);
