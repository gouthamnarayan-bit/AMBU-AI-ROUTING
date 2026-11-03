import { Hospital, AvailabilityLevel } from '@/types/hospital';
import { LocationCoordinates, RouteDetails } from '@/types/emergency';

export interface HospitalProvider {
  searchNearbyHospitals(
    location: LocationCoordinates,
    radiusKm: number
  ): Promise<Hospital[]>;
  getHospitalDetails(placeId: string): Promise<Partial<Hospital> | null>;
}

export interface RoutingProvider {
  calculateRoute(
    origin: LocationCoordinates,
    destination: Hospital,
    trafficModel?: 'BEST_GUESS' | 'OPTIMISTIC' | 'PESSIMISTIC'
  ): Promise<RouteDetails>;
}

export interface AvailabilityProvider {
  getAvailability(hospitalId: string): Promise<Partial<Hospital> | null>;
  updateAvailability(
    hospitalId: string,
    updates: Partial<Hospital>
  ): Promise<boolean>;
  listAllAvailability(): Promise<Map<string, Partial<Hospital>>>;
}
