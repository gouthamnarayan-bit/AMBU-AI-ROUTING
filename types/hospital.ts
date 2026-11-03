export type AvailabilityLevel = 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE';

export interface Hospital {
  id: string;
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  rating: number; // 1.0 to 5.0
  distanceKm: number;
  travelTimeMinutes: number;
  trafficLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'CONGESTED';
  icuBedsAvailable: number;
  generalBedsAvailable: number;
  emergencyDepartmentAvailable: boolean;
  cardiologyAvailable: boolean;
  neurologyAvailable: boolean;
  orthopedicAvailable: boolean;
  traumaCenterAvailable: boolean;
  ventilatorAvailable: boolean;
  bloodBankAvailable: boolean;
  ambulanceSupportAvailable: boolean;
  hospitalCapacityPercent: number; // 0 - 100% (lower means more available capacity)
  availabilityStatus: AvailabilityLevel;
  lastUpdated: string;
  source: 'GOOGLE_PLACES' | 'SIMULATED' | 'HOSPITAL_PORTAL';
  simulationMode: boolean;
}

export interface HospitalFilterOptions {
  searchQuery?: string;
  emergencyOnly?: boolean;
  icuRequired?: boolean;
  specialty?: string;
  maxDistanceKm?: number;
  status?: AvailabilityLevel | 'ALL';
}

export interface HospitalEligibilityResult {
  hospitalId: string;
  isEligible: boolean;
  exclusionReasons: string[];
  mandatoryChecks: {
    emergencyDepartment: boolean;
    specialtyMatch: boolean;
    icuAvailable: boolean;
    operationalStatus: boolean;
  };
}
