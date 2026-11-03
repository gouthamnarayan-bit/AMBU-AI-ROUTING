'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmergencyMap } from '@/components/map/EmergencyMap';
import { DEMO_HOSPITALS, DEMO_CENTER_LOCATION } from '@/lib/simulation/demoData';
import { calculateDemoRoute } from '@/lib/simulation/demoRouting';
import { Hospital } from '@/types/hospital';
import { LocationCoordinates, RouteDetails } from '@/types/emergency';
import { MapPin, Navigation, Zap, Compass, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export default function LiveMapPage() {
  const [userLocation, setUserLocation] = useState<LocationCoordinates>(DEMO_CENTER_LOCATION);
  const [locationSource, setLocationSource] = useState<'GPS' | 'DEFAULT'>('DEFAULT');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [hospitals, setHospitals] = useState<Hospital[]>(DEMO_HOSPITALS);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(DEMO_HOSPITALS[0].id);
  const [filterSpecialty, setFilterSpecialty] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [apiMode, setApiMode] = useState<'DEMO' | 'REAL_API'>('DEMO');

  const selectedHospital =
    hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0] || DEMO_HOSPITALS[0];

  const [activeRoute, setActiveRoute] = useState<RouteDetails>(() =>
    calculateDemoRoute(DEMO_CENTER_LOCATION, selectedHospital, 'BEST_GUESS')
  );

  // Function to acquire user's real GPS position and reverse-geocode address
  const requestUserLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        let detectedAddress = `Live GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        // Reverse-geocode to get real street address via our backend API
        try {
          const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.address) {
              detectedAddress = data.address;
            }
          }
        } catch (e) {
          console.warn('Reverse geocoding error:', e);
        }

        const newLoc: LocationCoordinates = {
          latitude: lat,
          longitude: lng,
          address: detectedAddress,
          source: 'GPS',
        };

        setUserLocation(newLoc);
        setLocationSource('GPS');
        setIsLocating(false);

        // Fetch real nearby hospitals around the user's GPS coordinates
        try {
          const hospRes = await fetch(`/api/hospitals?lat=${lat}&lng=${lng}&radius=25`);
          if (hospRes.ok) {
            const hospData = await hospRes.json();
            if (hospData.success && Array.isArray(hospData.data) && hospData.data.length > 0) {
              setHospitals(hospData.data);
              setSelectedHospitalId(hospData.data[0].id);
              setApiMode(hospData.mode || 'REAL_API');
            }
          }
        } catch (err) {
          console.warn('Failed to query hospitals for live coordinates:', err);
        }
      },
      (err) => {
        console.warn('Geolocation access failed:', err.message);
        setIsLocating(false);
        setLocationError(
          err.code === 1
            ? 'Location access was denied. Click "Detect My Location" to enable.'
            : `Location unavailable (${err.message}). Showing reference map.`
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }, []);

  // Request browser location immediately on page load
  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  // Fetch live route whenever origin or selected hospital changes
  useEffect(() => {
    if (!selectedHospital) return;
    let isCancelled = false;

    async function fetchLiveRoute() {
      try {
        const response = await fetch('/api/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: userLocation,
            destination: selectedHospital,
            trafficModel: 'BEST_GUESS',
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.success && resData.data && !isCancelled) {
            setActiveRoute(resData.data);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch live route from API, maintaining fallback:', err);
      }

      if (!isCancelled) {
        setActiveRoute(calculateDemoRoute(userLocation, selectedHospital, 'BEST_GUESS'));
      }
    }

    fetchLiveRoute();

    return () => {
      isCancelled = true;
    };
  }, [selectedHospitalId, userLocation]);

  const filteredHospitals = hospitals.filter((h) => {
    if (filterStatus !== 'ALL' && h.availabilityStatus !== filterStatus) return false;
    if (filterSpecialty === 'CARDIO' && !h.cardiologyAvailable) return false;
    if (filterSpecialty === 'NEURO' && !h.neurologyAvailable) return false;
    if (filterSpecialty === 'TRAUMA' && !h.traumaCenterAvailable) return false;
    if (filterSpecialty === 'ICU' && h.icuBedsAvailable <= 0) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Location Status Alert Bar */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                locationSource === 'GPS'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              <Compass className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">
                  {locationSource === 'GPS'
                    ? '📍 Live GPS Location Active'
                    : '📍 Default Reference Location'}
                </span>
                {locationSource === 'GPS' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Exact GPS Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    <AlertCircle className="w-3 h-3" /> Bengaluru Simulation
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate max-w-xl">
                {userLocation.address} ({userLocation.latitude.toFixed(4)},{' '}
                {userLocation.longitude.toFixed(4)})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={requestUserLocation}
              disabled={isLocating}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-blue-500/40 shadow transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Detecting GPS...' : 'Detect My Location'}</span>
            </button>
          </div>
        </div>

        {locationError && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-2.5 rounded-lg text-xs flex items-center justify-between">
            <span>{locationError}</span>
            <button
              onClick={requestUserLocation}
              className="underline font-semibold hover:text-white ml-2"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Header and Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
                <MapPin className="w-6 h-6 text-rose-500" />
                <span>Live Emergency GIS & Telemetry Map</span>
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <Zap className="w-3 h-3 text-emerald-400" />{' '}
                {apiMode === 'REAL_API' ? 'TomTom Live Engine' : 'Simulation Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live tracking of ambulance units, hospital readiness, bed counts, and route congestion
              around your location.
            </p>
          </div>

          {/* Quick Filters and Destination Selector */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-blue-500/40 rounded-lg px-2.5 py-1">
              <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-300 font-semibold hidden sm:inline">Destination:</span>
              <select
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(e.target.value)}
                className="bg-transparent text-emerald-300 font-bold focus:outline-none max-w-[220px] truncate cursor-pointer"
              >
                {filteredHospitals.map((h) => (
                  <option key={h.id} value={h.id} className="bg-slate-900 text-slate-100">
                    {h.name} ({h.travelTimeMinutes} min • {h.distanceKm} km)
                  </option>
                ))}
              </select>
            </div>

            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Specialties</option>
              <option value="CARDIO">Cardiology Ready</option>
              <option value="NEURO">Neurology / Stroke</option>
              <option value="TRAUMA">Trauma Center</option>
              <option value="ICU">Has Open ICU Beds</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available Only</option>
              <option value="LIMITED">Limited Only</option>
            </select>
          </div>
        </div>

        {/* Full-size Map Container */}
        <EmergencyMap
          origin={userLocation}
          hospitals={filteredHospitals}
          selectedHospitalId={selectedHospitalId}
          onSelectHospital={(id) => setSelectedHospitalId(id)}
          route={activeRoute}
          height="580px"
        />

        {/* Active Route Telemetry & Waypoints Queue */}
        {selectedHospital && activeRoute && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                    Live Route Active
                  </span>
                  <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                    {activeRoute.provider?.includes('TomTom')
                      ? 'TomTom Traffic Engine'
                      : activeRoute.provider}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Direct Route to {selectedHospital.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Origin: {userLocation.address} → Destination: {selectedHospital.address}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/60 text-center">
                  <div className="text-[10px] text-slate-400">Total Distance</div>
                  <div className="text-base font-bold text-slate-100">{activeRoute.distanceKm} km</div>
                </div>
                <div className="bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/60 text-center">
                  <div className="text-[10px] text-slate-400">Traffic ETA</div>
                  <div className="text-base font-bold text-emerald-400">
                    {activeRoute.trafficDurationMinutes || activeRoute.durationMinutes} min
                  </div>
                </div>
              </div>
            </div>

            {/* Turn-by-Turn Waypoint Instructions */}
            {activeRoute.steps && activeRoute.steps.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Turn-by-Turn Navigation Steps ({activeRoute.steps.length} Waypoints)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {activeRoute.steps.slice(0, 8).map((st, i) => (
                    <div
                      key={i}
                      className="bg-slate-800/60 border border-slate-700/60 p-2.5 rounded-lg flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-400 text-blue-300 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-200 font-medium leading-snug">{st.instruction}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {st.distanceMeters} m • ~{Math.max(1, Math.round(st.durationSeconds / 60))} min
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
