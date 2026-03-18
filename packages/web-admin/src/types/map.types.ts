export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface HeatmapPoint extends Coordinate {
  weight: number;
}

export interface Driver {
  driverId: string;
  name: string;
  status: string;
  lat: number;
  lng: number;
  heading?: number;
  carModel: string;
  updatedAt?: string;
}
