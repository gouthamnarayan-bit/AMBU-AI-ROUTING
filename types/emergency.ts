export type EmergencyCategory =
  | 'CARDIAC'
  | 'TRAUMA'
  | 'ACCIDENT'
  | 'STROKE'
  | 'RESPIRATORY'
  | 'BURN'
  | 'GENERAL'
  | 'OTHER';

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  address?: string;
  source?: 'GPS' | 'MANUAL' | 'MAP_CLICK' | 'PRESET_DEMO';
}

export interface PatientEmergencyDetails {
  patientId: string;
  age: number;
  gender: Gender;
  medicalCondition: string;
  emergencyType: EmergencyCategory;
  severity: SeverityLevel;
  additionalNotes?: string;
  location: LocationCoordinates;
  requiresIcu: boolean;
  requiresVentilator: boolean;
  requiresTraumaCenter: boolean;
  requiresSpecialty: string[];
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface RouteDetails {
  distanceKm: number;
  durationMinutes: number;
  trafficDurationMinutes: number;
  trafficLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'CONGESTED';
  trafficModel: 'BEST_GUESS' | 'OPTIMISTIC' | 'PESSIMISTIC';
  polyline: string; // encoded or demo coordinates
  coordinates: [number, number][]; // [lat, lng] array
  steps: RouteStep[];
  origin: LocationCoordinates;
  destination: LocationCoordinates;
  provider: 'OPENROUTE_SERVICE' | 'GOOGLE_ROUTES' | 'DEMO_SIMULATION';
}

export interface EmergencyCaseRecord {
  caseId: string;
  patientId: string;
  createdAt: string;
  patientData: PatientEmergencyDetails;
  location: LocationCoordinates;
  emergencyType: EmergencyCategory;
  severity: SeverityLevel;
  candidateHospitalsCount: number;
  eligibleHospitalsCount: number;
  excludedHospitalsCount: number;
  selectedHospitalId: string;
  selectedHospitalName: string;
  etaMinutes: number;
  distanceKm: number;
  decisionExplanation: string;
  ahpConsistencyRatio: number;
  mode: 'DEMO' | 'REAL_API';
  status: 'ACTIVE' | 'DISPATCHED' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED';
}
