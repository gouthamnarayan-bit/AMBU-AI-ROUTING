import { describe, it, expect } from 'vitest';
import { evaluateHospitalEligibility } from '@/lib/decision-engine/eligibility';
import { Hospital } from '@/types/hospital';
import { PatientEmergencyDetails } from '@/types/emergency';
import { DEMO_HOSPITALS, DEMO_CENTER_LOCATION } from '@/lib/simulation/demoData';

describe('Clinical Hard Constraints & Eligibility Filtering', () => {
  const basePatient: PatientEmergencyDetails = {
    patientId: 'TEST-PT-01',
    age: 65,
    gender: 'MALE',
    medicalCondition: 'Acute Coronary Syndrome',
    emergencyType: 'CARDIAC',
    severity: 'CRITICAL',
    location: DEMO_CENTER_LOCATION,
    requiresIcu: true,
    requiresVentilator: false,
    requiresTraumaCenter: false,
    requiresSpecialty: ['CARDIOLOGY'],
  };

  it('should mark hospital eligible when all clinical and resource constraints are met', () => {
    const hospital = DEMO_HOSPITALS.find((h) => h.id === 'hosp-001')!; // Metro Central: has cardio, trauma, 6 ICU beds
    const result = evaluateHospitalEligibility(hospital, basePatient);

    expect(result.isEligible).toBe(true);
    expect(result.exclusionReasons.length).toBe(0);
    expect(result.mandatoryChecks.emergencyDepartment).toBe(true);
    expect(result.mandatoryChecks.icuAvailable).toBe(true);
    expect(result.mandatoryChecks.specialtyMatch).toBe(true);
  });

  it('should eliminate hospital with 0 ICU beds when patient requires ICU', () => {
    const hospital = DEMO_HOSPITALS.find((h) => h.id === 'hosp-002')!; // St. Jude: 0 ICU beds
    const result = evaluateHospitalEligibility(hospital, basePatient);

    expect(result.isEligible).toBe(false);
    expect(result.exclusionReasons.some((r) => r.includes('ICU'))).toBe(true);
  });

  it('should eliminate hospital when Emergency Department is closed or diverting', () => {
    const hospital = DEMO_HOSPITALS.find((h) => h.id === 'hosp-007')!; // Highland Clinic: ED unavailable
    const result = evaluateHospitalEligibility(hospital, basePatient);

    expect(result.isEligible).toBe(false);
    expect(result.exclusionReasons.some((r) => r.includes('Emergency Department'))).toBe(true);
  });

  it('should eliminate hospital lacking cardiology for acute cardiac emergency', () => {
    const hospital = DEMO_HOSPITALS.find((h) => h.id === 'hosp-004')!; // Grace Memorial: Neuro & Trauma, no Cardio
    const result = evaluateHospitalEligibility(hospital, basePatient);

    expect(result.isEligible).toBe(false);
    expect(result.exclusionReasons.some((r) => r.includes('Cardiology'))).toBe(true);
  });

  it('should require Trauma Center for critical trauma emergencies', () => {
    const traumaPatient: PatientEmergencyDetails = {
      ...basePatient,
      emergencyType: 'TRAUMA',
      severity: 'CRITICAL',
      requiresTraumaCenter: true,
    };

    const cardioOnlyHospital = DEMO_HOSPITALS.find((h) => h.id === 'hosp-003')!; // Apex Cardiac: no trauma
    const result = evaluateHospitalEligibility(cardioOnlyHospital, traumaPatient);

    expect(result.isEligible).toBe(false);
    expect(result.exclusionReasons.some((r) => r.includes('Trauma'))).toBe(true);
  });
});
