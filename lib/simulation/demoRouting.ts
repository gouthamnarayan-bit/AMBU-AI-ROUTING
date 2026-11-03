import { LocationCoordinates, RouteDetails, RouteStep } from '@/types/emergency';
import { Hospital } from '@/types/hospital';

/**
 * Calculates Haversine great-circle distance between two points in kilometers.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Generates an interpolated realistic GPS polyline connecting origin to destination
 * simulating urban road grid navigation.
 */
export function generateDemoPolyline(
  origin: LocationCoordinates,
  dest: LocationCoordinates
): [number, number][] {
  const steps = 8;
  const coords: [number, number][] = [];

  const latDiff = dest.latitude - origin.latitude;
  const lngDiff = dest.longitude - origin.longitude;

  coords.push([origin.latitude, origin.longitude]);

  // Intermediate realistic waypoints simulating street turns
  for (let i = 1; i < steps; i++) {
    const fraction = i / steps;
    // Add small realistic street-angle zig-zags
    const lateralJitter =
      Math.sin(fraction * Math.PI) * (i % 2 === 0 ? 0.0018 : -0.0018);
    const lat = origin.latitude + latDiff * fraction + lateralJitter * 0.5;
    const lng = origin.longitude + lngDiff * fraction + lateralJitter;
    coords.push([Math.round(lat * 100000) / 100000, Math.round(lng * 100000) / 100000]);
  }

  coords.push([dest.latitude, dest.longitude]);
  return coords;
}

/**
 * Generates step-by-step driving directions for the ambulance navigation view.
 */
export function generateDemoRouteSteps(
  originAddress: string,
  destinationName: string,
  distanceKm: number,
  travelTimeMinutes: number
): RouteStep[] {
  const stepDist1 = Math.round((distanceKm * 0.2) * 1000);
  const stepDist2 = Math.round((distanceKm * 0.5) * 1000);
  const stepDist3 = Math.round((distanceKm * 0.3) * 1000);

  const durationSecTotal = travelTimeMinutes * 60;

  return [
    {
      instruction: `Depart emergency scene at ${originAddress}. Engage priority siren and emergency beacon.`,
      distanceMeters: stepDist1,
      durationSeconds: Math.round(durationSecTotal * 0.25),
    },
    {
      instruction: `Merge onto primary arterial corridor towards ${destinationName}. Maintain clear lane.`,
      distanceMeters: stepDist2,
      durationSeconds: Math.round(durationSecTotal * 0.5),
    },
    {
      instruction: `Take hospital emergency access slip road directly to ${destinationName} Resuscitation Trauma Bay.`,
      distanceMeters: stepDist3,
      durationSeconds: Math.round(durationSecTotal * 0.25),
    },
  ];
}

/**
 * Generates complete RouteDetails for demo / fallback mode.
 */
export function calculateDemoRoute(
  origin: LocationCoordinates,
  hospital: Hospital,
  trafficModel: 'BEST_GUESS' | 'OPTIMISTIC' | 'PESSIMISTIC' = 'BEST_GUESS'
): RouteDetails {
  const directDistance = calculateHaversineDistanceKm(
    origin.latitude,
    origin.longitude,
    hospital.latitude,
    hospital.longitude
  );

  // Driving distance is typically 1.25x to 1.35x direct straight-line distance
  const drivingDistanceKm = Math.max(0.5, Math.round(directDistance * 1.3 * 10) / 10);

  // Base travel time assuming 35 km/h urban ambulance speed with priority signals
  let baseTravelTime = Math.max(3, Math.round((drivingDistanceKm / 35) * 60));

  // Traffic multiplier
  let trafficMultiplier = 1.0;
  if (hospital.trafficLevel === 'LOW') trafficMultiplier = 0.85;
  else if (hospital.trafficLevel === 'HIGH') trafficMultiplier = 1.35;
  else if (hospital.trafficLevel === 'CONGESTED') trafficMultiplier = 1.65;

  if (trafficModel === 'OPTIMISTIC') trafficMultiplier *= 0.85;
  if (trafficModel === 'PESSIMISTIC') trafficMultiplier *= 1.25;

  const trafficDurationMinutes = Math.max(2, Math.round(baseTravelTime * trafficMultiplier));

  const destCoords: LocationCoordinates = {
    latitude: hospital.latitude,
    longitude: hospital.longitude,
    address: hospital.address,
  };

  const polylineCoords = generateDemoPolyline(origin, destCoords);
  const steps = generateDemoRouteSteps(
    origin.address || 'Emergency Patient Location',
    hospital.name,
    drivingDistanceKm,
    trafficDurationMinutes
  );

  return {
    distanceKm: drivingDistanceKm,
    durationMinutes: baseTravelTime,
    trafficDurationMinutes,
    trafficLevel: hospital.trafficLevel,
    trafficModel,
    polyline: JSON.stringify(polylineCoords),
    coordinates: polylineCoords,
    steps,
    origin,
    destination: destCoords,
    provider: 'DEMO_SIMULATION',
  };
}
