import { describe, it, expect } from 'vitest';
import { emergencyService } from '@/services/emergencyService';
import { DEMO_SCENARIOS } from '@/lib/simulation/demoData';
import { getEmergencyCases } from '@/lib/firebase/firestore';

describe('Project Self-Verification Scenario Suite', () => {
  it('Scenario 1: 65yo Critical Cardiac Emergency', async () => {
    const cardiacScenario = DEMO_SCENARIOS[0];
    const output = await emergencyService.processEmergencyCase(
      cardiacScenario.patient,
      25,
      'BEST_GUESS',
      true
    );

    expect(output.decisionResult.candidateHospitals.length).toBeGreaterThanOrEqual(5);
    expect(output.decisionResult.selectedHospital).not.toBeNull();

    // Must satisfy hard constraints: Cardiology + ICU + Emergency department
    const sel = output.decisionResult.selectedHospital!;
    expect(sel.cardiologyAvailable).toBe(true);
    expect(sel.icuBedsAvailable).toBeGreaterThan(0);
    expect(sel.emergencyDepartmentAvailable).toBe(true);

    // St. Jude (0 ICU beds) and Highland Clinic (closed ED) must be ineligible
    const ineligibleIds = output.decisionResult.ineligibleHospitals.map((h) => h.hospital.id);
    expect(ineligibleIds).toContain('hosp-002');
    expect(ineligibleIds).toContain('hosp-007');

    // Route and ETA must be present
    expect(output.recommendedRoute).not.toBeNull();
    expect(output.recommendedRoute!.steps.length).toBeGreaterThan(0);
    expect(sel.travelTimeMinutes).toBeGreaterThan(0);

    // XAI generated
    expect(output.decisionResult.explainableDecision).not.toBeNull();
    expect(output.decisionResult.explainableDecision!.factorCards.length).toBe(6);

    // Saved to Firestore / local history
    const cases = await getEmergencyCases(10);
    expect(cases.some((c) => c.patientId === cardiacScenario.patient.patientId)).toBe(true);
  });

  it('Scenario 2: 28yo High-Severity Trauma Emergency', async () => {
    const traumaScenario = DEMO_SCENARIOS[1];
    const output = await emergencyService.processEmergencyCase(
      traumaScenario.patient,
      25,
      'BEST_GUESS',
      true
    );

    const sel = output.decisionResult.selectedHospital!;
    expect(sel.traumaCenterAvailable).toBe(true);
    expect(sel.icuBedsAvailable).toBeGreaterThan(0);
    expect(output.decisionResult.adjustedWeights['C4_SPECIALTY_MATCH']).toBeGreaterThan(0.18);
  });

  it('Scenario 3: 72yo Acute Ischemic Stroke Emergency', async () => {
    const strokeScenario = DEMO_SCENARIOS[2];
    const output = await emergencyService.processEmergencyCase(
      strokeScenario.patient,
      25,
      'BEST_GUESS',
      true
    );

    const sel = output.decisionResult.selectedHospital!;
    expect(sel.neurologyAvailable).toBe(true);
    expect(output.decisionResult.adjustedWeights['C4_SPECIALTY_MATCH']).toBeGreaterThan(0.18);
    expect(output.decisionResult.adjustedWeights['C1_TRAVEL_TIME']).toBeGreaterThan(0.20);
  });
});
