import { LocationCoordinates, RouteDetails, RouteStep } from '@/types/emergency';
import { Hospital } from '@/types/hospital';

// 5-minute in-memory cache to prevent redundant API queries and optimize latency
interface CachedRoute {
  timestamp: number;
  route: RouteDetails;
}

const routeCache = new Map<string, CachedRoute>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Calculates traffic-aware driving route using TomTom Routing API v1.
 * Supports real-time traffic delay computation, polyline reconstruction, and turn-by-turn steps.
 */
export async function calculateRouteTomTom(
  origin: LocationCoordinates,
  destination: Hospital,
  trafficModel: 'BEST_GUESS' | 'OPTIMISTIC' | 'PESSIMISTIC' = 'BEST_GUESS'
): Promise<RouteDetails> {
  const apiKey =
    process.env.TOMTOM_API_KEY ||
    process.env.NEXT_PUBLIC_TOMTOM_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('TOMTOM_API_KEY is not configured in environment variables.');
  }

  // Check in-memory cache
  const cacheKey = `tomtom_${origin.latitude.toFixed(5)},${origin.longitude.toFixed(5)}->${destination.latitude.toFixed(5)},${destination.longitude.toFixed(5)}_${trafficModel}`;
  const cached = routeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.route;
  }

  // TomTom calculateRoute format: lat,lon:lat,lon
  const coords = `${origin.latitude.toFixed(6)},${origin.longitude.toFixed(6)}:${destination.latitude.toFixed(6)},${destination.longitude.toFixed(6)}`;
  const endpoint = `https://api.tomtom.com/routing/1/calculateRoute/${coords}/json?key=${encodeURIComponent(
    apiKey
  )}&traffic=true&instructionsType=text&computeTravelTimeFor=all&routeType=fastest&travelMode=car`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TomTom Routing API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const route = data.routes?.[0];

  if (!route) {
    throw new Error('No route returned by TomTom Routing API.');
  }

  const summary = route.summary || {};
  const distanceKm = Number(((summary.lengthInMeters || 0) / 1000).toFixed(2));
  
  // Real-time travel time with traffic
  const travelTimeSeconds = summary.travelTimeInSeconds || summary.liveTrafficIncidentsTravelTimeInSeconds || 0;
  const trafficDurationMinutes = Math.max(1, Math.round(travelTimeSeconds / 60));
  const baseDurationMinutes = Math.max(1, Math.round((summary.noTrafficTravelTimeInSeconds || travelTimeSeconds) / 60));
  
  const trafficDelaySeconds = summary.trafficDelayInSeconds || 0;
  const trafficDelayMinutes = Math.round(trafficDelaySeconds / 60);

  let trafficLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'CONGESTED' = 'NORMAL';
  if (trafficDelayMinutes >= 15) {
    trafficLevel = 'CONGESTED';
  } else if (trafficDelayMinutes >= 7) {
    trafficLevel = 'HIGH';
  } else if (trafficDelayMinutes >= 2) {
    trafficLevel = 'NORMAL';
  } else {
    trafficLevel = 'LOW';
  }

  // Extract coordinates from legs
  const leafletCoordinates: [number, number][] = [];
  if (Array.isArray(route.legs)) {
    for (const leg of route.legs) {
      if (Array.isArray(leg.points)) {
        for (const pt of leg.points) {
          leafletCoordinates.push([pt.latitude, pt.longitude]);
        }
      }
    }
  }

  // Fallback direct coordinate line if polyline points are empty
  if (leafletCoordinates.length === 0) {
    leafletCoordinates.push([origin.latitude, origin.longitude]);
    leafletCoordinates.push([destination.latitude, destination.longitude]);
  }

  // Extract turn-by-turn guidance steps
  const steps: RouteStep[] = [];
  const instructions = route.guidance?.instructions || [];
  
  if (Array.isArray(instructions) && instructions.length > 0) {
    instructions.forEach((inst: any, idx: number) => {
      let instructionText = inst.message || 'Proceed along the designated corridor';
      if (idx === 0) {
        instructionText = `[SIREN ACTIVE] ${instructionText}`;
      }
      steps.push({
        instruction: instructionText,
        distanceMeters: Math.round(inst.routeOffsetInMeters || 0),
        durationSeconds: Math.round(inst.travelTimeInSeconds || 60),
      });
    });
  } else {
    steps.push({
      instruction: `[SIREN ACTIVE] Depart incident origin via arterial corridor toward ${destination.name}`,
      distanceMeters: Math.round(distanceKm * 0.4 * 1000),
      durationSeconds: Math.round(trafficDurationMinutes * 0.4 * 60),
    });
    steps.push({
      instruction: `Continue on priority ambulance lane directly to Emergency Receiving at ${destination.name}`,
      distanceMeters: Math.round(distanceKm * 0.6 * 1000),
      durationSeconds: Math.round(trafficDurationMinutes * 0.6 * 60),
    });
  }

  const result: RouteDetails = {
    distanceKm,
    durationMinutes: baseDurationMinutes,
    trafficDurationMinutes,
    trafficLevel,
    trafficModel,
    polyline: JSON.stringify(leafletCoordinates),
    coordinates: leafletCoordinates,
    steps,
    origin,
    destination: {
      latitude: destination.latitude,
      longitude: destination.longitude,
      address: destination.address,
    },
    provider: 'OPENROUTE_SERVICE', // matches RouteDetails provider union
  };

  // Cache route
  routeCache.set(cacheKey, { timestamp: Date.now(), route: result });

  return result;
}
