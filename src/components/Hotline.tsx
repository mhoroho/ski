import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-hotline';

interface Props {
  /** Array of [lat, lng, value] tuples */
  data: [number, number, number][];
  min: number;
  max: number;
  palette: Record<number, string>;
  weight?: number;
  outlineWidth?: number;
  outlineColor?: string;
  tooltip?: string;
}

export function Hotline({
  data,
  min,
  max,
  palette,
  weight = 5,
  outlineWidth = 1,
  outlineColor = '#000000',
  tooltip,
}: Props) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (data.length < 2) return;

    // @ts-expect-error leaflet-hotline adds L.hotline
    const line = L.hotline(data, {
      min,
      max,
      palette,
      weight,
      outlineWidth,
      outlineColor,
    });

    if (tooltip) {
      line.bindTooltip(tooltip, { sticky: true });
    }

    line.addTo(map);
    layerRef.current = line;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [data, min, max, palette, weight, outlineWidth, outlineColor, tooltip, map]);

  return null;
}
