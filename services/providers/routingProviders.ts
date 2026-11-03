import { RoutingProvider } from './types';
import { LocationCoordinates, RouteDetails } from '@/types/emergency';
import { Hospital } from '@/types/hospital';
import { calculateRouteTomTom } from '@/lib/tomtom/routes';
import { calculateRouteGoogle } from '@/lib/google-maps/routes';
import { calculateDemoRoute } from '@/lib/simulation/demoRouting';
import { calculateRouteOpenRouteService } from '@/lib/openrouteservice/routes';

export class TomTomRoutingProvider implements RoutingProvider {
  async calculateRoute(
    origin: LocationCoordinates,
    destination: Hospital,
    trafficModel: 'BEST_GUESS' | 'OPTIMISTIC' | 'PESSIMISTIC' = 'BEST_GUESS'
  ): Promise<RouteDetails> {
    return await calculateRouteTomTom(origin, destination, trafficModel);
  }
}

export class OpenRouteServiceProvider implements RoutingProvider {
  async calculateRoute(
    origin: LocationCoordinates,
    destination: Hospital,
    trafficModel: 'BEST_GUESS' | 'OPTIMISTIC' | 'PESSIMISTIC' = 'BEST_GUESS'
  ): Promise<RouteDetails> {
    return await calculateRouteOpenRouteService(origin, destination, trafficModel);
  }
}

export class GoogleRoutingProvider implements RoutingProvider {
  async calculateRoute(
    origin: LocationCoordinates,
    destination: Hospital,
    trafficModel: 'BEST_GUESS' | 'OPTIMISTIC' | 'PESSIMISTIC' = 'BEST_GUESS'
  ): Promise<RouteDetails> {
    return await calculateRouteGoogle(origin, destination, trafficModel);
  }
}

export class DemoRoutingProvider implements RoutingProvider {
  async calculateRoute(
    origin: LocationCoordinates,
    destination: Hospital,
    trafficModel: 'BEST_GUESS' | 'OPTIMISTIC' | 'PESSIMISTIC' = 'BEST_GUESS'
  ): Promise<RouteDetails> {
    return calculateDemoRoute(origin, destination, trafficModel);
  }
}
