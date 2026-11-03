import { LocationCoordinates, RouteDetails } from '@/types/emergency';
import { Hospital } from '@/types/hospital';
import { RoutingProvider } from './providers/types';
import {
  TomTomRoutingProvider,
  OpenRouteServiceProvider,
  GoogleRoutingProvider,
  DemoRoutingProvider,
} from './providers/routingProviders';

class RouteService {
  private tomtomProvider: TomTomRoutingProvider;
  private orsProvider: OpenRouteServiceProvider;
  private googleProvider: GoogleRoutingProvider;
  private demoProvider: DemoRoutingProvider;

  constructor() {
    this.tomtomProvider = new TomTomRoutingProvider();
    this.orsProvider = new OpenRouteServiceProvider();
    this.googleProvider = new GoogleRoutingProvider();
    this.demoProvider = new DemoRoutingProvider();
  }

  public isTomTomRoutesConfigured(): boolean {
    const key =
      process.env.TOMTOM_API_KEY ||
      process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
    return !!key && key.trim().length > 10;
  }

  public isORSRoutesConfigured(): boolean {
    const key =
      process.env.OPENROUTE_SERVICE_API_KEY ||
      process.env.NEXT_PUBLIC_OPENROUTE_SERVICE_API_KEY ||
      process.env.ORS_API_KEY;
    return !!key && key.trim().length > 10;
  }

  public isGoogleRoutesConfigured(): boolean {
    const key =
      process.env.GOOGLE_ROUTES_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    return !!key && key.trim().length > 5;
  }

  public getActiveProviderName(): string {
    if (this.isTomTomRoutesConfigured()) {
      return 'TomTom Traffic-Aware Emergency Routing Engine (Live Active)';
    }
    if (this.isORSRoutesConfigured()) {
      return 'OpenRouteService (Live Direction Engine)';
    }
    if (this.isGoogleRoutesConfigured()) {
      return 'Google Routes API (v2)';
    }
    return 'Demo Simulation Provider';
  }

  /**
   * Calculates fastest driving route with priority emergency transit awareness.
   * Prioritizes TomTom Live Traffic Routing with graceful fallback to ORS, Google, and Demo simulation.
   */
  async calculateRoute(
    origin: LocationCoordinates,
    destination: Hospital,
    trafficModel: 'BEST_GUESS' | 'OPTIMISTIC' | 'PESSIMISTIC' = 'BEST_GUESS',
    forceDemo: boolean = false
  ): Promise<RouteDetails> {
    // 1. Try TomTom Live Traffic Routing
    if (!forceDemo && this.isTomTomRoutesConfigured()) {
      try {
        const route = await this.tomtomProvider.calculateRoute(origin, destination, trafficModel);
        if (route) return route;
      } catch (err) {
        console.warn('TomTom Routing computation failed, attempting secondary fallback:', err);
      }
    }

    // 2. Try OpenRouteService Live Direction API
    if (!forceDemo && this.isORSRoutesConfigured()) {
      try {
        const route = await this.orsProvider.calculateRoute(origin, destination, trafficModel);
        if (route) return route;
      } catch (err) {
        console.warn('OpenRouteService computation failed, attempting secondary fallback:', err);
      }
    }

    // 3. Try Google Routes API (if configured)
    if (!forceDemo && this.isGoogleRoutesConfigured()) {
      try {
        const route = await this.googleProvider.calculateRoute(origin, destination, trafficModel);
        if (route) return route;
      } catch (err) {
        console.warn('Google Routes API computation failed, falling back to Demo Routing:', err);
      }
    }

    // 4. Fallback to High-Fidelity Demo Simulation
    return await this.demoProvider.calculateRoute(origin, destination, trafficModel);
  }
}

export const routeService = new RouteService();
