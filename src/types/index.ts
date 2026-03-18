export interface Mountain {
  name: string;
  state: string;
  lat: number;
  lng: number;
  bbox: [number, number, number, number]; // [south, west, north, east]
  slug: string; // filename in public/trails/ (without .json)
  peakSlope?: number; // steepest 100m window across all trails (degrees)
}

export interface TrailPoint {
  lat: number;
  lng: number;
  elevation: number;
}

export interface TrailSegment {
  start: TrailPoint;
  end: TrailPoint;
  slopeAngle: number; // degrees
}

/** A section is a continuous run of connected segments (one OSM way or
 *  multiple perfectly-connected ways). Gaps between OSM ways become
 *  separate sections so the renderer doesn't draw false connecting lines. */
export type TrailSection = TrailSegment[];

export interface Trail {
  name: string;
  difficulty: string;
  sections: TrailSection[];
  avgSlope: number;
  maxSlope: number;
  peakSlope: number; // steepest sustained pitch (avg over best 100m window)
}

export interface MountainData {
  mountain: Mountain;
  trails: Trail[];
  fetchedAt: number;
}
