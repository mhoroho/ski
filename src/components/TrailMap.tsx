import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Tooltip, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import type { MountainData, Trail } from '../types';
import { slopeToColor } from '../utils/color';

const TRAIL_WEIGHT = 8;

interface Props {
  data: MountainData;
  focusTrail?: Trail | null;
  onFocusHandled?: () => void;
}

function TrailLine({ trail }: { trail: Trail }) {
  if (trail.sections.length === 0) return null;

  let isFirst = true;
  return (
    <>
      {trail.sections.map((section, secIdx) =>
        section.map((seg, si) => {
          const showTooltip = isFirst;
          if (isFirst) isFirst = false;

          return (
            <Polyline
              key={`${secIdx}-${si}`}
              positions={[
                [seg.start.lat, seg.start.lng],
                [seg.end.lat, seg.end.lng],
              ]}
              pathOptions={{
                color: slopeToColor(seg.slopeAngle),
                weight: TRAIL_WEIGHT,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            >
              {showTooltip && (
                <Tooltip sticky>
                  <div style={{ fontSize: '12px' }}>
                    <div style={{ fontWeight: 'bold' }}>{trail.name}</div>
                    <div>Peak: {trail.peakSlope.toFixed(1)}° | Avg: {trail.avgSlope.toFixed(1)}°</div>
                    <div style={{ textTransform: 'capitalize', color: '#888' }}>{trail.difficulty}</div>
                  </div>
                </Tooltip>
              )}
            </Polyline>
          );
        })
      )}
    </>
  );
}

function FlyToTrail({ trail, onDone }: { trail: Trail; onDone: () => void }) {
  const map = useMap();
  useEffect(() => {
    const allLats: number[] = [];
    const allLngs: number[] = [];
    for (const section of trail.sections) {
      for (const seg of section) {
        allLats.push(seg.start.lat, seg.end.lat);
        allLngs.push(seg.start.lng, seg.end.lng);
      }
    }
    if (allLats.length > 0) {
      const bounds: LatLngBoundsExpression = [
        [Math.min(...allLats), Math.min(...allLngs)],
        [Math.max(...allLats), Math.max(...allLngs)],
      ];
      map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
    onDone();
  }, [trail, map, onDone]);
  return null;
}

export function TrailMap({ data, focusTrail, onFocusHandled }: Props) {
  const { mountain, trails } = data;

  return (
    <MapContainer
      center={[mountain.lat, mountain.lng]}
      zoom={14}
      className="w-full h-full"
      scrollWheelZoom={true}
      preferCanvas={true}
    >
      <TileLayer
        attribution='Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>'
        url="https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg"
        maxZoom={16}
      />
      {focusTrail && onFocusHandled && (
        <FlyToTrail trail={focusTrail} onDone={onFocusHandled} />
      )}
      {trails.map((trail, ti) => (
        <TrailLine key={ti} trail={trail} />
      ))}
    </MapContainer>
  );
}
