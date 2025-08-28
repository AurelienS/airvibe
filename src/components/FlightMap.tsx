'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type LatLng = { lat: number; lon: number };

export function FlightMap({ points }: { points: Array<LatLng> }) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;
    const map = L.map(mapRef.current, { zoomControl: true });
    leafletRef.current = map;
    // Topographic base layer (OpenTopoMap)
    L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)'
    }).addTo(map);
    // Hillshade overlay for better relief perception (SRTM)
    L.tileLayer('https://tiles.wmflabs.org/hillshading/{z}/{x}/{y}.png', {
      attribution: 'Hillshade: SRTM',
      opacity: 0.4
    }).addTo(map);
  }, []);

  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (!points || points.length === 0) return;

    const latlngs = points.map(p => L.latLng(p.lat, p.lon));
    const poly = L.polyline(latlngs, { color: '#2563eb', weight: 3 });
    layerRef.current = poly;
    poly.addTo(map);
    map.fitBounds(poly.getBounds(), { padding: [20, 20] });
  }, [points]);

  return (
    <div ref={mapRef} className="w-full h-64 rounded-md overflow-hidden border" />
  );
}


