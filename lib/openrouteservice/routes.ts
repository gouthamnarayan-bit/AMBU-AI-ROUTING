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
 * Calculates the fastest and easiest emergency driving route using the OpenRouteService (ORS) API.
 * Uses 'preference: fastest' to direct ambulances via major arterial corridors and highways.
 */
export async function calculateRouteOpenRouteService(
  origin: LocationCoordinates,
  destination: Hospital,
  trafficModel: 'BEST_GUESS' | 'OPTIMISTIC' | 'PESSIMISTIC' = 'BEST_GUESS'
): Promise<RouteDetails> {
  const apiKey =
    process.env.OPENROUTE_SERVICE_API_KEY ||
    process.env.NEXT_PUBLIC_OPENROUTE_SERVICE_API_KEY ||
    process.env.ORS_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('OPENROUTE_SERVICE_API_KEY is not configured in environment variables.');
  }

  // Check in-memory cache
  const cacheKey = `${origin.latitude.toFixed(5)},${origin.longitude.toFixed(5)}->${destination.latitude.toFixed(5)},${destination.longitude.toFixed(5)}_${trafficModel}`;
  const cached = routeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.route;
  }

  const endpoint = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

  // ORS accepts coordinates as [longitude, latitude]
  const requestBody = {
    coordinates: [
      [origin.longitude, origin.latitude],
      [destination.longitude, destination.latitude],
    ],
    preference: 'fastest', // Directs ambulance along highest-capacity, fastest corridors
    instructions: true,
    instructions_format: 'text',
    elevation: false,
    units: 'km',
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': apiKey.trim(),
      'Content-Type': 'application/json',
      'Accept': 'application/json, application/geo+json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouteService Directions API error (${response.status}): ${errorText}`);
  }

  const geoJson = await response.json();
  const feature = geoJson.features?.[0];

  if (!feature || !feature.properties || !feature.geometry) {
    throw new Error('OpenRouteService returned invalid or empty route geometry.');
  }

  const summary = feature.properties.summary;
  // Summary distance is in meters from ORS geojson
  const distanceKm = Math.max(0.1, Math.round(((summary.distance || 0) / 1000) * 10) / 10);
  const baseDurationSeconds = summary.duration || 60;
  const baseDurationMinutes = Math.max(1, Math.round(baseDurationSeconds / 60));

  // Traffic / Emergency priority adjustment
  let trafficMultiplier = 0.95; // Ambulance emergency priority adjustment
  if (destination.trafficLevel === 'LOW') trafficMultiplier = 0.85;
  else if (destination.trafficLevel === 'HIGH') trafficMultiplier = 1.25;
  else if (destination.trafficLevel === 'CONGESTED') trafficMultiplier = 1.5;

  if (trafficModel === 'OPTIMISTIC') trafficMultiplier *= 0.85;
  if (trafficModel === 'PESSIMISTIC') trafficMultiplier *= 1.2;

  const trafficDurationMinutes = Math.max(1, Math.round(baseDurationMinutes * trafficMultiplier));

  // Convert ORS geometry coordinates [lon, lat] -> Leaflet expected [lat, lon]
  const leafletCoordinates: [number, number][] = (feature.geometry.coordinates || []).map(
    (coord: [number, number]) => [coord[1], coord[0]]
  );

  // Extract turn-by-turn navigation steps for the ambulance crew
  const segment = feature.properties.segments?.[0];
  const steps: RouteStep[] = (segment?.steps || []).map((s: any, idx: number) => {
    let instruction = s.instruction || `Proceed towards ${destination.name}`;
    if (idx === 0) {
      instruction = `[EMERGENCY SIREN ON] ${instruction}`;
    }
    return {
      instruction,
      distanceMeters: Math.round(s.distance || 0),
      durationSeconds: Math.round(s.duration || 0),
    };
  });

  // Ensure arrival step is documented
  if (steps.length > 0) {
    steps.push({
      instruction: `Arrive at ${destination.name} Emergency & Trauma Receiving Bay. Transfer patient.`,
      distanceMeters: 50,
      durationSeconds: 15,
    });
  }

  const routeDetails: RouteDetails = {
    distanceKm,
    durationMinutes: baseDurationMinutes,
    trafficDurationMinutes,
    trafficLevel: destination.trafficLevel || 'NORMAL',
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
    provider: 'OPENROUTE_SERVICE',
  };

  // Cache for future lookups
  routeCache.set(cacheKey, {
    timestamp: Date.now(),
    route: routeDetails,
  });

  return routeDetails;
}
