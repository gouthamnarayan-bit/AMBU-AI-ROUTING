import { CriterionKey } from '@/types/decision';
import { EmergencyCategory, PatientEmergencyDetails } from '@/types/emergency';
import { CRITERIA_KEYS } from './criteria';

/**
 * Adjusts baseline criteria weights based on clinical emergency category, severity, and patient requirements.
 * Re-normalizes the final weights so the sum always equals 1.0.
 */
export function adjustWeightsForPatient(
  baselineWeights: Record<CriterionKey, number>,
  patient: PatientEmergencyDetails
): Record<CriterionKey, number> {
  const adjusted: Record<CriterionKey, number> = { ...baselineWeights };

  // For life-threatening emergencies, non-clinical criteria (Rating, general capacity, distance)
  // are reduced in priority so critical speed, specialty, and ICU readiness dominate.
  const isCritical = patient.severity === 'CRITICAL';
  const isHigh = patient.severity === 'HIGH';

  if (isCritical) {
    adjusted['C8_HOSPITAL_RATING'] *= 0.4;
    adjusted['C6_HOSPITAL_CAPACITY'] *= 0.6;
    adjusted['C2_DISTANCE'] *= 0.7; // Traffic time matters far more than physical distance
    adjusted['C1_TRAVEL_TIME'] *= 1.35;
    adjusted['C3_EMERGENCY_AVAILABILITY'] *= 1.3;
  } else if (isHigh) {
    adjusted['C8_HOSPITAL_RATING'] *= 0.6;
    adjusted['C6_HOSPITAL_CAPACITY'] *= 0.8;
    adjusted['C1_TRAVEL_TIME'] *= 1.2;
    adjusted['C3_EMERGENCY_AVAILABILITY'] *= 1.15;
  }

  // Emergency-specific clinical weighting
  switch (patient.emergencyType) {
    case 'CARDIAC':
      // Cardiac emergencies (STEMI, arrest, acute coronary syndrome):
      // Require immediate Cath Lab / Cardiology, ICU, and rapid travel time
      adjusted['C4_SPECIALTY_MATCH'] *= 1.75;
      adjusted['C5_ICU_AVAILABILITY'] *= 1.5;
      adjusted['C1_TRAVEL_TIME'] *= 1.25;
      adjusted['C7_EQUIPMENT_AVAILABILITY'] *= 1.15;
      break;

    case 'TRAUMA':
    case 'ACCIDENT':
      // Polytrauma, vehicular crashes, severe hemorrhage:
      // Require Level 1/2 Trauma center, Emergency resuscitation, Orthopedics, Blood bank
      adjusted['C4_SPECIALTY_MATCH'] *= 1.7;
      adjusted['C3_EMERGENCY_AVAILABILITY'] *= 1.4;
      adjusted['C1_TRAVEL_TIME'] *= 1.25;
      adjusted['C7_EQUIPMENT_AVAILABILITY'] *= 1.25;
      break;

    case 'STROKE':
      // Acute Ischemic Stroke / CVA (Thrombolysis window < 4.5 hours, thrombectomy):
      // Neurology / Stroke unit match and travel time are paramount
      adjusted['C4_SPECIALTY_MATCH'] *= 1.8;
      adjusted['C1_TRAVEL_TIME'] *= 1.4;
      adjusted['C3_EMERGENCY_AVAILABILITY'] *= 1.25;
      break;

    case 'RESPIRATORY':
      // ARDS, severe asthma, hypoxia:
      // ICU and mechanical ventilators are critical
      adjusted['C5_ICU_AVAILABILITY'] *= 1.75;
      adjusted['C7_EQUIPMENT_AVAILABILITY'] *= 1.7;
      adjusted['C3_EMERGENCY_AVAILABILITY'] *= 1.25;
      adjusted['C1_TRAVEL_TIME'] *= 1.2;
      break;

    case 'BURN':
      adjusted['C4_SPECIALTY_MATCH'] *= 1.6;
      adjusted['C5_ICU_AVAILABILITY'] *= 1.5;
      adjusted['C3_EMERGENCY_AVAILABILITY'] *= 1.2;
      break;

    case 'GENERAL':
    case 'OTHER':
    default:
      adjusted['C1_TRAVEL_TIME'] *= 1.1;
      adjusted['C3_EMERGENCY_AVAILABILITY'] *= 1.1;
      break;
  }

  // Explicit patient requirements overrides
  if (patient.requiresIcu) {
    adjusted['C5_ICU_AVAILABILITY'] *= 1.35;
  }
  if (patient.requiresVentilator) {
    adjusted['C7_EQUIPMENT_AVAILABILITY'] *= 1.4;
  }

  // Normalize so sum of weights equals exactly 1.0
  let totalSum = 0;
  for (const c of CRITERIA_KEYS) {
    totalSum += adjusted[c];
  }

  const normalized: Record<CriterionKey, number> = {} as Record<CriterionKey, number>;
  for (const c of CRITERIA_KEYS) {
    normalized[c] = Math.round((adjusted[c] / totalSum) * 10000) / 10000;
  }

  return normalized;
}
