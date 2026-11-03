import { describe, it, expect } from 'vitest';
import { executeHybridDecisionPipeline } from '@/lib/decision-engine/hybridEngine';
import { DEMO_HOSPITALS, DEMO_SCENARIOS } from '@/lib/simulation/demoData';

describe('Hybrid AHP + TOPSIS Decision Pipeline End-to-End', () => {
  it('should evaluate Cardiac emergency, eliminate ineligible hospitals, and select top eligible cardiac center', () => {
    const cardiacScenario = DEMO_SCENARIOS[0]; // 65yo male, Critical Cardiac, needs ICU & Cardiology
    const result = executeHybridDecisionPipeline(DEMO_HOSPITALS, cardiacScenario.patient);

    expect(result.candidateHospitals.length).toBe(8);
    expect(result.eligibleHospitals.length).toBeGreaterThan(0);
    expect(result.ineligibleHospitals.length).toBeGreaterThan(0);

    // St. Jude (0 ICU beds) and Highland Clinic (closed ED) MUST be ineligible
    const stJude = result.ineligibleHospitals.find((h) => h.hospital.id === 'hosp-002');
    expect(stJude).toBeDefined();

    const highland = result.ineligibleHospitals.find((h) => h.hospital.id === 'hosp-007');
    expect(highland).toBeDefined();

    // Selected hospital must have cardiology and ICU available
    const selected = result.selectedHospital;
    expect(selected).not.toBeNull();
    expect(selected!.cardiologyAvailable).toBe(true);
    expect(selected!.icuBedsAvailable).toBeGreaterThan(0);
    expect(selected!.emergencyDepartmentAvailable).toBe(true);

    // Explainability output must be generated
    expect(result.explainableDecision).not.toBeNull();
    expect(result.explainableDecision!.factorCards.length).toBe(6);
    expect(result.explainableDecision!.keyStrengths.length).toBeGreaterThan(0);
  });

  it('should adapt selection for Polytrauma emergency and choose Level 1/2 Trauma unit', () => {
    const traumaScenario = DEMO_SCENARIOS[1]; // 28yo female, Critical Trauma, needs Trauma center
    const result = executeHybridDecisionPipeline(DEMO_HOSPITALS, traumaScenario.patient);

    const selected = result.selectedHospital;
    expect(selected).not.toBeNull();
    expect(selected!.traumaCenterAvailable).toBe(true);
    expect(selected!.icuBedsAvailable).toBeGreaterThan(0);
  });

  it('should adapt selection for Stroke emergency and prioritize Neurology capability', () => {
    const strokeScenario = DEMO_SCENARIOS[2]; // 72yo female, Critical Stroke
    const result = executeHybridDecisionPipeline(DEMO_HOSPITALS, strokeScenario.patient);

    const selected = result.selectedHospital;
    expect(selected).not.toBeNull();
    expect(selected!.neurologyAvailable).toBe(true);
  });

  it('should adapt selection for Severe Respiratory emergency and prioritize Ventilator readiness', () => {
    const respScenario = DEMO_SCENARIOS[3]; // 54yo male, Critical Respiratory
    const result = executeHybridDecisionPipeline(DEMO_HOSPITALS, respScenario.patient);

    const selected = result.selectedHospital;
    expect(selected).not.toBeNull();
    expect(selected!.ventilatorAvailable).toBe(true);
    expect(selected!.icuBedsAvailable).toBeGreaterThan(0);
  });
});
