import { Hospital } from '@/types/hospital';
import { AvailabilityProvider } from './providers/types';
import { DemoAvailabilityProvider } from './providers/availabilityProviders';

class AvailabilityService {
  private demoProvider: DemoAvailabilityProvider;

  constructor() {
    this.demoProvider = new DemoAvailabilityProvider();
  }

  async getHospitalAvailability(hospitalId: string): Promise<Partial<Hospital> | null> {
    return await this.demoProvider.getAvailability(hospitalId);
  }

  async updateHospitalAvailability(
    hospitalId: string,
    updates: Partial<Hospital>
  ): Promise<boolean> {
    return await this.demoProvider.updateAvailability(hospitalId, updates);
  }

  async listAllAvailability(): Promise<Map<string, Partial<Hospital>>> {
    return await this.demoProvider.listAllAvailability();
  }
}

export const availabilityService = new AvailabilityService();
