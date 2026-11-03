import { describe, it, expect } from 'vitest';
import {
  createIdentityMatrix,
  normalizeMatrix,
  calculatePriorityVector,
  calculateLambdaMax,
  calculateConsistencyIndex,
  calculateConsistencyRatio,
  validateAHPConsistency,
  runAHP,
  DEFAULT_PAIRWISE_JUDGMENTS,
} from '@/lib/ahp/ahp';
import { CRITERIA_KEYS } from '@/lib/decision-engine/criteria';

describe('Analytic Hierarchy Process (AHP) Engine', () => {
  it('should initialize a valid n x n identity matrix', () => {
    const matrix = createIdentityMatrix(8);
    expect(matrix.length).toBe(8);
    for (let i = 0; i < 8; i++) {
      expect(matrix[i][i]).toBe(1.0);
    }
  });

  it('should correctly normalize columns to sum to 1.0', () => {
    const testMatrix = [
      [1, 2, 4],
      [0.5, 1, 2],
      [0.25, 0.5, 1],
    ];
    const norm = normalizeMatrix(testMatrix);

    for (let j = 0; j < 3; j++) {
      let colSum = 0;
      for (let i = 0; i < 3; i++) {
        colSum += norm[i][j];
      }
      expect(colSum).toBeCloseTo(1.0, 4);
    }
  });

  it('should calculate priority weights that sum to 1.0', () => {
    const testMatrix = [
      [1, 2, 4],
      [0.5, 1, 2],
      [0.25, 0.5, 1],
    ];
    const norm = normalizeMatrix(testMatrix);
    const weights = calculatePriorityVector(norm);

    expect(weights.length).toBe(3);
    const sum = weights.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 4);
    expect(weights[0]).toBeGreaterThan(weights[1]);
    expect(weights[1]).toBeGreaterThan(weights[2]);
  });

  it('should verify that default emergency pairwise judgments have acceptable consistency (CR <= 0.10)', () => {
    const result = runAHP(CRITERIA_KEYS, DEFAULT_PAIRWISE_JUDGMENTS);

    expect(result.criteria.length).toBe(8);
    expect(result.consistencyRatio).toBeLessThanOrEqual(0.10);
    expect(result.isConsistent).toBe(true);

    // Sum of priority weights must be ~1.0
    const sumWeights = Object.values(result.priorityWeights).reduce((a, b) => a + b, 0);
    expect(sumWeights).toBeCloseTo(1.0, 2);

    // Travel time & specialty match should be highest weighted
    expect(result.priorityWeights['C1_TRAVEL_TIME']).toBeGreaterThan(0.15);
    expect(result.priorityWeights['C4_SPECIALTY_MATCH']).toBeGreaterThan(0.15);
  });

  it('should flag unacceptable inconsistency when random contradictory judgments are supplied', () => {
    const contradictoryJudgments = {
      'C1_TRAVEL_TIME:C2_DISTANCE': 9,
      'C2_DISTANCE:C3_EMERGENCY_AVAILABILITY': 9,
      'C1_TRAVEL_TIME:C3_EMERGENCY_AVAILABILITY': 1 / 9, // Severe circular contradiction
    };

    const result = runAHP(['C1_TRAVEL_TIME', 'C2_DISTANCE', 'C3_EMERGENCY_AVAILABILITY'], contradictoryJudgments);
    expect(result.consistencyRatio).toBeGreaterThan(0.10);
    expect(result.isConsistent).toBe(false);
  });
});
