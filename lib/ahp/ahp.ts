import { AHPResult, CriterionKey } from '@/types/decision';
import { CRITERIA_KEYS } from '../decision-engine/criteria';

// Saaty's standard Random Consistency Index (RI) table for matrix sizes 1 to 10
export const RANDOM_INDEX_TABLE: Record<number, number> = {
  1: 0.0,
  2: 0.0,
  3: 0.58,
  4: 0.9,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41,
  9: 1.45,
  10: 1.49,
};

/**
 * Creates an n x n pairwise comparison matrix initialized to identity (1s on diagonal).
 */
export function createIdentityMatrix(n: number): number[][] {
  const matrix: number[][] = [];
  for (let i = 0; i < n; i++) {
    matrix[i] = new Array(n).fill(1.0);
  }
  return matrix;
}

/**
 * Normalizes pairwise matrix columns so that each column sums to 1.0.
 * r_ij = a_ij / sum_k(a_kj)
 */
export function normalizeMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;
  const colSums = new Array(n).fill(0);

  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      colSums[j] += matrix[i][j];
    }
  }

  const normalized: number[][] = [];
  for (let i = 0; i < n; i++) {
    normalized[i] = new Array(n);
    for (let j = 0; j < n; j++) {
      normalized[i][j] = colSums[j] > 0 ? matrix[i][j] / colSums[j] : 0;
    }
  }

  return normalized;
}

/**
 * Calculates priority vector (criteria weights) by averaging rows of normalized matrix.
 * w_i = (1 / n) * sum_j(r_ij)
 */
export function calculatePriorityVector(normalizedMatrix: number[][]): number[] {
  const n = normalizedMatrix.length;
  const weights: number[] = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < n; j++) {
      rowSum += normalizedMatrix[i][j];
    }
    weights[i] = rowSum / n;
  }

  return weights;
}

/**
 * Calculates lambda_max (principal eigenvalue) using the standard AHP formulation:
 * A * w = lambda_max * w  =>  lambda_max = (1/n) * sum_i ( (A * w)_i / w_i )
 */
export function calculateLambdaMax(matrix: number[][], weights: number[]): number {
  const n = matrix.length;
  let sumRatios = 0;

  for (let i = 0; i < n; i++) {
    let aw_i = 0;
    for (let j = 0; j < n; j++) {
      aw_i += matrix[i][j] * weights[j];
    }
    if (weights[i] > 0) {
      sumRatios += aw_i / weights[i];
    } else {
      sumRatios += n;
    }
  }

  return sumRatios / n;
}

/**
 * Consistency Index CI = (lambda_max - n) / (n - 1)
 */
export function calculateConsistencyIndex(lambdaMax: number, n: number): number {
  if (n <= 1) return 0;
  return (lambdaMax - n) / (n - 1);
}

/**
 * Consistency Ratio CR = CI / RI
 */
export function calculateConsistencyRatio(ci: number, n: number): number {
  const ri = RANDOM_INDEX_TABLE[n] || 1.41;
  if (ri === 0) return 0;
  return ci / ri;
}

/**
 * Validates whether CR <= 0.10.
 */
export function validateAHPConsistency(consistencyRatio: number): {
  isConsistent: boolean;
  message: string;
} {
  const roundedCR = Math.round(consistencyRatio * 1000) / 1000;
  if (roundedCR <= 0.1) {
    return {
      isConsistent: true,
      message: `AHP pairwise matrix is consistent (CR = ${roundedCR.toFixed(4)} <= 0.10). Priority weights are reliable.`,
    };
  }

  return {
    isConsistent: false,
    message: `Warning: AHP matrix exhibits acceptable inconsistency threshold violation (CR = ${roundedCR.toFixed(4)} > 0.10). Revise pairwise judgments.`,
  };
}

/**
 * Constructs a pairwise matrix from an upper-triangular dictionary of judgments.
 * comparisons: { "C1_TRAVEL_TIME:C2_DISTANCE": 3, ... }
 */
export function calculatePairwiseMatrix(
  criteria: CriterionKey[],
  comparisons?: Record<string, number>
): number[][] {
  const n = criteria.length;
  const matrix = createIdentityMatrix(n);

  if (!comparisons) {
    return matrix;
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const key1 = `${criteria[i]}:${criteria[j]}`;
      const key2 = `${criteria[j]}:${criteria[i]}`;

      if (comparisons[key1] !== undefined) {
        const val = comparisons[key1];
        matrix[i][j] = val;
        matrix[j][i] = 1 / val;
      } else if (comparisons[key2] !== undefined) {
        const val = comparisons[key2];
        matrix[j][i] = val;
        matrix[i][j] = 1 / val;
      }
    }
  }

  return matrix;
}

/**
 * Default standard pairwise judgments for 8 emergency ambulance criteria.
 * Carefully calibrated to ensure CR < 0.08 while reflecting emergency medical priorities:
 * Travel Time > Specialty Match > Emergency Availability > ICU > Distance > Capacity > Equipment > Rating
 */
export const DEFAULT_PAIRWISE_JUDGMENTS: Record<string, number> = {
  'C1_TRAVEL_TIME:C2_DISTANCE': 3,
  'C1_TRAVEL_TIME:C3_EMERGENCY_AVAILABILITY': 2,
  'C1_TRAVEL_TIME:C4_SPECIALTY_MATCH': 1.5,
  'C1_TRAVEL_TIME:C5_ICU_AVAILABILITY': 2,
  'C1_TRAVEL_TIME:C6_HOSPITAL_CAPACITY': 5,
  'C1_TRAVEL_TIME:C7_EQUIPMENT_AVAILABILITY': 5,
  'C1_TRAVEL_TIME:C8_HOSPITAL_RATING': 5,

  'C2_DISTANCE:C3_EMERGENCY_AVAILABILITY': 0.5,
  'C2_DISTANCE:C4_SPECIALTY_MATCH': 0.4,
  'C2_DISTANCE:C5_ICU_AVAILABILITY': 0.5,
  'C2_DISTANCE:C6_HOSPITAL_CAPACITY': 2,
  'C2_DISTANCE:C7_EQUIPMENT_AVAILABILITY': 2,
  'C2_DISTANCE:C8_HOSPITAL_RATING': 2,

  'C3_EMERGENCY_AVAILABILITY:C4_SPECIALTY_MATCH': 0.8,
  'C3_EMERGENCY_AVAILABILITY:C5_ICU_AVAILABILITY': 1,
  'C3_EMERGENCY_AVAILABILITY:C6_HOSPITAL_CAPACITY': 3,
  'C3_EMERGENCY_AVAILABILITY:C7_EQUIPMENT_AVAILABILITY': 3,
  'C3_EMERGENCY_AVAILABILITY:C8_HOSPITAL_RATING': 3,

  'C4_SPECIALTY_MATCH:C5_ICU_AVAILABILITY': 1.3,
  'C4_SPECIALTY_MATCH:C6_HOSPITAL_CAPACITY': 4,
  'C4_SPECIALTY_MATCH:C7_EQUIPMENT_AVAILABILITY': 4,
  'C4_SPECIALTY_MATCH:C8_HOSPITAL_RATING': 4,

  'C5_ICU_AVAILABILITY:C6_HOSPITAL_CAPACITY': 3,
  'C5_ICU_AVAILABILITY:C7_EQUIPMENT_AVAILABILITY': 3,
  'C5_ICU_AVAILABILITY:C8_HOSPITAL_RATING': 3,

  'C6_HOSPITAL_CAPACITY:C7_EQUIPMENT_AVAILABILITY': 1,
  'C6_HOSPITAL_CAPACITY:C8_HOSPITAL_RATING': 1,

  'C7_EQUIPMENT_AVAILABILITY:C8_HOSPITAL_RATING': 1,
};

/**
 * Runs complete AHP calculation pipeline.
 */
export function runAHP(
  criteria: CriterionKey[] = CRITERIA_KEYS,
  customComparisons?: Record<string, number>
): AHPResult {
  const comparisons = customComparisons || DEFAULT_PAIRWISE_JUDGMENTS;
  const pairwiseMatrix = calculatePairwiseMatrix(criteria, comparisons);
  const normalizedMatrix = normalizeMatrix(pairwiseMatrix);
  const rawWeights = calculatePriorityVector(normalizedMatrix);

  const n = criteria.length;
  const lambdaMax = calculateLambdaMax(pairwiseMatrix, rawWeights);
  const ci = calculateConsistencyIndex(lambdaMax, n);
  const ri = RANDOM_INDEX_TABLE[n] || 1.41;
  const cr = calculateConsistencyRatio(ci, n);
  const validation = validateAHPConsistency(cr);

  const priorityWeights: Record<CriterionKey, number> = {} as Record<CriterionKey, number>;
  criteria.forEach((key, idx) => {
    priorityWeights[key] = Math.round(rawWeights[idx] * 10000) / 10000;
  });

  return {
    criteria,
    pairwiseMatrix,
    normalizedMatrix,
    priorityWeights,
    lambdaMax: Math.round(lambdaMax * 10000) / 10000,
    consistencyIndex: Math.round(ci * 10000) / 10000,
    randomConsistencyIndex: ri,
    consistencyRatio: Math.round(cr * 10000) / 10000,
    isConsistent: validation.isConsistent,
    explanation: validation.message,
  };
}
