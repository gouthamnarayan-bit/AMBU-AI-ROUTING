import { Hospital, HospitalEligibilityResult } from '@/types/hospital';
import { PatientEmergencyDetails } from '@/types/emergency';

/**
 * Evaluates mandatory clinical and operational constraints.
 * Hospitals failing hard constraints are marked ineligible with clear exclusion reasons.
 */
export function evaluateHospitalEligibility(
  hospital: Hospital,
  patient: PatientEmergencyDetails
): HospitalEligibilityResult {
  const exclusionReasons: string[] = [];

  // Check 1: Emergency Department operational status
  const edAvailable = hospital.emergencyDepartmentAvailable && hospital.availabilityStatus !== 'UNAVAILABLE';
  if (!edAvailable) {
    exclusionReasons.push('Emergency Department is currently closed or diverting all ambulance admissions.');
  }

  // Check 2: ICU availability when required
  const needsIcu = patient.requiresIcu || (patient.severity === 'CRITICAL' && patient.emergencyType !== 'GENERAL');
  let icuOk = true;
  if (needsIcu) {
    if (hospital.icuBedsAvailable <= 0) {
      icuOk = false;
      exclusionReasons.push('Zero available ICU beds for critical patient care.');
    }
  }

  // Check 3: Ventilator availability if required
  if (patient.requiresVentilator && !hospital.ventilatorAvailable) {
    exclusionReasons.push('No mechanical ventilator units currently available for advanced airway support.');
  }

  // Check 4: Clinical specialty requirements
  let specialtyOk = true;

  if (patient.emergencyType === 'CARDIAC' && patient.severity !== 'LOW') {
    if (!hospital.cardiologyAvailable) {
      specialtyOk = false;
      exclusionReasons.push('Lacks dedicated 24/7 Cardiology / Cardiac Catheterization capability for acute cardiac events.');
    }
  }

  if (patient.emergencyType === 'TRAUMA' || patient.emergencyType === 'ACCIDENT') {
    if (!hospital.traumaCenterAvailable && patient.severity === 'CRITICAL') {
      specialtyOk = false;
      exclusionReasons.push('Lacks accredited Trauma Resuscitation Center for critical polytrauma.');
    }
  }

  if (patient.emergencyType === 'STROKE') {
    if (!hospital.neurologyAvailable && (patient.severity === 'CRITICAL' || patient.severity === 'HIGH')) {
      specialtyOk = false;
      exclusionReasons.push('No active Stroke / Neurology team for acute thrombolytic therapy or intervention.');
    }
  }

  // Check 5: General capacity saturation (if 100% full and no beds)
  const operationalOk = hospital.hospitalCapacityPercent < 100 || hospital.generalBedsAvailable > 0 || hospital.icuBedsAvailable > 0;
  if (!operationalOk) {
    exclusionReasons.push('Hospital is at 100% maximum capacity saturation.');
  }

  const isEligible = exclusionReasons.length === 0;

  return {
    hospitalId: hospital.id,
    isEligible,
    exclusionReasons,
    mandatoryChecks: {
      emergencyDepartment: edAvailable,
      specialtyMatch: specialtyOk,
      icuAvailable: icuOk,
      operationalStatus: operationalOk,
    },
  };
}
