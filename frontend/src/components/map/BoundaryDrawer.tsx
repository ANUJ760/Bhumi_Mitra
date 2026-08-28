'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Textarea } from '@/components/ui/textarea';
import { GeoJSONGeometry } from '@/lib/types';

interface BoundaryDrawerProps {
  onChange: (geojson: GeoJSONGeometry | null) => void;
}

export default function BoundaryDrawer({ onChange }: BoundaryDrawerProps) {
  const [geoJsonInput, setGeoJsonInput] = useState('');
  const [error, setError] = useState('');
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [78.9629, 20.5937],
      zoom: 4,
    });
    mapRef.current = map;

    map.on('load', () => {
      map.addSource('draw-layer', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.addLayer({
        id: 'draw-fill',
        type: 'fill',
        source: 'draw-layer',
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.3,
        }
      });

      map.addLayer({
        id: 'draw-line',
        type: 'line',
        source: 'draw-layer',
        paint: {
          'line-color': '#1e40af',
          'line-width': 2,
        }
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const updateMap = (geom: GeoJSONGeometry | null) => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('draw-layer') as maplibregl.GeoJSONSource;
    if (source) {
      if (geom) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: geom as unknown as GeoJSON.Geometry
        });

        try {
          const bounds = new maplibregl.LngLatBounds();
          const coords = geom.coordinates[0];
          if (Array.isArray(coords)) {
            (coords as [number, number][]).forEach((coord) => bounds.extend(coord));
            map.fitBounds(bounds, { padding: 40 });
          }
        } catch {
          // ignore bounds error
        }
      } else {
        source.setData({ type: 'FeatureCollection', features: [] });
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setGeoJsonInput(val);
    setError('');

    if (!val.trim()) {
      updateMap(null);
      onChange(null);
      return;
    }

    try {
      const parsed = JSON.parse(val);
      if (parsed.type === 'Polygon' || parsed.type === 'MultiPolygon') {
        updateMap(parsed);
        onChange(parsed);
      } else if (parsed.type === 'Feature' && (parsed.geometry?.type === 'Polygon' || parsed.geometry?.type === 'MultiPolygon')) {
        updateMap(parsed.geometry);
        onChange(parsed.geometry);
      } else {
        setError('Must be a GeoJSON Polygon, MultiPolygon or Feature with Polygon geometry.');
      }
    } catch {
      setError('Invalid JSON syntax');
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-500">
        Paste a GeoJSON Polygon below to preview boundary on the map.
      </div>
      <Textarea
        value={geoJsonInput}
        onChange={handleInputChange}
        placeholder='{"type": "Polygon", "coordinates": [[[73.85, 18.52], [73.86, 18.52], [73.86, 18.53], [73.85, 18.53], [73.85, 18.52]]]}'
        className="font-mono text-xs h-28"
      />
      {error && <div className="text-red-500 text-xs">{error}</div>}
      <div ref={mapContainer} className="w-full h-[260px] rounded-md border border-gray-200" />
    </div>
  );
}
