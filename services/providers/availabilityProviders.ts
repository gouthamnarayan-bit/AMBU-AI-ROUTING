import { AvailabilityProvider } from './types';
import { Hospital } from '@/types/hospital';
import { DEMO_HOSPITALS } from '@/lib/simulation/demoData';

export class DemoAvailabilityProvider implements AvailabilityProvider {
  private availabilityStore: Map<string, Partial<Hospital>> = new Map();

  constructor() {
    DEMO_HOSPITALS.forEach((h) => {
      this.availabilityStore.set(h.id, {
        icuBedsAvailable: h.icuBedsAvailable,
        generalBedsAvailable: h.generalBedsAvailable,
        emergencyDepartmentAvailable: h.emergencyDepartmentAvailable,
        cardiologyAvailable: h.cardiologyAvailable,
        neurologyAvailable: h.neurologyAvailable,
        orthopedicAvailable: h.orthopedicAvailable,
        traumaCenterAvailable: h.traumaCenterAvailable,
        ventilatorAvailable: h.ventilatorAvailable,
        bloodBankAvailable: h.bloodBankAvailable,
        ambulanceSupportAvailable: h.ambulanceSupportAvailable,
        hospitalCapacityPercent: h.hospitalCapacityPercent,
        availabilityStatus: h.availabilityStatus,
      });
    });
  }

  async getAvailability(hospitalId: string): Promise<Partial<Hospital> | null> {
    return this.availabilityStore.get(hospitalId) || null;
  }

  async updateAvailability(
    hospitalId: string,
    updates: Partial<Hospital>
  ): Promise<boolean> {
    const existing = this.availabilityStore.get(hospitalId) || {};
    this.availabilityStore.set(hospitalId, {
      ...existing,
      ...updates,
      lastUpdated: new Date().toISOString(),
    });
    return true;
  }

  async listAllAvailability(): Promise<Map<string, Partial<Hospital>>> {
    return new Map(this.availabilityStore);
  }
}
