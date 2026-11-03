'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Hospital } from '@/types/hospital';
import { LocationCoordinates, RouteDetails } from '@/types/emergency';
import { TOPSISHospitalScore } from '@/types/decision';
import { StatusBadge } from '../common/StatusBadge';
import {
  MapPin,
  Navigation,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  Layers,
  Sparkles,
  ExternalLink,
  Siren,
} from 'lucide-react';

interface EmergencyMapProps {
  origin: LocationCoordinates;
  hospitals: Hospital[];
  selectedHospitalId?: string;
  onSelectHospital?: (hospitalId: string) => void;
  route?: RouteDetails | null;
  hospitalScores?: TOPSISHospitalScore[];
  height?: string;
  ambulanceProgress?: number;
  isNavigating?: boolean;
}

export const EmergencyMap: React.FC<EmergencyMapProps> = ({
  origin,
  hospitals,
  selectedHospitalId,
  onSelectHospital,
  route,
  hospitalScores,
  height = '500px',
  ambulanceProgress = 0,
  isNavigating = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const ambulanceMarkerRef = useRef<any>(null);

  const [activeHospital, setActiveHospital] = useState<Hospital | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update active hospital when selectedHospitalId changes
  useEffect(() => {
    if (selectedHospitalId) {
      const found = hospitals.find((h) => h.id === selectedHospitalId);
      if (found) setActiveHospital(found);
    } else if (hospitals.length > 0 && !activeHospital) {
      setActiveHospital(hospitals[0]);
    }
  }, [selectedHospitalId, hospitals]);

  // Smoothly move the ambulance along the route during live navigation or reset
  useEffect(() => {
    if (!route || !route.coordinates || route.coordinates.length < 2) return;
    if (!ambulanceMarkerRef.current || !mapInstanceRef.current) return;

    if (!isNavigating) {
      if (ambulanceProgress === 0) {
        const startCoord = route.coordinates[0];
        if (startCoord) {
          ambulanceMarkerRef.current.setLatLng(startCoord);
        }
      }
      return;
    }

    const progress = Math.max(0, Math.min(100, ambulanceProgress));
    const pointIdx = Math.min(
      route.coordinates.length - 1,
      Math.floor((progress / 100) * (route.coordinates.length - 1))
    );
    const coord = route.coordinates[pointIdx];
    if (coord) {
      ambulanceMarkerRef.current.setLatLng(coord);
      // Smoothly pan map to follow the ambulance
      mapInstanceRef.current.panTo(coord, { animate: true, duration: 0.6 });
    }
  }, [ambulanceProgress, isNavigating, route]);

  // Leaflet map initialization
  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return;

    let L: any;
    let map: any;

    const initMap = async () => {
      L = (await import('leaflet')).default;

      // Fix default marker icon issues in Webpack/Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current && mapContainerRef.current) {
        map = L.map(mapContainerRef.current, {
          center: [origin.latitude, origin.longitude],
          zoom: 13,
          zoomControl: false,
        });

        // Watermark-free basemap tiles (OpenStreetMap, Esri, and TomTom Live)
        const tomtomKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;

        const osmLayer = L.tileLayer(
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }
        );

        const esriLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: '&copy; Esri &mdash; Street Navigation Map',
            maxZoom: 19,
          }
        );

        // Add crystal-clear OpenStreetMap as default clean basemap
        osmLayer.addTo(map);

        const baseMaps: Record<string, any> = {
          '🗺️ OpenStreetMap': osmLayer,
          '🧭 Esri Navigation': esriLayer,
        };

        if (tomtomKey) {
          baseMaps['🚗 TomTom Live'] = L.tileLayer(
            `https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${encodeURIComponent(tomtomKey)}`,
            {
              attribution: '&copy; TomTom Live Maps',
              maxZoom: 22,
            }
          );
        }

        L.control.layers(baseMaps, undefined, { position: 'bottomleft' }).addTo(map);
        L.control.zoom({ position: 'bottomright' }).addTo(map);
        mapInstanceRef.current = map;
      } else {
        map = mapInstanceRef.current;
      }

      // Clear existing markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      ambulanceMarkerRef.current = null;

      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }

      // 1. Patient / Emergency Incident Marker (Red Beacon)
      const originIcon = L.divIcon({
        className: 'origin-marker-container',
        html: `
          <div style="
            position: relative;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="
              position: absolute;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              background: #ef4444;
              opacity: 0.4;
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></span>
            <div style="
              width: 22px;
              height: 22px;
              border-radius: 50%;
              background: #dc2626;
              border: 2px solid white;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            ">
              📍
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const originMarker = L.marker([origin.latitude, origin.longitude], {
        icon: originIcon,
      })
        .addTo(map)
        .bindPopup(
          `<strong>Emergency Incident Scene</strong><br/>${
            origin.address || 'Patient Location'
          }`
        );
      markersRef.current.push(originMarker);

      // 1b. Ambulance Unit Marker (Emergency Vehicle with siren pulse)
      const ambulanceIcon = L.divIcon({
        className: 'ambulance-marker-container',
        html: `
          <div style="
            position: relative;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="
              position: absolute;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              background: #3b82f6;
              opacity: 0.5;
              animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></span>
            <div style="
              width: 30px;
              height: 30px;
              border-radius: 50%;
              background: #1e3a8a;
              border: 2px solid #60a5fa;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
            ">
              🚑
            </div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      const initialAmbulanceCoord =
        route?.coordinates && route.coordinates.length > 0
          ? route.coordinates[0]
          : [origin.latitude, origin.longitude];

      const ambMarker = L.marker(initialAmbulanceCoord, {
        icon: ambulanceIcon,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup(
          `<strong>Ambulance Unit AMB-01</strong><br/>Priority Emergency Response Vehicle`
        );

      ambulanceMarkerRef.current = ambMarker;
      markersRef.current.push(ambMarker);

      // 2. Hospital Markers
      const bounds = L.latLngBounds([
        [origin.latitude, origin.longitude],
      ]);

      hospitals.forEach((h) => {
        bounds.extend([h.latitude, h.longitude]);
        const isSelected = h.id === selectedHospitalId;
        const score = hospitalScores?.find((s) => s.hospitalId === h.id);
        const isEligible = score ? score.isEligible : h.emergencyDepartmentAvailable;

        // Custom marker color
        const bgColor = isSelected
          ? '#10b981' // Green for chosen #1
          : isEligible
          ? '#3b82f6' // Blue for eligible
          : '#64748b'; // Gray for ineligible

        const borderColor = isSelected ? '#ffffff' : '#e2e8f0';
        const markerSize = isSelected ? 36 : 28;

        const hospIcon = L.divIcon({
          className: 'hospital-marker',
          html: `
            <div style="
              width: ${markerSize}px;
              height: ${markerSize}px;
              border-radius: 8px;
              background: ${bgColor};
              border: ${isSelected ? '3px' : '2px'} solid ${borderColor};
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 13px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.35);
              cursor: pointer;
              transition: transform 0.2s;
            ">
              ${isSelected ? '★' : 'H'}
            </div>
          `,
          iconSize: [markerSize, markerSize],
          iconAnchor: [markerSize / 2, markerSize / 2],
        });

        const marker = L.marker([h.latitude, h.longitude], {
          icon: hospIcon,
        }).addTo(map);

        marker.on('click', () => {
          setActiveHospital(h);
          if (onSelectHospital) onSelectHospital(h.id);
        });

        marker.bindTooltip(
          `<strong>${h.name}</strong><br/>${h.travelTimeMinutes} mins • ${h.distanceKm} km`,
          { direction: 'top', offset: [0, -14] }
        );

        markersRef.current.push(marker);
      });

      // 3. Recommended Route Polyline (Highlighted Fast & Easy Path)
      if (route && route.coordinates && route.coordinates.length > 0) {
        const isLive = route.provider?.includes('TomTom') || route.provider === 'OPENROUTE_SERVICE';
        const polyline = L.polyline(route.coordinates, {
          color: isLive ? '#10b981' : '#2563eb', // Emerald green for live route
          weight: 6,
          opacity: 0.9,
          lineJoin: 'round',
        }).addTo(map);

        const routeDuration = route.trafficDurationMinutes || route.durationMinutes || 0;
        const providerLabel = route.provider?.includes('TomTom')
          ? 'TomTom Traffic-Aware Route'
          : route.provider === 'OPENROUTE_SERVICE'
          ? 'OpenRouteService Route'
          : 'Recommended Emergency Route';

        polyline.bindTooltip(
          `<strong>${providerLabel}</strong><br/>${route.distanceKm} km • ${routeDuration} mins transit`,
          { sticky: true }
        );

        polylineRef.current = polyline;
      }

      // Fit map to show route if available, otherwise fit all candidate hospitals
      if (route && route.coordinates && route.coordinates.length > 0) {
        const routeBounds = L.latLngBounds(route.coordinates);
        map.fitBounds(routeBounds, { padding: [50, 50], maxZoom: 15 });
      } else {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    };

    initMap();

    return () => {
      // clean up on unmount if needed
    };
  }, [isClient, origin, hospitals, selectedHospitalId, route]);

  const activeScore = activeHospital
    ? hospitalScores?.find((s) => s.hospitalId === activeHospital.id)
    : null;

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl flex flex-col lg:flex-row"
      style={{ minHeight: height }}
    >
      {/* Interactive Map View */}
      <div className="flex-1 relative w-full h-[380px] lg:h-auto min-h-[380px]">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Quick Legend */}
        <div className="absolute top-3 left-3 z-20 bg-slate-900/90 backdrop-blur border border-slate-700/80 px-3 py-2 rounded-lg text-xs flex flex-wrap items-center gap-3 shadow-lg">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block animate-pulse" />
            <span>Ambulance Unit</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Emergency Scene</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
            <span>Selected (Rank #1)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" />
            <span>Eligible</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded bg-slate-500 inline-block" />
            <span>Ineligible</span>
          </div>
        </div>
      </div>

      {/* Side Detail Panel */}
      <div className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 flex flex-col justify-between overflow-y-auto">
        {activeHospital ? (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Inspecting Facility
                </span>
                {activeHospital.id === selectedHospitalId && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> BEST MATCH
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-100 text-base leading-snug">
                {activeHospital.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>{activeHospital.address}</span>
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-400" />
                  <span>Traffic ETA</span>
                </div>
                <div className="text-lg font-bold text-slate-100 mt-0.5">
                  {activeHospital.travelTimeMinutes}{' '}
                  <span className="text-xs font-normal text-slate-400">min</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {activeHospital.distanceKm} km dist
                </div>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span>ICU Beds</span>
                </div>
                <div className="text-lg font-bold text-slate-100 mt-0.5">
                  {activeHospital.icuBedsAvailable}{' '}
                  <span className="text-xs font-normal text-slate-400">open</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Cap: {activeHospital.hospitalCapacityPercent}%
                </div>
              </div>
            </div>

            {/* Status & Eligibility */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Operational Status</span>
                <StatusBadge status={activeHospital.availabilityStatus} />
              </div>

              {activeScore && (
                <>
                  <div className="flex items-center justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Eligibility</span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        activeScore.isEligible ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {activeScore.isEligible ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" /> Eligible
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> Ineligible
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">TOPSIS Closeness Score (C*)</span>
                    <span className="font-mono font-bold text-blue-400 text-sm">
                      {activeScore.topsisScore.toFixed(3)} (Rank #{activeScore.rank})
                    </span>
                  </div>
                </>
              )}

              {/* Clinical Specialties */}
              <div className="pt-2">
                <div className="text-[11px] font-semibold text-slate-300 mb-1.5">
                  Available Clinical Specialties:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeHospital.cardiologyAvailable && (
                    <span className="px-2 py-0.5 bg-rose-950/60 text-rose-300 border border-rose-500/30 rounded text-[10px]">
                      Cardiology
                    </span>
                  )}
                  {activeHospital.neurologyAvailable && (
                    <span className="px-2 py-0.5 bg-purple-950/60 text-purple-300 border border-purple-500/30 rounded text-[10px]">
                      Neurology
                    </span>
                  )}
                  {activeHospital.traumaCenterAvailable && (
                    <span className="px-2 py-0.5 bg-amber-950/60 text-amber-300 border border-amber-500/30 rounded text-[10px]">
                      Trauma Center
                    </span>
                  )}
                  {activeHospital.orthopedicAvailable && (
                    <span className="px-2 py-0.5 bg-blue-950/60 text-blue-300 border border-blue-500/30 rounded text-[10px]">
                      Orthopedics
                    </span>
                  )}
                  {activeHospital.ventilatorAvailable && (
                    <span className="px-2 py-0.5 bg-teal-950/60 text-teal-300 border border-teal-500/30 rounded text-[10px]">
                      Ventilator
                    </span>
                  )}
                </div>
              </div>

              {activeScore && !activeScore.isEligible && activeScore.exclusionReasons && (
                <div className="bg-rose-950/40 border border-rose-500/30 p-2.5 rounded-lg text-rose-300 text-[11px] mt-2">
                  <div className="font-semibold text-rose-200 mb-0.5">Exclusion Rationale:</div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {activeScore.exclusionReasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Selection & Route Button */}
            {onSelectHospital && (
              <button
                onClick={() => onSelectHospital(activeHospital.id)}
                className={`w-full mt-3 py-2.5 text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 ${
                  activeHospital.id === selectedHospitalId
                    ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/50'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/30 active:scale-95'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>
                  {activeHospital.id === selectedHospitalId
                    ? '✓ Showing Route to this Hospital'
                    : `🗺️ Get Route to ${activeHospital.name}`}
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-xs">
            Select a hospital marker on the map to view real-time clinical telemetry.
          </div>
        )}

        <div className="text-[10px] text-slate-500 pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                route?.provider === 'OPENROUTE_SERVICE' ? 'bg-emerald-400' : 'bg-blue-400'
              } animate-pulse`}
            />
            <span>
              Routing:{' '}
              {route?.provider === 'OPENROUTE_SERVICE'
                ? 'OpenRouteService (Live ORS Fastest Route)'
                : route?.provider === 'GOOGLE_ROUTES'
                ? 'Google Routes API (v2)'
                : 'Demo Simulation'}
            </span>
          </span>
          <span className="font-mono">
            {route?.distanceKm ? `${route.distanceKm} km • ` : ''}
            Traffic: {route?.trafficModel || 'BEST_GUESS'}
          </span>
        </div>
      </div>
    </div>
  );
};
