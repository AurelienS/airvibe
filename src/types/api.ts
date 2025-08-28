export type FlightListItemDTO = {
  id: string;
  dateIso: string;
  processed: boolean;
  filename: string;
  location: string | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  altitudeMaxMeters: number | null;
};

export type ListFlightsResponse = {
  items: Array<FlightListItemDTO>;
  nextCursor: string | null;
  total: number;
};


