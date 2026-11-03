import { describe, it, expect } from 'vitest';
import {
  calculateColumnNorms,
  normalizeDecisionMatrix,
  applyWeights,
  calculateIdealBest,
  calculateIdealWorst,
  calculateDistances,
  calculateClosenessCoefficient,
  rankHospitalsWithTOPSIS,
  RawHospitalRow,
} from '@/lib/topsis/topsis';
import { CriterionKey, CriterionType } from '@/types/decision';

describe('TOPSIS Decision Engine', () => {
  const criteria: CriterionKey[] = [
    'C1_TRAVEL_TIME',
    'C2_DISTANCE',
    'C3_EMERGENCY_AVAILABILITY',
    'C4_SPECIALTY_MATCH',
  ];

  const criteriaTypes: Record<CriterionKey, CriterionType> = {
    C1_TRAVEL_TIME: 'COST',
    C2_DISTANCE: 'COST',
    C3_EMERGENCY_AVAILABILITY: 'BENEFIT',
    C4_SPECIALTY_MATCH: 'BENEFIT',
  };

  const weights: Record<CriterionKey, number> = {
    C1_TRAVEL_TIME: 0.4,
    C2_DISTANCE: 0.1,
    C3_EMERGENCY_AVAILABILITY: 0.25,
    C4_SPECIALTY_MATCH: 0.25,
  };

  const sampleRows: RawHospitalRow[] = [
    {
      hospitalId: 'H1',
      hospitalName: 'Hospital Fast & High Specialty',
      isEligible: true,
      values: {
        C1_TRAVEL_TIME: 5, // Best (lowest cost)
        C2_DISTANCE: 3,
        C3_EMERGENCY_AVAILABILITY: 10, // Best (highest benefit)
        C4_SPECIALTY_MATCH: 10, // Best
        C5_ICU_AVAILABILITY: 5,
        C6_HOSPITAL_CAPACITY: 5,
        C7_EQUIPMENT_AVAILABILITY: 5,
        C8_HOSPITAL_RATING: 5,
      },
    },
    {
      hospitalId: 'H2',
      hospitalName: 'Hospital Far & Low Specialty',
      isEligible: true,
      values: {
        C1_TRAVEL_TIME: 30, // Worst
        C2_DISTANCE: 25,
        C3_EMERGENCY_AVAILABILITY: 3, // Worst
        C4_SPECIALTY_MATCH: 2, // Worst
        C5_ICU_AVAILABILITY: 2,
        C6_HOSPITAL_CAPACITY: 2,
        C7_EQUIPMENT_AVAILABILITY: 2,
        C8_HOSPITAL_RATING: 2,
      },
    },
  ];

  it('should calculate non-zero column norms correctly', () => {
    const norms = calculateColumnNorms(sampleRows, criteria);
    expect(norms['C1_TRAVEL_TIME']).toBeCloseTo(Math.sqrt(25 + 900), 2);
    expect(norms['C3_EMERGENCY_AVAILABILITY']).toBeCloseTo(Math.sqrt(100 + 9), 2);
  });

  it('should rank superior facility higher than inferior facility', () => {
    const result = rankHospitalsWithTOPSIS(sampleRows, weights, criteria, criteriaTypes);

    expect(result.rankedEligibleHospitals.length).toBe(2);
    const top = result.rankedEligibleHospitals[0];
    const second = result.rankedEligibleHospitals[1];

    expect(top.hospitalId).toBe('H1');
    expect(second.hospitalId).toBe('H2');
    expect(top.topsisScore).toBeGreaterThan(second.topsisScore);
    expect(top.rank).toBe(1);
    expect(second.rank).toBe(2);
  });

  it('should handle edge case: identical hospital values without crashing or dividing by zero', () => {
    const identicalRows: RawHospitalRow[] = [
      {
        hospitalId: 'A',
        hospitalName: 'Hospital A',
        isEligible: true,
        values: sampleRows[0].values,
      },
      {
        hospitalId: 'B',
        hospitalName: 'Hospital B',
        isEligible: true,
        values: sampleRows[0].values,
      },
    ];

    const result = rankHospitalsWithTOPSIS(identicalRows, weights, criteria, criteriaTypes);
    expect(result.rankedEligibleHospitals.length).toBe(2);
    expect(result.rankedEligibleHospitals[0].topsisScore).toBeCloseTo(0.5, 2);
    expect(result.rankedEligibleHospitals[1].topsisScore).toBeCloseTo(0.5, 2);
  });

  it('should handle edge case: single candidate hospital', () => {
    const singleRow = [sampleRows[0]];
    const result = rankHospitalsWithTOPSIS(singleRow, weights, criteria, criteriaTypes);

    expect(result.rankedEligibleHospitals.length).toBe(1);
    expect(result.rankedEligibleHospitals[0].rank).toBe(1);
    expect(result.rankedEligibleHospitals[0].topsisScore).toBeGreaterThan(0);
  });

  it('should place ineligible hospitals into excludedHospitals partition with ranks following eligible', () => {
    const mixedRows: RawHospitalRow[] = [
      { ...sampleRows[0], isEligible: true },
      { ...sampleRows[1], isEligible: false, exclusionReasons: ['No ICU beds'] },
    ];

    const result = rankHospitalsWithTOPSIS(mixedRows, weights, criteria, criteriaTypes);
    expect(result.rankedEligibleHospitals.length).toBe(1);
    expect(result.excludedHospitals.length).toBe(1);
    expect(result.rankedEligibleHospitals[0].hospitalId).toBe('H1');
    expect(result.excludedHospitals[0].hospitalId).toBe('H2');
    expect(result.excludedHospitals[0].rank).toBe(2);
  });
});
