import { describe, it, expect } from 'vitest';
import { adjustWeightsForPatient } from '@/lib/decision-engine/patientWeights';
import { DECISION_CRITERIA, CRITERIA_KEYS } from '@/lib/decision-engine/criteria';
import { DEMO_SCENARIOS, DEMO_CENTER_LOCATION } from '@/lib/simulation/demoData';
import { CriterionKey } from '@/types/decision';

describe('Patient-Specific Weight Adjustment', () => {
  const baselineWeights: Record<CriterionKey, number> = Object.fromEntries(
    DECISION_CRITERIA.map((c) => [c.key, c.defaultWeight])
  ) as Record<CriterionKey, number>;

  it('should increase Cardiology, ICU, and Travel Time for Cardiac emergencies', () => {
    const cardiacPatient = DEMO_SCENARIOS[0].patient;
    const adjusted = adjustWeightsForPatient(baselineWeights, cardiacPatient);

    const sum = Object.values(adjusted).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 3);

    // Specialty & ICU & Travel time should have higher weights than baseline
    expect(adjusted['C4_SPECIALTY_MATCH']).toBeGreaterThan(baselineWeights['C4_SPECIALTY_MATCH']);
    expect(adjusted['C5_ICU_AVAILABILITY']).toBeGreaterThan(baselineWeights['C5_ICU_AVAILABILITY']);
    expect(adjusted['C1_TRAVEL_TIME']).toBeGreaterThan(baselineWeights['C1_TRAVEL_TIME']);
  });

  it('should prioritize Trauma center and Emergency Dept readiness for Trauma emergencies', () => {
    const traumaPatient = DEMO_SCENARIOS[1].patient;
    const adjusted = adjustWeightsForPatient(baselineWeights, traumaPatient);

    const sum = Object.values(adjusted).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 3);

    expect(adjusted['C4_SPECIALTY_MATCH']).toBeGreaterThan(baselineWeights['C4_SPECIALTY_MATCH']);
    expect(adjusted['C3_EMERGENCY_AVAILABILITY']).toBeGreaterThan(baselineWeights['C3_EMERGENCY_AVAILABILITY']);
  });

  it('should prioritize Neurology and rapid Travel Time for Stroke emergencies', () => {
    const strokePatient = DEMO_SCENARIOS[2].patient;
    const adjusted = adjustWeightsForPatient(baselineWeights, strokePatient);

    const sum = Object.values(adjusted).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 3);

    expect(adjusted['C4_SPECIALTY_MATCH']).toBeGreaterThan(baselineWeights['C4_SPECIALTY_MATCH']);
    expect(adjusted['C1_TRAVEL_TIME']).toBeGreaterThan(baselineWeights['C1_TRAVEL_TIME']);
  });

  it('should prioritize Ventilator and ICU availability for Respiratory emergencies', () => {
    const respPatient = DEMO_SCENARIOS[3].patient;
    const adjusted = adjustWeightsForPatient(baselineWeights, respPatient);

    const sum = Object.values(adjusted).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 3);

    expect(adjusted['C5_ICU_AVAILABILITY']).toBeGreaterThan(baselineWeights['C5_ICU_AVAILABILITY']);
    expect(adjusted['C7_EQUIPMENT_AVAILABILITY']).toBeGreaterThan(baselineWeights['C7_EQUIPMENT_AVAILABILITY']);
  });
});
