'use client';

import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ParcelStatus, GeoJSONGeometry } from '@/lib/types';

interface ProjectMapProps {
  boundary?: GeoJSONGeometry;
  parcels?: Array<{ id: string; ulpin: string; geometry?: GeoJSONGeometry; overall_status: ParcelStatus }>;
  onParcelClick?: (id: string) => void;
  interactive?: boolean;
}

const statusColors: Record<string, string> = {
  PENDING: '#eab308',     // yellow-500
  IN_PROGRESS: '#f97316', // orange-500
  COMPLETED: '#22c55e',   // green-500
};

export default function ProjectMap({ boundary, parcels = [], onParcelClick, interactive = true }: ProjectMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [78.9629, 20.5937], // Center of India
      zoom: 4,
      interactive: interactive,
    });
    mapRef.current = map;

    map.on('load', () => {
      if (boundary) {
        map.addSource('boundary', {
          type: 'geojson',
          data: boundary as unknown as GeoJSON.GeoJSON,
        });

        map.addLayer({
          id: 'boundary-fill',
          type: 'fill',
          source: 'boundary',
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.15,
          },
        });

        map.addLayer({
          id: 'boundary-line',
          type: 'line',
          source: 'boundary',
          paint: {
            'line-color': '#1e40af',
            'line-width': 2,
          },
        });

        // Fit bounds to boundary
        try {
          const bounds = new maplibregl.LngLatBounds();
          const coords = boundary.coordinates[0];
          if (Array.isArray(coords)) {
            (coords as [number, number][]).forEach((coord) => bounds.extend(coord));
            map.fitBounds(bounds, { padding: 40 });
          }
        } catch (e) {
          console.error("Error fitting bounds:", e);
        }
      }

      const features = parcels.filter(p => p.geometry).map(p => ({
        type: 'Feature' as const,
        properties: {
          id: p.id,
          ulpin: p.ulpin,
          status: p.overall_status,
          color: statusColors[p.overall_status] || '#94a3b8'
        },
        geometry: p.geometry as unknown as GeoJSON.Geometry
      }));

      if (features.length > 0) {
        map.addSource('parcels', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: features
          }
        });

        map.addLayer({
          id: 'parcels-fill',
          type: 'fill',
          source: 'parcels',
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.6,
          }
        });

        map.addLayer({
          id: 'parcels-line',
          type: 'line',
          source: 'parcels',
          paint: {
            'line-color': '#000000',
            'line-width': 1.5,
            'line-opacity': 0.7
          }
        });

        if (interactive) {
          map.on('click', 'parcels-fill', (e) => {
            if (e.features && e.features.length > 0) {
              const feature = e.features[0];
              const props = feature.properties as { id: string; ulpin: string; status: string };

              new maplibregl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`<strong>ULPIN:</strong> ${props.ulpin}<br/><strong>Status:</strong> ${props.status}`)
                .addTo(map);

              if (onParcelClick && props.id) {
                onParcelClick(props.id);
              }
            }
          });

          map.on('mouseenter', 'parcels-fill', () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', 'parcels-fill', () => {
            map.getCanvas().style.cursor = '';
          });
        }
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [boundary, parcels, interactive, onParcelClick]);

  return <div ref={mapContainer} className="w-full h-[420px] rounded-md shadow-sm border border-gray-200" />;
}
