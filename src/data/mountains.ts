import type { Mountain } from '../types';

export const MOUNTAINS: Mountain[] = [
  // Colorado
  { name: "Vail", state: "CO", lat: 39.6061, lng: -106.3550, bbox: [39.58, -106.41, 39.64, -106.31], slug: "vail" },
  { name: "Breckenridge", state: "CO", lat: 39.4808, lng: -106.0676, bbox: [39.45, -106.11, 39.51, -106.03], slug: "breckenridge" },
  { name: "Keystone", state: "CO", lat: 39.6069, lng: -105.9497, bbox: [39.58, -105.99, 39.63, -105.91], slug: "keystone" },
  { name: "Copper Mountain", state: "CO", lat: 39.5022, lng: -106.1497, bbox: [39.48, -106.18, 39.52, -106.12], slug: "copper-mountain" },
  { name: "Arapahoe Basin", state: "CO", lat: 39.6426, lng: -105.8718, bbox: [39.63, -105.89, 39.66, -105.85], slug: "arapahoe-basin-ski-area" },
  { name: "Aspen Mountain", state: "CO", lat: 39.1869, lng: -106.8178, bbox: [39.17, -106.84, 39.20, -106.80], slug: "aspen-mountain" },
  { name: "Aspen Highlands", state: "CO", lat: 39.1803, lng: -106.8556, bbox: [39.16, -106.87, 39.20, -106.84], slug: "aspen-highlands" },
  // Snowmass not in OpenSkiMap data
  { name: "Telluride", state: "CO", lat: 37.9372, lng: -107.8464, bbox: [37.92, -107.87, 37.96, -107.83], slug: "telluride-ski-area" },
  { name: "Steamboat", state: "CO", lat: 40.4572, lng: -106.8045, bbox: [40.44, -106.83, 40.48, -106.78], slug: "steamboat-ski-resort" },
  { name: "Winter Park", state: "CO", lat: 39.8914, lng: -105.7625, bbox: [39.87, -105.80, 39.91, -105.73], slug: "winter-park" },
  { name: "Beaver Creek", state: "CO", lat: 39.6042, lng: -106.5164, bbox: [39.58, -106.55, 39.63, -106.49], slug: "beaver-creek" },
  { name: "Crested Butte", state: "CO", lat: 38.8986, lng: -106.9650, bbox: [38.88, -106.99, 38.92, -106.94], slug: "crested-butte-mountain-resort" },
  { name: "Purgatory", state: "CO", lat: 37.6303, lng: -107.8142, bbox: [37.61, -107.84, 37.65, -107.79], slug: "purgatory-resort" },
  // Utah
  { name: "Park City", state: "UT", lat: 40.6514, lng: -111.5080, bbox: [40.62, -111.55, 40.68, -111.47], slug: "park-city-mountain-resort" },
  { name: "Snowbird", state: "UT", lat: 40.5830, lng: -111.6556, bbox: [40.57, -111.67, 40.60, -111.64], slug: "snowbird" },
  { name: "Alta", state: "UT", lat: 40.5884, lng: -111.6386, bbox: [40.57, -111.66, 40.60, -111.62], slug: "alta-ski-area" },
  { name: "Brighton", state: "UT", lat: 40.5980, lng: -111.5833, bbox: [40.58, -111.60, 40.61, -111.57], slug: "brighton-resort" },
  { name: "Solitude", state: "UT", lat: 40.6199, lng: -111.5922, bbox: [40.60, -111.61, 40.64, -111.57], slug: "solitude-mountain-resort" },
  { name: "Deer Valley", state: "UT", lat: 40.6375, lng: -111.4783, bbox: [40.61, -111.52, 40.66, -111.45], slug: "deer-valley-resort" },
  // California
  { name: "Palisades Tahoe", state: "CA", lat: 39.1968, lng: -120.2354, bbox: [39.18, -120.26, 39.21, -120.22], slug: "palisades-tahoe" },
  { name: "Mammoth Mountain", state: "CA", lat: 37.6308, lng: -119.0326, bbox: [37.61, -119.06, 37.65, -119.00], slug: "mammoth-mountain" },
  { name: "Heavenly", state: "CA", lat: 38.9353, lng: -119.9397, bbox: [38.91, -119.97, 38.96, -119.91], slug: "heavenly-mountain-resort" },
  { name: "Kirkwood", state: "CA", lat: 38.6850, lng: -120.0650, bbox: [38.67, -120.08, 38.70, -120.05], slug: "kirkwood-mountain-resort" },
  // Northstar not in OpenSkiMap data
  // Montana
  { name: "Big Sky", state: "MT", lat: 45.2836, lng: -111.4014, bbox: [45.26, -111.44, 45.31, -111.36], slug: "big-sky-resort" },
  { name: "Whitefish Mountain", state: "MT", lat: 48.4849, lng: -114.3539, bbox: [48.47, -114.38, 48.50, -114.33], slug: "whitefish-mountain-resort" },
  // Wyoming
  { name: "Jackson Hole", state: "WY", lat: 43.5877, lng: -110.8279, bbox: [43.57, -110.86, 43.61, -110.80], slug: "jackson-hole-mountain-resort" },
  // Idaho
  { name: "Sun Valley", state: "ID", lat: 43.6975, lng: -114.3514, bbox: [43.68, -114.37, 43.72, -114.33], slug: "sun-valley" },
  // New Mexico
  { name: "Taos Ski Valley", state: "NM", lat: 36.5961, lng: -105.4542, bbox: [36.58, -105.47, 36.61, -105.43], slug: "taos-ski-valley" },
  // Vermont
  { name: "Stowe", state: "VT", lat: 44.5303, lng: -72.7814, bbox: [44.51, -72.81, 44.55, -72.75], slug: "stowe-mountain-resort" },
  { name: "Killington", state: "VT", lat: 43.6197, lng: -72.7972, bbox: [43.60, -72.83, 43.64, -72.77], slug: "killington-resort" },
  { name: "Sugarbush", state: "VT", lat: 44.1358, lng: -72.9033, bbox: [44.12, -72.93, 44.15, -72.88], slug: "sugarbush-resort" },
  { name: "Jay Peak", state: "VT", lat: 44.9268, lng: -72.5098, bbox: [44.91, -72.53, 44.94, -72.49], slug: "jay-peak-resort" },
  { name: "Mad River Glen", state: "VT", lat: 44.2036, lng: -72.9186, bbox: [44.19, -72.93, 44.22, -72.90], slug: "mad-river-glen" },
  // New Hampshire
  { name: "Cannon Mountain", state: "NH", lat: 44.1567, lng: -71.6986, bbox: [44.14, -71.72, 44.17, -71.68], slug: "cannon-mountain" },
  { name: "Wildcat Mountain", state: "NH", lat: 44.2636, lng: -71.2389, bbox: [44.25, -71.26, 44.28, -71.22], slug: "wildcat-mountain" },
  { name: "Loon Mountain", state: "NH", lat: 44.0364, lng: -71.6214, bbox: [44.02, -71.64, 44.05, -71.60], slug: "loon-mountain-resort" },
  // Maine
  { name: "Sugarloaf", state: "ME", lat: 45.0314, lng: -70.3131, bbox: [45.02, -70.34, 45.05, -70.29], slug: "sugarloaf" },
  { name: "Sunday River", state: "ME", lat: 44.4728, lng: -70.8564, bbox: [44.45, -70.88, 44.49, -70.83], slug: "sunday-river" },
  // New York
  { name: "Whiteface", state: "NY", lat: 44.3661, lng: -73.9028, bbox: [44.35, -73.93, 44.38, -73.88], slug: "whiteface-mountain" },
  { name: "Gore Mountain", state: "NY", lat: 43.6731, lng: -74.0064, bbox: [43.66, -74.03, 43.69, -73.98], slug: "gore-mountain" },
  { name: "Hunter Mountain", state: "NY", lat: 42.2014, lng: -74.2264, bbox: [42.19, -74.24, 42.22, -74.21], slug: "hunter-mountain" },
  // Washington
  { name: "Crystal Mountain", state: "WA", lat: 46.9350, lng: -121.5044, bbox: [46.92, -121.53, 46.95, -121.48], slug: "crystal-mountain" },
  { name: "Stevens Pass", state: "WA", lat: 47.7453, lng: -121.0886, bbox: [47.73, -121.11, 47.76, -121.07], slug: "stevens-pass-ski-area" },
  // Oregon
  { name: "Mt. Bachelor", state: "OR", lat: 43.9792, lng: -121.6886, bbox: [43.96, -121.72, 44.00, -121.66], slug: "mt-bachelor" },
  { name: "Mt. Hood Meadows", state: "OR", lat: 45.3311, lng: -121.6650, bbox: [45.32, -121.69, 45.35, -121.64], slug: "mt-hood-meadows-ski-resort" },
  // Alaska
  { name: "Alyeska", state: "AK", lat: 60.9669, lng: -149.0981, bbox: [60.95, -149.12, 60.98, -149.07], slug: "alyeska-resort" },
  // Michigan
  { name: "Boyne Mountain", state: "MI", lat: 45.1642, lng: -84.9361, bbox: [45.15, -84.95, 45.18, -84.92], slug: "boyne-mountain-resort" },
  // West Virginia
  { name: "Snowshoe", state: "WV", lat: 38.4089, lng: -79.9939, bbox: [38.39, -80.01, 38.43, -79.97], slug: "snowshoe-mountain" },
];
