import { AHPResult, CriterionKey, ExplainableDecision, TOPSISResult } from '@/types/decision';
import { Hospital } from '@/types/hospital';
import { PatientEmergencyDetails } from '@/types/emergency';
import { CRITERIA_KEYS, DECISION_CRITERIA } from './criteria';
import { runAHP } from '../ahp/ahp';
import { rankHospitalsWithTOPSIS, RawHospitalRow } from '../topsis/topsis';
import { adjustWeightsForPatient } from './patientWeights';
import { evaluateHospitalEligibility } from './eligibility';
import { generateExplainableDecision } from './explainability';

export interface DecisionEngineExecutionResult {
  patient: PatientEmergencyDetails;
  candidateHospitals: Hospital[];
  eligibleHospitals: Hospital[];
  ineligibleHospitals: { hospital: Hospital; reasons: string[] }[];
  ahpBaselineResult: AHPResult;
  adjustedWeights: Record<CriterionKey, number>;
  topsisResult: TOPSISResult;
  selectedHospital: Hospital | null;
  explainableDecision: ExplainableDecision | null;
  executedAt: string;
}

/**
 * Maps raw hospital operational data into numerical scores (0 to 10 scale or raw values)
 * for each of the 8 MCDM criteria.
 */
export function buildCriterionValues(
  hospital: Hospital,
  patient: PatientEmergencyDetails
): Record<CriterionKey, number> {
  // C1: Travel Time (Cost - minutes)
  const travelTime = Math.max(1, hospital.travelTimeMinutes);

  // C2: Distance (Cost - km)
  const distance = Math.max(0.2, hospital.distanceKm);

  // C3: Emergency Availability (Benefit - score 0 to 10)
  let emergencyScore = hospital.emergencyDepartmentAvailable ? 8.0 : 1.0;
  if (hospital.availabilityStatus === 'AVAILABLE') emergencyScore += 2.0;
  else if (hospital.availabilityStatus === 'LIMITED') emergencyScore += 0.5;
  else emergencyScore = 1.0;

  // C4: Specialty Match (Benefit - score 0 to 10)
  let specialtyScore = 3.0; // base emergency triage
  switch (patient.emergencyType) {
    case 'CARDIAC':
      if (hospital.cardiologyAvailable) specialtyScore = 10.0;
      break;
    case 'TRAUMA':
    case 'ACCIDENT':
      if (hospital.traumaCenterAvailable && hospital.orthopedicAvailable) specialtyScore = 10.0;
      else if (hospital.traumaCenterAvailable || hospital.orthopedicAvailable) specialtyScore = 8.0;
      break;
    case 'STROKE':
      if (hospital.neurologyAvailable) specialtyScore = 10.0;
      break;
    case 'RESPIRATORY':
      if (hospital.ventilatorAvailable && hospital.icuBedsAvailable > 0) specialtyScore = 10.0;
      else if (hospital.ventilatorAvailable) specialtyScore = 8.0;
      break;
    case 'BURN':
      if (hospital.traumaCenterAvailable && hospital.icuBedsAvailable > 0) specialtyScore = 10.0;
      break;
    case 'GENERAL':
    default:
      specialtyScore = hospital.emergencyDepartmentAvailable ? 8.0 : 4.0;
      break;
  }

  // C5: ICU Availability (Benefit - score 0 to 10)
  let icuScore = Math.min(10, hospital.icuBedsAvailable * 2.0);
  if (hospital.icuBedsAvailable === 0) icuScore = 0.5;

  // C6: Hospital Available Capacity (Benefit - score 0 to 10)
  // Higher is better: 100% capacity gives 0.5, 20% capacity gives 8.0
  const capacityScore = Math.max(0.5, (100 - hospital.hospitalCapacityPercent) / 10);

  // C7: Equipment Availability (Benefit - score 0 to 10)
  let equipmentScore = 2.0;
  if (hospital.ventilatorAvailable) equipmentScore += 3.0;
  if (hospital.bloodBankAvailable) equipmentScore += 3.0;
  if (hospital.ambulanceSupportAvailable) equipmentScore += 2.0;

  // C8: Hospital Rating (Benefit - score 1 to 5)
  const ratingScore = Math.max(1.0, hospital.rating);

  return {
    C1_TRAVEL_TIME: travelTime,
    C2_DISTANCE: distance,
    C3_EMERGENCY_AVAILABILITY: emergencyScore,
    C4_SPECIALTY_MATCH: specialtyScore,
    C5_ICU_AVAILABILITY: icuScore,
    C6_HOSPITAL_CAPACITY: capacityScore,
    C7_EQUIPMENT_AVAILABILITY: equipmentScore,
    C8_HOSPITAL_RATING: ratingScore,
  };
}

/**
 * Executes the complete Hybrid AHP + TOPSIS Decision Pipeline.
 */
export function executeHybridDecisionPipeline(
  candidateHospitals: Hospital[],
  patient: PatientEmergencyDetails,
  customPairwiseJudgments?: Record<string, number>
): DecisionEngineExecutionResult {
  // Step 1: Run AHP to determine baseline criteria priority weights
  const ahpBaselineResult = runAHP(CRITERIA_KEYS, customPairwiseJudgments);

  // Step 2: Adjust criteria weights according to patient emergency type and severity
  const adjustedWeights = adjustWeightsForPatient(
    ahpBaselineResult.priorityWeights,
    patient
  );

  // Step 3: Evaluate Hard Constraints (Eligibility check)
  const eligibilityMap = new Map<string, { isEligible: boolean; reasons: string[] }>();
  const eligibleHospitals: Hospital[] = [];
  const ineligibleHospitals: { hospital: Hospital; reasons: string[] }[] = [];

  for (const h of candidateHospitals) {
    const el = evaluateHospitalEligibility(h, patient);
    eligibilityMap.set(h.id, { isEligible: el.isEligible, reasons: el.exclusionReasons });

    if (el.isEligible) {
      eligibleHospitals.push(h);
    } else {
      ineligibleHospitals.push({ hospital: h, reasons: el.exclusionReasons });
    }
  }

  // Step 4: Build Decision Matrix rows
  const rawRows: RawHospitalRow[] = candidateHospitals.map((h) => {
    const el = eligibilityMap.get(h.id)!;
    return {
      hospitalId: h.id,
      hospitalName: h.name,
      isEligible: el.isEligible,
      exclusionReasons: el.reasons,
      values: buildCriterionValues(h, patient),
    };
  });

  // Step 5: Build criteria types map
  const criteriaTypes = Object.fromEntries(
    DECISION_CRITERIA.map((c) => [c.key, c.type])
  ) as Record<CriterionKey, 'COST' | 'BENEFIT'>;

  // Step 6: Run TOPSIS algorithm
  const topsisResult = rankHospitalsWithTOPSIS(
    rawRows,
    adjustedWeights,
    CRITERIA_KEYS,
    criteriaTypes
  );

  // Step 7: Select best eligible hospital
  let selectedHospital: Hospital | null = null;
  let explainableDecision: ExplainableDecision | null = null;

  if (topsisResult.rankedEligibleHospitals.length > 0) {
    const topScore = topsisResult.rankedEligibleHospitals[0];
    selectedHospital =
      candidateHospitals.find((h) => h.id === topScore.hospitalId) || null;

    if (selectedHospital) {
      explainableDecision = generateExplainableDecision(
        topScore,
        selectedHospital,
        topsisResult,
        candidateHospitals,
        patient
      );
    }
  } else if (candidateHospitals.length > 0) {
    // If no hospital is strictly eligible (emergency fallback)
    const topFallbackScore = topsisResult.hospitalScores[0];
    selectedHospital =
      candidateHospitals.find((h) => h.id === topFallbackScore.hospitalId) || null;
  }

  return {
    patient,
    candidateHospitals,
    eligibleHospitals,
    ineligibleHospitals,
    ahpBaselineResult,
    adjustedWeights,
    topsisResult,
    selectedHospital,
    explainableDecision,
    executedAt: new Date().toISOString(),
  };
}
