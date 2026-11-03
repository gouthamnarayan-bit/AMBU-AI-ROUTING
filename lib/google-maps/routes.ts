import { LocationCoordinates, RouteDetails, RouteStep } from '@/types/emergency';
import { Hospital } from '@/types/hospital';

/**
 * Calculates traffic-aware driving route using Google Routes API.
 * Request format matches Routes API v2 standard.
 */
export async function calculateRouteGoogle(
  origin: LocationCoordinates,
  destination: Hospital,
  trafficModel: 'BEST_GUESS' | 'OPTIMISTIC' | 'PESSIMISTIC' = 'BEST_GUESS'
): Promise<RouteDetails> {
  const apiKey =
    process.env.GOOGLE_ROUTES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_ROUTES_API_KEY is not configured in environment variables.');
  }

  const endpoint = 'https://routes.googleapis.com/directions/v2:computeRoutes';

  const trafficModelMap: Record<string, string> = {
    BEST_GUESS: 'BEST_GUESS',
    OPTIMISTIC: 'OPTIMISTIC',
    PESSIMISTIC: 'PESSIMISTIC',
  };

  const requestBody = {
    origin: {
      location: {
        latLng: {
          latitude: origin.latitude,
          longitude: origin.longitude,
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
      },
    },
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
    departureTime: new Date(Date.now() + 60000).toISOString(), // 1 minute in future
    trafficModel: trafficModelMap[trafficModel] || 'BEST_GUESS',
    computeAlternativeRoutes: false,
    routeModifiers: {
      avoidTolls: false,
      avoidHighways: false,
      avoidFerries: true,
    },
    languageCode: 'en-US',
    units: 'METRIC',
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Routes API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const route = data.routes?.[0];

  if (!route) {
    throw new Error('Google Routes API returned no valid route path.');
  }

  // Parse duration seconds: e.g. "650s"
  const durationSec = parseInt(route.duration?.replace('s', '') || '600', 10);
  const distanceKm = Math.round(((route.distanceMeters || 5000) / 1000) * 10) / 10;
  const trafficDurationMinutes = Math.max(1, Math.round(durationSec / 60));

  const encoded = route.polyline?.encodedPolyline || '';

  // Extract legs and steps
  const leg = route.legs?.[0];
  const steps: RouteStep[] = (leg?.steps || []).map((s: any) => ({
    instruction: s.navigationInstruction?.maneuver || 'Proceed towards hospital',
    distanceMeters: s.distanceMeters || 500,
    durationSeconds: parseInt(s.staticDuration?.replace('s', '') || '60', 10),
  }));

  return {
    distanceKm,
    durationMinutes: Math.round(durationSec / 60),
    trafficDurationMinutes,
    trafficLevel: 'NORMAL',
    trafficModel,
    polyline: encoded,
    coordinates: [
      [origin.latitude, origin.longitude],
      [destination.latitude, destination.longitude],
    ],
    steps: steps.length > 0 ? steps : [],
    origin,
    destination: {
      latitude: destination.latitude,
      longitude: destination.longitude,
      address: destination.address,
    },
    provider: 'GOOGLE_ROUTES',
  };
}
