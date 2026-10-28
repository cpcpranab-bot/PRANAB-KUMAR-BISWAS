import React, { useEffect, useRef } from 'react';
import { GpsPoint } from '../../types';
import L from 'leaflet';

interface RunMapProps {
  path: GpsPoint[];
  currentPoint: GpsPoint | null;
  isTracking: boolean;
  className?: string;
  autoCenter?: boolean;
}

export const RunMap: React.FC<RunMapProps> = ({
  path,
  currentPoint,
  isTracking,
  className = 'h-64 sm:h-80 w-full',
  autoCenter = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const splitMarkersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center (San Francisco waterfront or first point)
    const initialLat = currentPoint ? currentPoint.lat : path.length > 0 ? path[0].lat : 37.7749;
    const initialLng = currentPoint ? currentPoint.lng : path.length > 0 ? path[0].lng : -122.4194;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      // High-contrast clean OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Add zoom control top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Draw / update polyline route
    const latLngs: [number, number][] = path.map((p) => [p.lat, p.lng]);
    if (polylineRef.current) {
      polylineRef.current.setLatLngs(latLngs);
    } else if (latLngs.length > 0) {
      polylineRef.current = L.polyline(latLngs, {
        color: '#0052FF',
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
    }

    // Update runner position marker
    if (currentPoint) {
      const runnerIcon = L.divIcon({
        className: 'custom-runner-icon',
        html: `
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; background: rgba(0, 82, 255, 0.25); border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 18px; height: 18px; background: #0052FF; border: 3px solid #FFFFFF; border-radius: 9999px; box-shadow: 0 4px 10px rgba(0, 82, 255, 0.5);"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      if (markerRef.current) {
        markerRef.current.setLatLng([currentPoint.lat, currentPoint.lng]);
        markerRef.current.setIcon(runnerIcon);
      } else {
        markerRef.current = L.marker([currentPoint.lat, currentPoint.lng], { icon: runnerIcon }).addTo(map);
      }

      if (autoCenter) {
        map.panTo([currentPoint.lat, currentPoint.lng], { animate: true, duration: 0.5 });
      }
    }

    // Cleanup markers if path was cleared
    if (path.length === 0 && polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    // Invalidate size to ensure crisp display after DOM changes
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

  }, [path, currentPoint, autoCenter]);

  // Handle map resizing
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* High-Contrast Sunlight Watermark overlay indicator */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-1.5 px-3 py-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full shadow-sm border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-800 dark:text-slate-200">
        <span className={`w-2 h-2 rounded-full ${isTracking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
        <span>{isTracking ? 'GPS High-Precision' : 'GPS Ready'}</span>
      </div>
    </div>
  );
};
