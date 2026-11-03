export type CriterionKey =
  | 'C1_TRAVEL_TIME'
  | 'C2_DISTANCE'
  | 'C3_EMERGENCY_AVAILABILITY'
  | 'C4_SPECIALTY_MATCH'
  | 'C5_ICU_AVAILABILITY'
  | 'C6_HOSPITAL_CAPACITY'
  | 'C7_EQUIPMENT_AVAILABILITY'
  | 'C8_HOSPITAL_RATING';

export type CriterionType = 'COST' | 'BENEFIT';

export interface CriterionDefinition {
  key: CriterionKey;
  code: string;
  name: string;
  type: CriterionType;
  defaultWeight: number;
  description: string;
}

export interface AHPResult {
  criteria: CriterionKey[];
  pairwiseMatrix: number[][];
  normalizedMatrix: number[][];
  priorityWeights: Record<CriterionKey, number>;
  lambdaMax: number;
  consistencyIndex: number;
  randomConsistencyIndex: number;
  consistencyRatio: number;
  isConsistent: boolean; // CR <= 0.10
  explanation: string;
}

export interface TOPSISHospitalScore {
  hospitalId: string;
  hospitalName: string;
  rawValues: Record<CriterionKey, number>;
  normalizedValues: Record<CriterionKey, number>;
  weightedValues: Record<CriterionKey, number>;
  distanceToPositiveIdeal: number; // S+
  distanceToNegativeIdeal: number; // S-
  closenessCoefficient: number; // C* (0 to 1)
  topsisScore: number; // C* as final score
  rank: number;
  isEligible: boolean;
  exclusionReasons?: string[];
}

export interface TOPSISResult {
  criteria: CriterionKey[];
  criteriaTypes: Record<CriterionKey, CriterionType>;
  weights: Record<CriterionKey, number>;
  positiveIdealSolution: Record<CriterionKey, number>; // V+
  negativeIdealSolution: Record<CriterionKey, number>; // V-
  hospitalScores: TOPSISHospitalScore[];
  rankedEligibleHospitals: TOPSISHospitalScore[];
  excludedHospitals: TOPSISHospitalScore[];
}

export interface DecisionFactorCard {
  title: string;
  value: string;
  status: 'positive' | 'neutral' | 'warning';
  icon: string;
  description: string;
}

export interface ExplainableDecision {
  selectedHospitalId: string;
  selectedHospitalName: string;
  summaryText: string;
  topsisScore: number;
  rank: number;
  keyStrengths: string[];
  tradeOffs: string[];
  factorCards: DecisionFactorCard[];
  clinicalFitAnalysis: string;
  excludedHospitalsSummary: {
    hospitalId: string;
    hospitalName: string;
    reason: string;
  }[];
}
