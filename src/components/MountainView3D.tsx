import { useRef, useEffect, useMemo, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MountainData, Trail } from '../types';
import { slopeToColor } from '../utils/color';

interface Props {
  data: MountainData;
  focusTrail?: Trail | null;
  onFocusHandled?: () => void;
  selectedTrail?: Trail | null;
}

function buildTrailGeoJSON(trails: Trail[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (const trail of trails) {
    for (const section of trail.sections) {
      for (const seg of section) {
        features.push({
          type: 'Feature',
          properties: {
            color: slopeToColor(seg.slopeAngle),
            slope: seg.slopeAngle,
            name: trail.name,
            difficulty: trail.difficulty,
            peakSlope: trail.peakSlope,
            avgSlope: trail.avgSlope,
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              [seg.start.lng, seg.start.lat],
              [seg.end.lng, seg.end.lat],
            ],
          },
        });
      }
    }
  }
  return { type: 'FeatureCollection', features };
}

function getTrailBounds(trail: Trail): maplibregl.LngLatBounds {
  const bounds = new maplibregl.LngLatBounds();
  for (const section of trail.sections) {
    for (const seg of section) {
      bounds.extend([seg.start.lng, seg.start.lat]);
      bounds.extend([seg.end.lng, seg.end.lat]);
    }
  }
  return bounds;
}

/** Compute bearing from the lowest trail point to the highest.
 *  This orients the camera to "look uphill" on load. */
function computeInitialBearing(trails: Trail[]): number {
  let lowestPt = { lat: 0, lng: 0, elevation: Infinity };
  let highestPt = { lat: 0, lng: 0, elevation: -Infinity };
  for (const trail of trails) {
    for (const section of trail.sections) {
      for (const seg of section) {
        if (seg.start.elevation < lowestPt.elevation) lowestPt = seg.start;
        if (seg.end.elevation < lowestPt.elevation) lowestPt = seg.end;
        if (seg.start.elevation > highestPt.elevation) highestPt = seg.start;
        if (seg.end.elevation > highestPt.elevation) highestPt = seg.end;
      }
    }
  }
  if (!isFinite(lowestPt.elevation) || !isFinite(highestPt.elevation)) return 0;
  // Bearing from low point to high point
  const dLng = (highestPt.lng - lowestPt.lng) * Math.PI / 180;
  const lat1 = lowestPt.lat * Math.PI / 180;
  const lat2 = highestPt.lat * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export function MountainView3D({ data, focusTrail, onFocusHandled, selectedTrail }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const { mountain, trails } = data;

  const geojson = useMemo(() => buildTrailGeoJSON(trails), [trails]);
  const initialBearing = useMemo(() => computeInitialBearing(trails), [trails]);

  const initMap = useCallback(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>',
          },
          'terrain-dem': {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            tileSize: 256,
            encoding: 'terrarium',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
          },
          {
            id: 'hillshade',
            type: 'hillshade',
            source: 'terrain-dem',
            paint: {
              'hillshade-shadow-color': '#334155',
              'hillshade-highlight-color': '#ffffff',
              'hillshade-exaggeration': 0.5,
              'hillshade-illumination-direction': 315,
            },
          },
        ],
        terrain: {
          source: 'terrain-dem',
          exaggeration: 1.5,
        },
        sky: {
          'sky-color': '#89CFF0',
          'horizon-color': '#f0e8d0',
          'fog-color': '#f0e8d0',
          'sky-horizon-blend': 0.5,
          'horizon-fog-blend': 0.5,
          'fog-ground-blend': 0.8,
        },
      },
      center: [mountain.lng, mountain.lat],
      zoom: 13.5,
      pitch: 60,
      bearing: initialBearing,
      maxPitch: 85,
      minZoom: 11,
      maxZoom: 17,
      maxBounds: [
        [mountain.lng - 0.15, mountain.lat - 0.1],
        [mountain.lng + 0.15, mountain.lat + 0.1],
      ],
    });

    map.scrollZoom.setWheelZoomRate(1 / 2000);
    map.scrollZoom.setZoomRate(1 / 2000);

    map.addControl(new maplibregl.NavigationControl({
      visualizePitch: true,
      showCompass: true,
      showZoom: false,
    }), 'bottom-left');

    // Custom zoom buttons with small increments
    const zoomContainer = document.createElement('div');
    zoomContainer.className = 'maplibregl-ctrl maplibregl-ctrl-group';
    const zoomStep = 0.3;
    for (const [label, dir] of [['+', 1], ['\u2212', -1]] as const) {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.style.cssText = 'width:29px;height:29px;font-size:18px;cursor:pointer;color:#000;';
      btn.addEventListener('click', () => {
        map.zoomTo(map.getZoom() + zoomStep * dir, { duration: 200 });
      });
      zoomContainer.appendChild(btn);
    }
    map.getContainer().querySelector('.maplibregl-ctrl-bottom-left')
      ?.appendChild(zoomContainer);

    map.on('load', () => {
      map.addSource('trails', {
        type: 'geojson',
        data: geojson,
      });

      map.addLayer({
        id: 'trail-lines',
        type: 'line',
        source: 'trails',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.5, 13, 2, 15, 4, 17, 5],
          'line-opacity': 0.9,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      });

      // Hover popup
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
      });

      const difficultyLabel: Record<string, string> = {
        novice: '● Green Circle',
        easy: '● Green Circle',
        intermediate: '■ Blue Square',
        advanced: '◆ Black Diamond',
        expert: '◆◆ Double Black',
        freeride: '◆◆ Double Black',
      };
      const difficultyColor: Record<string, string> = {
        novice: '#22c55e', easy: '#22c55e',
        intermediate: '#3b82f6',
        advanced: '#111', expert: '#111', freeride: '#111',
      };

      function buildPopupHTML(p: Record<string, string>): string {
        const name = p['name'] ?? 'Unknown';
        const diff = p['difficulty'] ?? 'unknown';
        const pitch = parseFloat(p['slope'] ?? '0').toFixed(1);
        const label = difficultyLabel[diff] ?? diff;
        const color = difficultyColor[diff] ?? '#888';
        return (
          `<div style="font-size:12px;color:#333">` +
          `<div style="font-weight:bold;margin-bottom:2px">${name}</div>` +
          `<div style="color:${color};margin-bottom:2px">${label}</div>` +
          `<div style="font-weight:600">Pitch: ${pitch}°</div>` +
          `</div>`
        );
      }

      map.on('mouseenter', 'trail-lines', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features[0]) {
          const p = e.features[0].properties as Record<string, string>;
          popup
            .setLngLat(e.lngLat)
            .setHTML(buildPopupHTML(p))
            .addTo(map);
        }
      });

      map.on('mouseleave', 'trail-lines', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });

      map.on('mousemove', 'trail-lines', (e) => {
        if (e.features && e.features[0]) {
          const p = e.features[0].properties as Record<string, string>;
          popup.setLngLat(e.lngLat).setHTML(buildPopupHTML(p));
        }
      });
    });

    mapRef.current = map;
  }, [mountain, geojson, initialBearing]);

  // Initialize map
  useEffect(() => {
    initMap();
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [initMap]);

  // Update trail data when it changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource('trails') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(geojson);
    }
  }, [geojson]);

  // Highlight selected trail, fade others
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !map.getLayer('trail-lines')) return;
    if (selectedTrail) {
      map.setPaintProperty('trail-lines', 'line-opacity', [
        'case',
        ['==', ['get', 'name'], selectedTrail.name],
        0.95,
        0.1,
      ]);
      map.setPaintProperty('trail-lines', 'line-width', [
        'case',
        ['==', ['get', 'name'], selectedTrail.name],
        ['interpolate', ['linear'], ['zoom'], 11, 1.5, 13, 4, 15, 6, 17, 8],
        ['interpolate', ['linear'], ['zoom'], 11, 0.5, 13, 2, 15, 4, 17, 5],
      ]);
    } else {
      map.setPaintProperty('trail-lines', 'line-opacity', 0.9);
      map.setPaintProperty('trail-lines', 'line-width', [
        'interpolate', ['linear'], ['zoom'], 11, 0.5, 13, 2, 15, 4, 17, 5,
      ]);
    }
  }, [selectedTrail]);

  // Focus on trail — preserve current bearing and pitch
  useEffect(() => {
    if (!focusTrail || !mapRef.current) return;
    const map = mapRef.current;
    const currentBearing = map.getBearing();
    const currentPitch = map.getPitch();
    const bounds = getTrailBounds(focusTrail);
    map.fitBounds(bounds, {
      padding: 80,
      maxZoom: 16,
      pitch: currentPitch,
      bearing: currentBearing,
      duration: 1500,
    });
    onFocusHandled?.();
  }, [focusTrail, onFocusHandled]);

  return <div ref={containerRef} className="w-full h-full" />;
}
