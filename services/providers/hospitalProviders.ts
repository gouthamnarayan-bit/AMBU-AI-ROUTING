import { HospitalProvider } from './types';
import { Hospital } from '@/types/hospital';
import { LocationCoordinates } from '@/types/emergency';
import { DEMO_HOSPITALS } from '@/lib/simulation/demoData';
import { calculateHaversineDistanceKm } from '@/lib/simulation/demoRouting';
import { searchNearbyHospitalsGoogle } from '@/lib/google-maps/places';
import { searchNearbyHospitalsTomTom } from '@/lib/tomtom/places';

export class TomTomHospitalProvider implements HospitalProvider {
  async searchNearbyHospitals(
    location: LocationCoordinates,
    radiusKm: number = 25
  ): Promise<Hospital[]> {
    return await searchNearbyHospitalsTomTom(location, radiusKm);
  }

  async getHospitalDetails(placeId: string): Promise<Partial<Hospital> | null> {
    return null;
  }
}

export class GoogleHospitalProvider implements HospitalProvider {
  async searchNearbyHospitals(
    location: LocationCoordinates,
    radiusKm: number = 10
  ): Promise<Hospital[]> {
    return await searchNearbyHospitalsGoogle(location, radiusKm);
  }

  async getHospitalDetails(placeId: string): Promise<Partial<Hospital> | null> {
    return null;
  }
}

export class DemoHospitalProvider implements HospitalProvider {
  private hospitals: Hospital[];

  constructor(initialHospitals: Hospital[] = DEMO_HOSPITALS) {
    this.hospitals = [...initialHospitals];
  }

  async searchNearbyHospitals(
    location: LocationCoordinates,
    radiusKm: number = 50
  ): Promise<Hospital[]> {
    // Dynamically calculate accurate distance and travel times relative to incoming patient location
    return this.hospitals
      .map((h) => {
        const dist = calculateHaversineDistanceKm(
          location.latitude,
          location.longitude,
          h.latitude,
          h.longitude
        );

        // Adjust travel time based on distance & traffic condition
        let speed = 35; // km/h
        if (h.trafficLevel === 'LOW') speed = 45;
        if (h.trafficLevel === 'HIGH') speed = 25;
        if (h.trafficLevel === 'CONGESTED') speed = 18;

        const drivingDist = Math.max(0.5, Math.round(dist * 1.28 * 10) / 10);
        const travelMinutes = Math.max(3, Math.round((drivingDist / speed) * 60));

        return {
          ...h,
          distanceKm: drivingDist,
          travelTimeMinutes: travelMinutes,
        };
      })
      .filter((h) => h.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  async getHospitalDetails(placeId: string): Promise<Partial<Hospital> | null> {
    const found = this.hospitals.find((h) => h.placeId === placeId || h.id === placeId);
    return found || null;
  }

  public updateHospital(hospitalId: string, updates: Partial<Hospital>): boolean {
    const idx = this.hospitals.findIndex((h) => h.id === hospitalId);
    if (idx !== -1) {
      this.hospitals[idx] = {
        ...this.hospitals[idx],
        ...updates,
        lastUpdated: new Date().toISOString(),
      };
      return true;
    }
    return false;
  }

  public getAll(): Hospital[] {
    return [...this.hospitals];
  }
}
