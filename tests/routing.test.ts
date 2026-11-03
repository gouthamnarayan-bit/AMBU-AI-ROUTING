import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateHaversineDistanceKm,
  generateDemoPolyline,
  generateDemoRouteSteps,
  calculateDemoRoute,
} from '@/lib/simulation/demoRouting';
import { DEMO_CENTER_LOCATION, DEMO_HOSPITALS } from '@/lib/simulation/demoData';
import { routeService } from '@/services/routeService';
import { calculateRouteOpenRouteService } from '@/lib/openrouteservice/routes';

describe('Ambulance Routing Engine & Traffic Modeling', () => {
  it('should accurately calculate Haversine distance between two coordinates', () => {
    // Distance between Bangalore Center (12.9716, 77.5946) and Metro Central (12.9734, 77.6078) ~ 1.4 km straight line
    const dist = calculateHaversineDistanceKm(
      DEMO_CENTER_LOCATION.latitude,
      DEMO_CENTER_LOCATION.longitude,
      DEMO_HOSPITALS[0].latitude,
      DEMO_HOSPITALS[0].longitude
    );

    expect(dist).toBeGreaterThan(1.0);
    expect(dist).toBeLessThan(3.0);
  });

  it('should generate valid GPS polyline waypoints for map rendering', () => {
    const coords = generateDemoPolyline(DEMO_CENTER_LOCATION, {
      latitude: DEMO_HOSPITALS[0].latitude,
      longitude: DEMO_HOSPITALS[0].longitude,
    });

    expect(coords.length).toBeGreaterThan(5);
    expect(coords[0][0]).toBeCloseTo(DEMO_CENTER_LOCATION.latitude, 3);
    expect(coords[0][1]).toBeCloseTo(DEMO_CENTER_LOCATION.longitude, 3);
  });

  it('should generate turn-by-turn navigation instructions for ambulance crew', () => {
    const steps = generateDemoRouteSteps('104 Brigade Road', 'Metro Central', 3.5, 8);
    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps[0].instruction).toContain('Depart');
    expect(steps[steps.length - 1].instruction).toContain('Resuscitation');
  });

  it('should adjust traffic duration according to traffic model', () => {
    const hosp = DEMO_HOSPITALS[0];
    const bestGuess = calculateDemoRoute(DEMO_CENTER_LOCATION, hosp, 'BEST_GUESS');
    const optimistic = calculateDemoRoute(DEMO_CENTER_LOCATION, hosp, 'OPTIMISTIC');
    const pessimistic = calculateDemoRoute(DEMO_CENTER_LOCATION, hosp, 'PESSIMISTIC');

    expect(optimistic.trafficDurationMinutes).toBeLessThanOrEqual(bestGuess.trafficDurationMinutes);
    expect(pessimistic.trafficDurationMinutes).toBeGreaterThanOrEqual(bestGuess.trafficDurationMinutes);
  });

  it('should compute OpenRouteService fast & easy ambulance route with valid coordinates', async () => {
    const hosp = DEMO_HOSPITALS[0];

    // Mock global fetch for ORS API
    const mockOrsResponse = {
      features: [
        {
          properties: {
            summary: {
              distance: 2150.5,
              duration: 290.0,
            },
            segments: [
              {
                steps: [
                  {
                    instruction: 'Head north on MG Road towards Hospital',
                    distance: 550,
                    duration: 65,
                  },
                  {
                    instruction: 'Turn right onto Brigade Road fast corridor',
                    distance: 1600,
                    duration: 225,
                  },
                ],
              },
            ],
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              [77.5946, 12.9716],
              [77.6010, 12.9725],
              [77.6078, 12.9734],
            ],
          },
        },
      ],
    };

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockOrsResponse,
    } as any);

    try {
      const prevKey = process.env.OPENROUTE_SERVICE_API_KEY;
      process.env.OPENROUTE_SERVICE_API_KEY =
        'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImUxOTg3ZWVmYjA5MzQyMGNiMGNkMjUzNDIxNjQwOGE1IiwiaCI6Im11cm11cjY0In0=';

      const route = await calculateRouteOpenRouteService(DEMO_CENTER_LOCATION, hosp, 'BEST_GUESS');

      expect(route.provider).toBe('OPENROUTE_SERVICE');
      expect(route.distanceKm).toBeCloseTo(2.2, 1);
      expect(route.coordinates.length).toBe(3);
      // Verify coordinates were converted from [lon, lat] to Leaflet [lat, lon]
      expect(route.coordinates[0]).toEqual([12.9716, 77.5946]);
      expect(route.coordinates[2]).toEqual([12.9734, 77.6078]);
      expect(route.steps.length).toBeGreaterThan(0);
      expect(route.steps[0].instruction).toContain('EMERGENCY SIREN');

      process.env.OPENROUTE_SERVICE_API_KEY = prevKey;
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('routeService should recognize OpenRouteService when configured and prioritize it', () => {
    const prevKey = process.env.OPENROUTE_SERVICE_API_KEY;
    process.env.OPENROUTE_SERVICE_API_KEY =
      'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImUxOTg3ZWVmYjA5MzQyMGNiMGNkMjUzNDIxNjQwOGE1IiwiaCI6Im11cm11cjY0In0=';

    expect(routeService.isORSRoutesConfigured()).toBe(true);
    expect(routeService.getActiveProviderName()).toContain('OpenRouteService');

    process.env.OPENROUTE_SERVICE_API_KEY = prevKey;
  });
});
