import { Hospital } from '@/types/hospital';
import { LocationCoordinates } from '@/types/emergency';
import { HospitalProvider } from './providers/types';
import {
  TomTomHospitalProvider,
  GoogleHospitalProvider,
  DemoHospitalProvider,
} from './providers/hospitalProviders';
import { DEMO_HOSPITALS } from '@/lib/simulation/demoData';

class HospitalService {
  private tomtomProvider: TomTomHospitalProvider;
  private googleProvider: GoogleHospitalProvider;
  private demoProvider: DemoHospitalProvider;

  constructor() {
    this.tomtomProvider = new TomTomHospitalProvider();
    this.googleProvider = new GoogleHospitalProvider();
    this.demoProvider = new DemoHospitalProvider(DEMO_HOSPITALS);
  }

  public isTomTomConfigured(): boolean {
    const key =
      process.env.TOMTOM_API_KEY ||
      process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
    return !!key && key.trim().length > 10;
  }

  public isGoogleConfigured(): boolean {
    const key =
      process.env.GOOGLE_PLACES_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    return !!key && key.trim().length > 5;
  }

  /**
   * Discovers candidate hospitals within specified radius.
   * Prioritizes live TomTom POI search, with graceful fallback to Google Places and Demo provider.
   */
  async findNearbyHospitals(
    location: LocationCoordinates,
    radiusKm: number = 25,
    forceDemo: boolean = false
  ): Promise<{ hospitals: Hospital[]; mode: 'DEMO' | 'REAL_API' }> {
    // 1. Try TomTom Live POI Search
    if (!forceDemo && this.isTomTomConfigured()) {
      try {
        const results = await this.tomtomProvider.searchNearbyHospitals(location, radiusKm);
        if (results && results.length > 0) {
          return { hospitals: results, mode: 'REAL_API' };
        }
      } catch (err) {
        console.warn('TomTom Hospital search failed, falling back to secondary providers:', err);
      }
    }

    // 2. Try Google Places API
    if (!forceDemo && this.isGoogleConfigured()) {
      try {
        const results = await this.googleProvider.searchNearbyHospitals(location, radiusKm);
        if (results && results.length > 0) {
          return { hospitals: results, mode: 'REAL_API' };
        }
      } catch (err) {
        console.warn('Google Places API search failed, falling back to Demo Mode:', err);
      }
    }

    // 3. Demo Mode fallback
    const demoHospitals = await this.demoProvider.searchNearbyHospitals(location, radiusKm);
    return { hospitals: demoHospitals, mode: 'DEMO' };
  }

  async getAllDemoHospitals(): Promise<Hospital[]> {
    return this.demoProvider.getAll();
  }

  async updateDemoHospital(hospitalId: string, updates: Partial<Hospital>): Promise<boolean> {
    return this.demoProvider.updateHospital(hospitalId, updates);
  }
}

export const hospitalService = new HospitalService();
