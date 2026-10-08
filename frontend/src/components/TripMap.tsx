import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Activity } from '@/types';

interface TripMapProps {
  activities: Activity[];
  destination: string;
  selectedActivityId?: string;
  onSelectActivity?: (id: string) => void;
}

const DESTINATION_FALLBACK_COORDS: Record<string, [number, number]> = {
  paris: [48.8566, 2.3522],
  tokyo: [35.6762, 139.6503],
  rome: [41.9028, 12.4964],
  london: [51.5074, -0.1278],
  barcelona: [41.3879, 2.1699],
  kyoto: [35.0116, 135.7681],
  newyork: [40.7128, -74.006],
  bali: [-8.4095, 115.1889],
};

function getCategoryColor(category?: string | null): string {
  switch ((category || '').toLowerCase()) {
    case 'food':
      return '#d97706'; // amber
    case 'culture':
      return '#7c3aed'; // violet
    case 'nature':
      return '#059669'; // emerald
    case 'nightlife':
      return '#9333ea'; // purple
    case 'shopping':
      return '#db2777'; // pink
    default:
      return '#2563eb'; // blue/indigo
  }
}

function createNumberedIcon(number: number, category?: string | null, isSelected?: boolean) {
  const color = getCategoryColor(category);
  const size = isSelected ? 34 : 28;

  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${color};
        color: white;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 12px;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
        transform: translate(-50%, -50%);
        cursor: pointer;
      ">
        ${number}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function TripMap({
  activities,
  destination,
  selectedActivityId,
  onSelectActivity,
}: TripMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check fallback center
    const destKey = destination.toLowerCase().replace(/[^a-z]/g, '');
    let defaultCenter: [number, number] = [48.8566, 2.3522];
    for (const [key, coords] of Object.entries(DESTINATION_FALLBACK_COORDS)) {
      if (destKey.includes(key)) {
        defaultCenter = coords;
        break;
      }
    }

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Update Markers & Polylines whenever activities change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const mappedActivities = activities.filter(
      (act) =>
        act.latitude != null &&
        act.longitude != null &&
        !isNaN(act.latitude) &&
        !isNaN(act.longitude)
    );

    const latLngs: L.LatLngExpression[] = [];

    mappedActivities.forEach((act, index) => {
      const isSelected = act.id === selectedActivityId;
      const lat = act.latitude as number;
      const lng = act.longitude as number;
      latLngs.push([lat, lng]);

      const icon = createNumberedIcon(index + 1, act.category, isSelected);
      const marker = L.marker([lat, lng], { icon });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 space-y-1 min-w-[200px] text-xs font-sans';
      popupContent.innerHTML = `
        <div style="display:flex; justify-content:space-between; color:#64748b; font-weight:600; font-size:11px;">
          <span>${act.time}</span>
          <span style="text-transform:capitalize; background:#f1f5f9; padding:2px 6px; border-radius:4px;">
            ${act.category || 'Sightseeing'}
          </span>
        </div>
        <div style="font-weight:700; font-size:13px; color:#0f172a; margin-top:3px;">
          ${act.title}
        </div>
        <div style="color:#475569; font-size:11px; line-height:1.4; margin-top:2px;">
          ${act.description || ''}
        </div>
        <div style="margin-top:6px; padding-top:6px; border-top:1px solid #f1f5f9;">
          <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" rel="noopener noreferrer" style="color:#2563eb; font-weight:600; text-decoration:none;">
            📍 Directions on Google Maps →
          </a>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectActivity) onSelectActivity(act.id);
      });

      marker.addTo(layerGroup);
    });

    // Draw route polyline
    if (latLngs.length > 1) {
      const polyline = L.polyline(latLngs, {
        color: '#4f46e5',
        weight: 3,
        opacity: 0.75,
        dashArray: '6, 8',
      });
      polyline.addTo(layerGroup);
    }

    // Auto-fit bounds
    if (latLngs.length === 1) {
      map.setView(latLngs[0], 14, { animate: true });
    } else if (latLngs.length > 1) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [activities, selectedActivityId, onSelectActivity]);

  return (
    <div className="w-full h-full min-h-[400px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm relative z-0">
      <div ref={mapContainerRef} className="w-full h-full min-h-[400px]" />
    </div>
  );
}
