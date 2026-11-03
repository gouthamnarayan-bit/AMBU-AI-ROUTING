import { CriterionKey } from './decision';

export interface DecisionSystemConfig {
  searchRadiusKm: number;
  maxHospitalsToEvaluate: number;
  trafficModel: 'BEST_GUESS' | 'OPTIMISTIC' | 'PESSIMISTIC';
  defaultWeights: Record<CriterionKey, number>;
  pairwiseComparisons: Record<string, number>;
  allowSimulatedFallback: boolean;
  demoMode: boolean;
}

export interface SystemStatusInfo {
  googleMapsConfigured: boolean;
  googlePlacesConfigured: boolean;
  googleRoutesConfigured: boolean;
  firebaseConfigured: boolean;
  mode: 'DEMO' | 'REAL_API';
  status: 'ONLINE' | 'DEGRADED' | 'SIMULATION';
  uptimeSeconds: number;
  activeProvider: string;
}
